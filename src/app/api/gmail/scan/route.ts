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
        const msgResponse = await fetch(
          `${GMAIL_API_URL}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
          }
        );

        if (!msgResponse.ok) continue;

        const msgData = await msgResponse.json();
        
        // Extraire les headers
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sans objet';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
        const dateStr = headers.find((h: any) => h.name === 'Date')?.value;
        
        let date = new Date();
        if (dateStr) {
          try {
            date = new Date(dateStr);
          } catch {}
        }

        // Compter les pièces jointes
        const parts = msgData.payload?.parts || [];
        const attachments = parts.filter((p: any) => p.filename && p.body?.attachmentId);

        if (attachments.length > 0) {
          emails.push({
            id: msg.id,
            subject,
            from,
            date: date.toISOString(),
            attachmentCount: attachments.length,
            attachments: attachments.map((a: any) => ({
              id: a.body.attachmentId,
              filename: a.filename,
              mimeType: a.mimeType,
              size: a.body.size,
            })),
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

