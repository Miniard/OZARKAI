/**
 * API Route pour l'intégration Gmail
 * Gère le scan et l'import des factures depuis Gmail
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Rafraîchir le token d'accès Gmail si expiré
 */
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token');
      return null;
    }

    const tokens = await response.json();
    
    // Mettre à jour le token en base
    await prisma.user.update({
      where: { id: userId },
      data: {
        gmailAccessToken: tokens.access_token,
        gmailTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Obtenir un token valide (rafraîchir si nécessaire)
 */
async function getValidAccessToken(user: {
  id: string;
  gmailAccessToken: string | null;
  gmailRefreshToken: string | null;
  gmailTokenExpiry: Date | null;
}): Promise<string | null> {
  if (!user.gmailAccessToken || !user.gmailRefreshToken) {
    return null;
  }

  // Vérifier si le token est expiré (avec 5 min de marge)
  const isExpired = user.gmailTokenExpiry && 
    new Date(user.gmailTokenExpiry).getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    return await refreshAccessToken(user.id, user.gmailRefreshToken);
  }

  return user.gmailAccessToken;
}

/**
 * GET /api/gmail - Scanner les emails pour trouver des factures
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        gmailConnected: true,
        gmailAccessToken: true,
        gmailRefreshToken: true,
        gmailTokenExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (!user.gmailConnected) {
      return NextResponse.json({ error: 'Gmail non connecté', connected: false }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(user);
    if (!accessToken) {
      return NextResponse.json({ error: 'Token invalide, reconnectez Gmail' }, { status: 401 });
    }

    // Rechercher les emails factures (avec OU sans pièces jointes)
    const searchQuery = 'subject:(facture OR invoice OR reçu OR receipt OR commande OR order) -category:promotions';
    
    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      console.error('Gmail API error:', error);
      return NextResponse.json({ error: 'Erreur Gmail API' }, { status: 500 });
    }

    const messagesData = await messagesResponse.json();
    const messageIds = messagesData.messages || [];

    // Récupérer les détails de chaque email
    const emails = await Promise.all(
      messageIds.slice(0, 15).map(async (msg: { id: string }) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!detailResponse.ok) return null;
        
        const detail = await detailResponse.json();
        const headers = detail.payload?.headers || [];
        
        const getHeader = (name: string) => 
          headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        // Récupérer les pièces jointes
        const attachments: { id: string; filename: string; mimeType: string; size: number }[] = [];
        
        const findAttachments = (part: { filename?: string; body?: { attachmentId?: string; size?: number }; mimeType?: string; parts?: unknown[] }) => {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              id: part.body.attachmentId,
              filename: part.filename,
              mimeType: part.mimeType || 'application/octet-stream',
              size: part.body.size || 0,
            });
          }
          if (part.parts) {
            part.parts.forEach((p) => findAttachments(p as typeof part));
          }
        };

        // Besoin de refetch avec format=full pour les pièces jointes
        const fullResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        if (fullResponse.ok) {
          const fullDetail = await fullResponse.json();
          if (fullDetail.payload) {
            findAttachments(fullDetail.payload);
          }
        }

        // Détecter si c'est une facture HTML (pas de PJ mais contenu HTML)
        const hasHtmlContent = fullResponse.ok;
        const hasPdfAttachments = attachments.some(a => 
          a.mimeType === 'application/pdf' || 
          a.filename.toLowerCase().endsWith('.pdf')
        );
        const hasImageAttachments = attachments.some(a => 
          a.mimeType?.startsWith('image/') || 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(a.filename)
        );

        return {
          id: msg.id,
          threadId: detail.threadId,
          subject: getHeader('Subject') || '(Sans sujet)',
          from: getHeader('From'),
          date: getHeader('Date'),
          attachments: attachments.filter(a => 
            a.mimeType === 'application/pdf' || 
            a.filename.toLowerCase().endsWith('.pdf') ||
            a.mimeType?.startsWith('image/') ||
            /\.(jpg|jpeg|png|gif|webp)$/i.test(a.filename)
          ),
          // Nouveau : type de facture
          invoiceType: hasPdfAttachments ? 'pdf' : hasImageAttachments ? 'image' : 'html',
          hasHtmlContent,
        };
      })
    );

    // Garder TOUS les emails factures (avec ou sans PJ)
    const validEmails = emails.filter(e => e !== null);

    return NextResponse.json({
      emails: validEmails,
      total: validEmails.length,
    });
  } catch (error) {
    console.error('Erreur Gmail scan:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/gmail - Importer des pièces jointes comme documents
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, attachmentId, filename, companyId } = body;

    if (!messageId || !attachmentId || !companyId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        gmailConnected: true,
        gmailAccessToken: true,
        gmailRefreshToken: true,
        gmailTokenExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (!user.gmailConnected) {
      return NextResponse.json({ error: 'Gmail non connecté' }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(user);
    if (!accessToken) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Télécharger la pièce jointe
    const attachmentResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!attachmentResponse.ok) {
      return NextResponse.json({ error: 'Impossible de télécharger la pièce jointe' }, { status: 500 });
    }

    const attachmentData = await attachmentResponse.json();
    const fileData = attachmentData.data; // Base64 encoded
    const fileSize = attachmentData.size;

    // Décoder le base64 (URL-safe base64)
    const base64Data = fileData.replace(/-/g, '+').replace(/_/g, '/');
    
    // Pour l'instant, on stocke le fichier en base64 dans l'URL (en production, utiliser S3/Supabase)
    // C'est une solution temporaire pour la démo
    const fileUrl = `data:application/pdf;base64,${base64Data}`;

    // Créer le document en base
    const document = await prisma.document.create({
      data: {
        filename: filename || 'facture.pdf',
        fileUrl: fileUrl,
        fileType: 'pdf',
        fileSize: fileSize || 0,
        companyId: companyId,
        analyzed: false,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      filename: document.filename,
    });
  } catch (error) {
    console.error('Erreur Gmail import:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
