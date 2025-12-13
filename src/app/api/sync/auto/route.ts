/**
 * API : Sync automatique des emails
 * GET - Appelé par Vercel Cron toutes les 15 minutes
 * 
 * Vérifie les nouveaux emails pour tous les utilisateurs connectés
 * et importe automatiquement les factures détectées
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max pour le cron

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getValidGmailToken } from '@/lib/oauth-refresh';
import { detectReceiptInEmailBody, extractEmailBody } from '@/lib/email/detect-receipt';
import { analyzeDocument } from '@/lib/analyze';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

// Vérifier le secret cron pour sécuriser l'endpoint
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // En dev, on autorise sans secret
  if (process.env.NODE_ENV === 'development') return true;
  
  // En prod, vérifier le secret
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  
  return false;
}

export async function GET(request: NextRequest) {
  // Vérifier l'autorisation
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔄 Auto-sync started at', new Date().toISOString());

  const results = {
    usersProcessed: 0,
    gmailSynced: 0,
    outlookSynced: 0,
    documentsImported: 0,
    errors: [] as string[],
  };

  try {
    // Récupérer tous les utilisateurs avec Gmail ou Outlook connecté
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { gmailConnected: true },
          { outlookConnected: true },
        ],
      },
      include: {
        companies: {
          take: 1, // Prendre la première entreprise
        },
      },
    });

    console.log(`📧 Found ${users.length} users with connected email`);

    for (const user of users) {
      results.usersProcessed++;
      
      // S'assurer que l'utilisateur a une entreprise
      if (user.companies.length === 0) {
        console.log(`⚠️ User ${user.email} has no company, skipping`);
        continue;
      }
      
      const companyId = user.companies[0].id;

      // Sync Gmail
      if (user.gmailConnected) {
        try {
          const imported = await syncGmailForUser(user, companyId);
          results.documentsImported += imported;
          if (imported > 0) results.gmailSynced++;
        } catch (e) {
          const error = `Gmail sync error for ${user.email}: ${e}`;
          console.error(error);
          results.errors.push(error);
        }
      }

      // Sync Outlook
      if (user.outlookConnected) {
        try {
          const imported = await syncOutlookForUser(user, companyId);
          results.documentsImported += imported;
          if (imported > 0) results.outlookSynced++;
        } catch (e) {
          const error = `Outlook sync error for ${user.email}: ${e}`;
          console.error(error);
          results.errors.push(error);
        }
      }
    }

    console.log('✅ Auto-sync completed:', results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Auto-sync fatal error:', error);
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: String(error),
      ...results,
    }, { status: 500 });
  }
}

/**
 * Sync Gmail pour un utilisateur
 */
