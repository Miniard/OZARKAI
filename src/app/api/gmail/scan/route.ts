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

// ============================================
// DÉTECTION INTELLIGENTE DE FACTURES
// Une facture a toujours : un montant, un émetteur, souvent un numéro
// ============================================

// Termes qui indiquent CLAIREMENT une facture
const INVOICE_TERMS = [
  'facture', 'invoice', 'reçu', 'recu', 'receipt',
  'avoir', 'devis', 'quote', 'proforma',
  'note de frais', 'quittance',
];

// Termes de facturation/paiement
const BILLING_TERMS = [
  'prélèvement', 'prelevement', 'prélevé', 'preleve',
  'débité', 'debite', 'débit', 'debit',
  'paiement', 'payment', 'payé', 'paid',
  'votre commande', 'your order',
  'confirmation de paiement', 'payment confirmation',
  'transaction', 'achat', 'purchase',
  'abonnement', 'subscription',
  'renouvellement', 'renewal',
];

// Termes de montant (indiquent un document financier)
const AMOUNT_TERMS = [
  'montant', 'amount', 'total',
  'ttc', 'ht', 'tva', 'vat', 'tax',
  'prix', 'price', 'tarif',
  'sous-total', 'subtotal',
];

// Mots-clés dans les noms de fichiers
const FILENAME_KEYWORDS = [
  'facture', 'invoice', 'recu', 'receipt', 'avoir', 'devis', 'quote',
];

// EXCLUSIONS STRICTES (newsletters, marketing)
const EXCLUDE_TERMS = [
  'newsletter', 'unsubscribe', 'désabonner', 'se désinscrire',
  'voir dans le navigateur', 'view in browser',
  'soldes', 'promo', 'promotion', 'offre exclusive',
  'nouveautés', 'new arrivals', 'nouvelle collection',
  'découvrez', 'discover',
];

// Regex pour détecter des montants (12,99 €, $50.00, 100€, etc.)
const PRICE_REGEX = /(\d+[,\.]\d{2}\s*[€$£]|[€$£]\s*\d+[,\.]\d{2}|\d+\s*[€$£]|\d+[,\.]\d{2}\s*(eur|usd|euros?))/i;

// Vérifie si le texte contient un prix
function containsPrice(text: string): boolean {
  if (!text) return false;
  return PRICE_REGEX.test(text);
}

// Vérifie si c'est clairement une facture (terme explicite)
function hasInvoiceTerm(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return INVOICE_TERMS.some(term => lowerText.includes(term));
}

// Vérifie si c'est un email de facturation/paiement
function hasBillingTerm(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BILLING_TERMS.some(term => lowerText.includes(term));
}

// Vérifie si contient des termes de montant
function hasAmountTerm(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return AMOUNT_TERMS.some(term => lowerText.includes(term));
}

// Vérifie si c'est du spam/newsletter à exclure
function isExcluded(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return EXCLUDE_TERMS.some(term => lowerText.includes(term));
}

// Vérifie si un nom de fichier ressemble à une facture
function isInvoiceFilename(filename: string): boolean {
  if (!filename) return false;
  const lowerFilename = filename.toLowerCase();
  return FILENAME_KEYWORDS.some(keyword => lowerFilename.includes(keyword));
}

// Extrait le texte du body d'un email (snippet ou contenu)
function extractBodyText(parts: any[], text: string = ''): string {
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      try {
        const decoded = Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
        text += ' ' + decoded.substring(0, 1000); // Limite pour performance
      } catch {}
    }
    if (part.parts) {
      text = extractBodyText(part.parts, text);
    }
  }
  return text;
}

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
    const { companyId, startDate, endDate, maxResults = 100 } = body;

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
    // Rechercher TOUS les emails qui ressemblent à des factures (avec ou sans PJ)
    // On filtre ensuite avec notre algorithme intelligent
    let query = '(facture OR invoice OR reçu OR receipt OR paiement OR payment OR commande OR order OR prélèvement OR abonnement) -category:promotions -category:social';
    
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

        // 🔍 DÉTECTION INTELLIGENTE DE FACTURE
        // Une facture a : terme facture OU (terme billing + montant) OU (montant dans subject)
        const snippet = msgData.snippet || '';
        const bodyText = extractBodyText(parts);
        const subjectLower = subject.toLowerCase();
        const allText = `${subject} ${snippet} ${bodyText}`;
        
        // Critères de détection
        const hasInvoiceTermInSubject = hasInvoiceTerm(subject);
        const hasInvoiceTermInBody = hasInvoiceTerm(allText);
        const hasBillingTermInSubject = hasBillingTerm(subject);
        const hasBillingTermInBody = hasBillingTerm(allText);
        const hasPriceInSubject = containsPrice(subject);
        const hasPriceInBody = containsPrice(allText);
        const hasAmountTermInBody = hasAmountTerm(allText);
        const hasInvoiceFile = attachments.some(a => isInvoiceFilename(a.filename));
        
        // Exclure newsletters/promos
        const excluded = isExcluded(allText);
        
        // LOGIQUE DE DÉTECTION :
        // ✅ FACTURE si :
        //    - Terme "facture/invoice/reçu" dans sujet OU
        //    - Nom de fichier = facture/invoice OU
        //    - (Terme billing + prix) dans le même email OU
        //    - Prix dans le sujet + terme montant dans body
        const isInvoice = !excluded && (
          hasInvoiceTermInSubject ||
          hasInvoiceFile ||
          (hasInvoiceTermInBody && hasPriceInBody) ||
          (hasBillingTermInSubject && hasPriceInBody) ||
          (hasPriceInSubject && hasAmountTermInBody) ||
          (hasBillingTermInBody && hasPriceInBody && hasAmountTermInBody)
        );
        
        // Type de facture
        const invoiceType = attachments.length > 0 ? 'attachment' : 'html';
        const hasHtmlContent = parts.some((p: any) => p.mimeType === 'text/html');
        
        console.log(`📧 "${subject.substring(0, 50)}..." - ${isInvoice ? '✅ FACTURE' : '❌'} (inv:${hasInvoiceTermInSubject}, bill:${hasBillingTermInSubject}, price:${hasPriceInSubject}, file:${hasInvoiceFile})`);

        // Garder toutes les factures (avec ou sans PJ)
        if (isInvoice) {
          emails.push({
            id: msg.id,
            subject,
            from,
            date: date.toISOString(),
            attachmentCount: attachments.length,
            attachments,
            invoiceType,
            hasHtmlContent,
          });
        }
      } catch (e) {
        console.error('Error fetching email details:', e);
      }
    }

    console.log(`✅ Scan terminé: ${emails.length} factures trouvées sur ${messageIds.length} emails avec PJ`);
    
    return NextResponse.json({
      success: true,
      emails,
      totalFound: messageIds.length,
      invoicesFound: emails.length,
      query,
    });

  } catch (error) {
    console.error('Gmail scan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

