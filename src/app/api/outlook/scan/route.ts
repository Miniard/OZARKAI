/**
 * API : Scanner les emails Outlook pour trouver des factures
 * POST - Recherche les emails avec pièces jointes dans une plage de dates
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getValidOutlookToken } from '@/lib/oauth-refresh';

const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

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
    const tokenResult = await getValidOutlookToken(session.user.email);
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      return NextResponse.json({ 
        error: tokenResult.error || 'Token Outlook invalide',
        needsReconnect: true 
      }, { status: 401 });
    }

    // Construire le filtre OData pour Microsoft Graph
    let filter = 'hasAttachments eq true';
    
    // Ajouter les filtres de date si fournis
    if (startDate) {
      const start = new Date(startDate).toISOString();
      filter += ` and receivedDateTime ge ${start}`;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Inclure le jour de fin
      filter += ` and receivedDateTime lt ${end.toISOString()}`;
    }

    // Recherche avec mots-clés pour factures
    const search = 'facture OR invoice OR reçu OR receipt OR order OR commande';

    console.log('📧 Outlook filter:', filter);
    console.log('🔍 Outlook search:', search);

    // Rechercher les emails
    const searchUrl = new URL(`${GRAPH_API_URL}/me/messages`);
    searchUrl.searchParams.set('$filter', filter);
    searchUrl.searchParams.set('$search', `"${search}"`);
    searchUrl.searchParams.set('$select', 'id,subject,from,receivedDateTime,hasAttachments');
    searchUrl.searchParams.set('$top', maxResults.toString());
    searchUrl.searchParams.set('$orderby', 'receivedDateTime desc');

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: { 
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Prefer': 'outlook.body-content-type="text"',
      },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Outlook search error:', errorText);
      
      // Essayer une recherche plus simple si la recherche avancée échoue
      const simpleUrl = `${GRAPH_API_URL}/me/messages?$filter=${encodeURIComponent(filter)}&$top=${maxResults}&$select=id,subject,from,receivedDateTime,hasAttachments&$orderby=receivedDateTime desc`;
      
      const simpleResponse = await fetch(simpleUrl, {
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      });

      if (!simpleResponse.ok) {
        return NextResponse.json({ error: 'Erreur recherche Outlook' }, { status: 500 });
      }

      const simpleData = await simpleResponse.json();
      const emails = await processOutlookEmails(simpleData.value || [], tokenResult.accessToken);
      
      return NextResponse.json({
        success: true,
        emails,
        totalFound: emails.length,
        filter,
      });
    }

    const searchData = await searchResponse.json();
    const messages = searchData.value || [];

    console.log(`📬 Found ${messages.length} emails with attachments`);

    // Récupérer les détails des pièces jointes pour chaque email
    const emails = await processOutlookEmails(messages, tokenResult.accessToken);

    return NextResponse.json({
      success: true,
      emails,
      totalFound: messages.length,
      filter,
    });

  } catch (error) {
    console.error('Outlook scan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

async function processOutlookEmails(messages: any[], accessToken: string) {
  const emails = [];

  for (const msg of messages) {
    try {
      // Récupérer les pièces jointes
      const attachmentsResponse = await fetch(
        `${GRAPH_API_URL}/me/messages/${msg.id}/attachments?$select=id,name,contentType,size,isInline`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!attachmentsResponse.ok) continue;

      const attachmentsData = await attachmentsResponse.json();
      const attachments = (attachmentsData.value || []).filter((a: any) => {
        // Filtrer les inline et garder seulement PDF/images
        if (a.isInline) return false;
        const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        return supportedTypes.some(t => a.contentType?.includes(t));
      });

      if (attachments.length > 0) {
        emails.push({
          id: msg.id,
          subject: msg.subject || 'Sans objet',
          from: msg.from?.emailAddress?.address || 'Inconnu',
          date: msg.receivedDateTime,
          attachmentCount: attachments.length,
          attachments: attachments.map((a: any) => ({
            id: a.id,
            filename: a.name,
            mimeType: a.contentType,
            size: a.size,
          })),
        });
      }
    } catch (e) {
      console.error('Error fetching Outlook email details:', e);
    }
  }

  return emails;
}