async function syncGmailForUser(user: any, companyId: string): Promise<number> {
  // Obtenir un token valide
  const tokenResult = await getValidGmailToken(user.email);
  if (!tokenResult.success || !tokenResult.accessToken) {
    console.log(`⚠️ Gmail token invalid for ${user.email}`);
    return 0;
  }

  // Calculer la date de début (dernière sync ou connexion)
  const sinceDate = user.lastGmailSync || user.gmailTokenExpiry || new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Construire la requête - emails avec pièces jointes depuis la dernière sync
  const afterDate = new Date(sinceDate);
  const query = `has:attachment (filename:pdf OR filename:jpg OR filename:jpeg OR filename:png) after:${afterDate.getFullYear()}/${afterDate.getMonth() + 1}/${afterDate.getDate()}`;

  console.log(`🔍 Gmail sync for ${user.email}, query: ${query}`);

  // Rechercher les emails
  const searchResponse = await fetch(
    `${GMAIL_API_URL}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
  );

  if (!searchResponse.ok) {
    throw new Error(`Gmail search failed: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const messageIds = searchData.messages || [];

  console.log(`📬 Found ${messageIds.length} new emails for ${user.email}`);

  let importedCount = 0;

  for (const msg of messageIds) {
    try {
      // Récupérer le message complet pour analyser le contenu
      const msgResponse = await fetch(
        `${GMAIL_API_URL}/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
      );

      if (!msgResponse.ok) continue;

      const message = await msgResponse.json();
      
      // Extraire le sujet
      const headers = message.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      
      // Extraire le corps de l'email
      const { text: bodyText, html: bodyHtml } = extractEmailBody(message);
      
      // Détecter si c'est un reçu/facture
      const detection = detectReceiptInEmailBody(subject, bodyText, bodyHtml || undefined);
      
      console.log(`📧 Email "${subject}" - Receipt detection: ${detection.hasReceipt} (confidence: ${detection.confidence})`);
      
      // Si ce n'est pas détecté comme un reçu, on skip
      if (!detection.hasReceipt) {
        continue;
      }

      // Importer les pièces jointes
      const parts = message.payload?.parts || [];
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          // Vérifier le type de fichier
          const filename = part.filename.toLowerCase();
          if (!filename.endsWith('.pdf') && !filename.endsWith('.jpg') && 
              !filename.endsWith('.jpeg') && !filename.endsWith('.png')) {
            continue;
          }

          // Télécharger la pièce jointe
          const attachmentResponse = await fetch(
            `${GMAIL_API_URL}/users/me/messages/${msg.id}/attachments/${part.body.attachmentId}`,
            { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
          );

          if (!attachmentResponse.ok) continue;

          const attachmentData = await attachmentResponse.json();
          const content = Buffer.from(
            attachmentData.data.replace(/-/g, '+').replace(/_/g, '/'),
            'base64'
          );

          // Sauvegarder le fichier
          const uploadsDir = join(process.cwd(), 'public', 'uploads');
          try { await mkdir(uploadsDir, { recursive: true }); } catch {}

          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 10);
          const sanitizedFilename = part.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
          const savedFilename = `${timestamp}-${randomStr}-${sanitizedFilename}`;
          const filepath = join(uploadsDir, savedFilename);
          
          await writeFile(filepath, content);

          // Créer l'entrée en base
          const document = await prisma.document.create({
            data: {
              filename: part.filename,
              fileUrl: `/uploads/${savedFilename}`,
              fileType: part.mimeType || 'application/octet-stream',
              fileSize: content.length,
              companyId,
              analyzed: false,
              source: 'GMAIL',
              analysisData: {
                sourceEmail: from,
                emailSubject: subject,
                receiptConfidence: detection.confidence,
                detectionReasons: detection.reasons,
                autoSynced: true,
              },
            },
          });

          importedCount++;
          
          // Analyse IA automatique
          try {
            await analyzeDocument(document.id);
          } catch (e) {
            console.error('⚠️ Auto-analysis failed:', e);
          }
        }
      }
    } catch (e) {
      console.error(`Error processing email ${msg.id}:`, e);
    }
  }

  // Mettre à jour la date de dernière sync
  await prisma.user.update({
    where: { id: user.id },
    data: { lastGmailSync: new Date() },
  });

  return importedCount;
}

/**
 * Sync Outlook pour un utilisateur
 */
async function syncOutlookForUser(user: any, companyId: string): Promise<number> {
  // Vérifier le token
  if (!user.outlookAccessToken) {
    console.log(`⚠️ No Outlook token for ${user.email}`);
    return 0;
  }

  // TODO: Implémenter le refresh token Outlook si nécessaire
  const accessToken = user.outlookAccessToken;

  // Calculer la date de début
  const sinceDate = user.lastOutlookSync || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sinceISO = new Date(sinceDate).toISOString();

  console.log(`🔍 Outlook sync for ${user.email} since ${sinceISO}`);

  // Rechercher les emails avec pièces jointes
  const searchUrl = new URL(`${GRAPH_API_URL}/me/messages`);
  searchUrl.searchParams.set('$filter', `hasAttachments eq true and receivedDateTime ge ${sinceISO}`);
  searchUrl.searchParams.set('$select', 'id,subject,from,receivedDateTime,body');
  searchUrl.searchParams.set('$top', '50');

  const searchResponse = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchResponse.ok) {
    if (searchResponse.status === 401) {
      console.log(`⚠️ Outlook token expired for ${user.email}`);
      return 0;
    }
    throw new Error(`Outlook search failed: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const messages = searchData.value || [];

  console.log(`📬 Found ${messages.length} new Outlook emails for ${user.email}`);

  let importedCount = 0;

  for (const msg of messages) {
    try {
      const subject = msg.subject || '';
      const from = msg.from?.emailAddress?.address || '';
      const bodyText = msg.body?.content || '';
      
      // Détecter si c'est un reçu/facture
      const detection = detectReceiptInEmailBody(subject, bodyText);
      
      if (!detection.hasReceipt) {
        continue;
      }

      // Récupérer les pièces jointes
      const attachmentsResponse = await fetch(
        `${GRAPH_API_URL}/me/messages/${msg.id}/attachments`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!attachmentsResponse.ok) continue;

      const attachmentsData = await attachmentsResponse.json();
      const attachments = attachmentsData.value || [];

      for (const attachment of attachments) {
        if (!attachment.name || !attachment.contentBytes) continue;

        const filename = attachment.name.toLowerCase();
        if (!filename.endsWith('.pdf') && !filename.endsWith('.jpg') && 
            !filename.endsWith('.jpeg') && !filename.endsWith('.png')) {
          continue;
        }

        const content = Buffer.from(attachment.contentBytes, 'base64');

        // Sauvegarder le fichier
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        try { await mkdir(uploadsDir, { recursive: true }); } catch {}

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const sanitizedFilename = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const savedFilename = `${timestamp}-${randomStr}-${sanitizedFilename}`;
        const filepath = join(uploadsDir, savedFilename);
        
        await writeFile(filepath, content);

        // Créer l'entrée en base
        const document = await prisma.document.create({
          data: {
            filename: attachment.name,
            fileUrl: `/uploads/${savedFilename}`,
            fileType: attachment.contentType || 'application/octet-stream',
            fileSize: content.length,
            companyId,
            analyzed: false,
            source: 'OUTLOOK',
            analysisData: {
              sourceEmail: from,
              emailSubject: subject,
              receiptConfidence: detection.confidence,
              detectionReasons: detection.reasons,
              autoSynced: true,
            },
          },
        });

        importedCount++;
        
        // Analyse IA automatique
        try {
          await analyzeDocument(document.id);
        } catch (e) {
          console.error('⚠️ Auto-analysis failed:', e);
        }
      }
    } catch (e) {
      console.error(`Error processing Outlook email ${msg.id}:`, e);
    }
  }

  // Mettre à jour la date de dernière sync
  await prisma.user.update({
    where: { id: user.id },
    data: { lastOutlookSync: new Date() },
  });

  return importedCount;
}

