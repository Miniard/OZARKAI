/**
 * API : Importer une facture depuis Gmail
 * POST - Importe les pièces jointes d'un email
 * 
 * ANALYSE IA AUTOMATIQUE après import !
 * + REFRESH TOKEN AUTOMATIQUE
 * + COMPATIBLE SERVERLESS (Netlify/Vercel) - stockage base64
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { analyzeDocument } from '@/lib/analyze';
import { getValidGmailToken } from '@/lib/oauth-refresh';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';

// Fonction récursive pour trouver toutes les pièces jointes (même imbriquées)
function findAttachmentParts(parts: any[], attachments: any[] = []): any[] {
  for (const part of parts) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      const ext = part.filename.toLowerCase().split('.').pop();
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        attachments.push(part);
      }
    }
    if (part.parts && part.parts.length > 0) {
      findAttachmentParts(part.parts, attachments);
    }
  }
  return attachments;
}

// Extrait le contenu HTML d'un email (pour les factures sans PJ)
function extractHtmlContent(parts: any[]): string | null {
  for (const part of parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      try {
        return Buffer.from(
          part.body.data.replace(/-/g, '+').replace(/_/g, '/'),
          'base64'
        ).toString('utf-8');
      } catch {
        return null;
      }
    }
    if (part.parts && part.parts.length > 0) {
      const html = extractHtmlContent(part.parts);
      if (html) return html;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { emailId, companyId } = await request.json();

    if (!emailId || !companyId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Obtenir un token valide (refresh automatique si nécessaire)
    const tokenResult = await getValidGmailToken(session.user.email);
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      return NextResponse.json({ 
        error: tokenResult.error || 'Gmail non connecté',
        needsReconnect: true 
      }, { status: 401 });
    }
    
    const accessToken = tokenResult.accessToken;

    // Vérifier que l'entreprise appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer les détails de l'email avec les pièces jointes
    const messageResponse = await fetch(
      `${GMAIL_API_URL}/users/me/messages/${emailId}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!messageResponse.ok) {
      return NextResponse.json({ error: 'Erreur Gmail API' }, { status: 500 });
    }

    const message = await messageResponse.json();
    const importedDocuments: string[] = [];

    // Trouver les pièces jointes récursivement (gère les emails multipart imbriqués)
    const topLevelParts = message.payload?.parts || [];
    const attachmentParts = findAttachmentParts(topLevelParts);
    
    // Aussi vérifier si l'attachement est directement sur le payload (email simple)
    if (message.payload?.filename && message.payload?.body?.attachmentId) {
      const ext = message.payload.filename.toLowerCase().split('.').pop();
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        attachmentParts.push(message.payload);
      }
    }

    console.log(`📎 Email ${emailId}: ${attachmentParts.length} pièce(s) jointe(s) à importer`);
    
    // Si pas de pièces jointes, essayer d'extraire le HTML (facture dans le corps)
    if (attachmentParts.length === 0) {
      const htmlContent = extractHtmlContent(topLevelParts);
      
      if (htmlContent && htmlContent.length > 100) {
        console.log(`📧 Facture HTML détectée (${Math.round(htmlContent.length / 1024)}KB)`);
        
        // Extraire le sujet pour le nom de fichier
        const headers = message.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'facture';
        const sanitizedSubject = subject.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, '').substring(0, 50);
        const filename = `${sanitizedSubject}.html`;
        
        // Créer une data URL pour le HTML
        const base64Html = Buffer.from(htmlContent).toString('base64');
        const dataUrl = `data:text/html;base64,${base64Html}`;
        
        // Créer l'entrée en base
        const document = await prisma.document.create({
          data: {
            filename,
            fileUrl: dataUrl,
            fileType: 'text/html',
            fileSize: htmlContent.length,
            companyId,
            analyzed: false,
            source: 'GMAIL',
          },
        });
        
        importedDocuments.push(document.id);
        
        // 🔥 ANALYSE IA AUTOMATIQUE
        try {
          console.log('🔍 Analyse HTML auto:', document.id, filename);
          await analyzeDocument(document.id);
          console.log('✅ Analyse HTML terminée:', filename);
        } catch (e) {
          console.error('⚠️ Erreur analyse HTML:', filename, e);
        }
      } else {
        console.log(`⚠️ Email ${emailId}: pas de pièces jointes ni de contenu HTML exploitable`);
      }
    }
    
    for (const part of attachmentParts) {
      try {
        // Télécharger la pièce jointe
        const attachmentResponse = await fetch(
          `${GMAIL_API_URL}/users/me/messages/${emailId}/attachments/${part.body.attachmentId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!attachmentResponse.ok) {
          console.error(`❌ Erreur téléchargement pièce jointe: ${part.filename}`);
          continue;
        }

        const attachmentData = await attachmentResponse.json();
        
        // Gmail renvoie du base64url, on convertit en base64 standard
        const base64Data = attachmentData.data
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        
        // Déterminer le MIME type
        const mimeType = part.mimeType || 'application/octet-stream';
        
        // Créer une data URL (compatible serverless - pas de filesystem)
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        
        // Calculer la taille approximative
        const fileSize = Math.round((base64Data.length * 3) / 4);

        console.log(`📄 Import: ${part.filename} (${Math.round(fileSize / 1024)}KB)`);

        // Créer l'entrée en base avec la data URL
        const document = await prisma.document.create({
          data: {
            filename: part.filename,
            fileUrl: dataUrl,
            fileType: mimeType,
            fileSize: fileSize,
            companyId,
            analyzed: false,
            source: 'GMAIL',
          },
        });

        importedDocuments.push(document.id);
        
        // 🔥 ANALYSE IA AUTOMATIQUE
        try {
          console.log('🔍 Analyse Gmail auto:', document.id, part.filename);
          await analyzeDocument(document.id);
          console.log('✅ Analyse terminée:', part.filename);
        } catch (e) {
          console.error('⚠️ Erreur analyse Gmail:', part.filename, e);
        }
      } catch (partError) {
        console.error(`❌ Erreur import pièce jointe ${part.filename}:`, partError);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: importedDocuments.length,
      documentIds: importedDocuments,
      analyzed: true,
    });
  } catch (error) {
    console.error('Erreur import Gmail:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




