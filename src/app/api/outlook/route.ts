/**
 * API : Récupération des emails Outlook avec factures
 * GET /api/outlook - Liste des emails avec pièces jointes
 * POST /api/outlook - Importer les factures sélectionnées
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

// Mots-clés pour filtrer les emails avec factures
const INVOICE_KEYWORDS = ['facture', 'invoice', 'reçu', 'receipt', 'order', 'commande', 'paiement', 'payment'];

// Refresh le token si expiré
async function refreshOutlookToken(userId: string, refreshToken: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

  await prisma.user.update({
    where: { id: userId },
    data: {
      outlookAccessToken: tokens.access_token,
      outlookRefreshToken: tokens.refresh_token || refreshToken,
      outlookTokenExpiry: expiresAt,
    },
  });

  return tokens.access_token;
}

// Obtenir un access token valide
async function getValidAccessToken(user: any) {
  if (!user.outlookAccessToken || !user.outlookRefreshToken) {
    throw new Error('Outlook non connecté');
  }

  // Si le token est expiré ou va expirer dans 5 min
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);

  if (user.outlookTokenExpiry && new Date(user.outlookTokenExpiry) <= expiryBuffer) {
    return await refreshOutlookToken(user.id, user.outlookRefreshToken);
  }

  return user.outlookAccessToken;
}

// GET - Liste des emails avec factures
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        outlookConnected: true,
        outlookAccessToken: true,
        outlookRefreshToken: true,
        outlookTokenExpiry: true,
      },
    });

    if (!user?.outlookConnected) {
      return NextResponse.json({ connected: false, emails: [] });
    }

    // Obtenir un token valide
    const accessToken = await getValidAccessToken({ ...user, id: session.user.id });

    // Paramètres de recherche
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construire le filtre
    let filter = 'hasAttachments eq true';
    if (startDate) {
      filter += ` and receivedDateTime ge ${startDate}`;
    }
    if (endDate) {
      filter += ` and receivedDateTime le ${endDate}`;
    }

    // Rechercher les emails avec pièces jointes
    const searchQuery = INVOICE_KEYWORDS.map(k => `"${k}"`).join(' OR ');
    
    const messagesResponse = await fetch(
      `${GRAPH_API_URL}/me/messages?$filter=${encodeURIComponent(filter)}&$search="${encodeURIComponent(searchQuery)}"&$select=id,subject,from,receivedDateTime,hasAttachments&$top=50&$orderby=receivedDateTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      console.error('Graph API error:', error);
      throw new Error('Erreur lors de la récupération des emails');
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.value || [];

    // Pour chaque message, récupérer les pièces jointes
    const emailsWithAttachments = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const attachmentsResponse = await fetch(
            `${GRAPH_API_URL}/me/messages/${msg.id}/attachments?$select=id,name,contentType,size`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!attachmentsResponse.ok) {
            return null;
          }

          const attachmentsData = await attachmentsResponse.json();
          const attachments = (attachmentsData.value || []).filter(
            (att: any) =>
              att.contentType === 'application/pdf' ||
              att.contentType?.startsWith('image/')
          );

          if (attachments.length === 0) return null;

          return {
            id: msg.id,
            subject: msg.subject,
            from: msg.from?.emailAddress?.address || 'Inconnu',
            date: msg.receivedDateTime,
            attachments: attachments.map((att: any) => ({
              id: att.id,
              filename: att.name,
              mimeType: att.contentType,
              size: att.size,
            })),
          };
        } catch (e) {
          return null;
        }
      })
    );

    const validEmails = emailsWithAttachments.filter(Boolean);

    return NextResponse.json({
      connected: true,
      emails: validEmails,
      count: validEmails.length,
    });
  } catch (error) {
    console.error('Erreur Outlook:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des emails' },
      { status: 500 }
    );
  }
}

// POST - Importer les factures sélectionnées
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, emails } = body;

    if (!companyId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        outlookAccessToken: true,
        outlookRefreshToken: true,
        outlookTokenExpiry: true,
      },
    });

    if (!user?.outlookAccessToken) {
      return NextResponse.json({ error: 'Outlook non connecté' }, { status: 400 });
    }

    const accessToken = await getValidAccessToken({ ...user, id: session.user.id });

    const results: { success: number; errors: number } = { success: 0, errors: 0 };

    // Importer chaque pièce jointe
    for (const email of emails) {
      for (const attachment of email.attachments) {
        try {
          // Télécharger la pièce jointe
          const attachmentResponse = await fetch(
            `${GRAPH_API_URL}/me/messages/${email.id}/attachments/${attachment.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!attachmentResponse.ok) {
            results.errors++;
            continue;
          }

          const attachmentData = await attachmentResponse.json();
          const fileContent = attachmentData.contentBytes;

          if (!fileContent) {
            results.errors++;
            continue;
          }

          // Créer le document en base
          await prisma.document.create({
            data: {
              filename: attachment.filename,
              fileUrl: `data:${attachment.mimeType};base64,${fileContent}`,
              fileType: attachment.mimeType.includes('pdf') ? 'pdf' : 'image',
              fileSize: attachment.size,
              companyId,
              analyzed: false,
            },
          });

          results.success++;
        } catch (e) {
          console.error('Error importing attachment:', e);
          results.errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.success,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Erreur import Outlook:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import' },
      { status: 500 }
    );
  }
}


