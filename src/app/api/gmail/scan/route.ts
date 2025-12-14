/**
 * API : Scanner les emails Gmail pour trouver des factures
 * POST - Recherche les emails avec pièces jointes dans une plage de dates
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getValidGmailToken } from '@/lib/oauth-refresh';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';

// Fonction récursive pour trouver toutes les pièces jointes (même imbriquées)
function findAttachments(parts: any[], attachments: any[] = []): any[] {
  for (const part of parts) {
    // Si c'est une pièce jointe
    if (part.filename && part.filename.length > 0 && part.body) {
      const ext = part.filename.toLowerCase().split('.').pop();
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        attachments.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
        });
      }
    }
    // Si c'est un multipart, chercher récursivement dans les sous-parties
    if (part.parts && part.parts.length > 0) {
      findAttachments(part.parts, attachments);
    }
  }
  return attachments;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, startDate, endDate, maxResults = 50 } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId manquant' }, { status: 400 });
    }

    // Vérifier que l'utilisateur possède l'entreprise
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Obtenir un token valide (refresh automatique si nécessaire)
    const tokenResult = await getValidGmailToken(session.user.email);
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      return NextResponse.json({ 
        error: tokenResult.error || 'Token Gmail invalide',
        needsReconnect: true 
      }, { status: 401 });
    }

    // Construire la requête de recherche Gmail
    // Rechercher les emails avec pièces jointes PDF/images (sans filtre de mots-clés pour être moins restrictif)
    let query = 'has:attachment (filename:pdf OR filename:jpg OR filename:jpeg OR filename:png)';
    
    // Ajouter les filtres de date si fournis
    if (startDate) {
      const start = new Date(startDate);
      query += ` after:${start.getFullYear()}/${start.getMonth() + 1}/${start.getDate()}`;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      query += ` before:${end.getFullYear()}/${end.getMonth() + 1}/${end.getDate() + 1}`; // +1 pour inclure le jour
    }

    // NOTE: On ne filtre plus par mots-clés pour récupérer TOUS les PDFs/images
    // L'utilisateur peut trier après dans l'interface

    console.log('📧 Gmail search query:', query);

    // Rechercher les emails
    const searchUrl = `${GMAIL_API_URL}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Gmail search error:', errorText);
      return NextResponse.json({ error: 'Erreur recherche Gmail' }, { status: 500 });
    }

    const searchData = await searchResponse.json();
    const messageIds = searchData.messages || [];

    console.log(`📬 Found ${messageIds.length} emails with attachments`);

    // Récupérer les détails de chaque email
    const emails = [];
    
    for (const msg of messageIds.slice(0, maxResults)) {
      try {
        // IMPORTANT: format=full pour avoir les pièces jointes
        const msgResponse = await fetch(
          `${GMAIL_API_URL}/users/me/messages/${msg.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
          }
        );

        if (!msgResponse.ok) continue;

        const msgData = await msgResponse.json();
        
        // Extraire les headers
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Sans objet';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Inconnu';
        const dateStr = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;
        
        let date = new Date();
        if (dateStr) {
          try {
            date = new Date(dateStr);
          } catch {}
        }

        // Chercher les pièces jointes récursivement dans toute la structure MIME
        const parts = msgData.payload?.parts || [];
        const attachments = findAttachments(parts);
        
        // Aussi vérifier si l'attachement est directement sur le payload (email simple)
        if (msgData.payload?.filename && msgData.payload?.body?.attachmentId) {
          const ext = msgData.payload.filename.toLowerCase().split('.').pop();
          if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
            attachments.push({
              id: msgData.payload.body.attachmentId,
              filename: msgData.payload.filename,
              mimeType: msgData.payload.mimeType,
              size: msgData.payload.body.size || 0,
            });
          }
        }

        console.log(`📎 Email "${subject}" - ${attachments.length} pièce(s) jointe(s) trouvée(s)`);

        if (attachments.length > 0) {
          emails.push({
            id: msg.id,
            subject,
            from,
            date: date.toISOString(),
            attachmentCount: attachments.length,
            attachments,
          });
        }
      } catch (e) {
        console.error('Error fetching email details:', e);
      }
    }

    return NextResponse.json({
      success: true,
      emails,
      totalFound: messageIds.length,
      query,
    });

  } catch (error) {
    console.error('Gmail scan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

