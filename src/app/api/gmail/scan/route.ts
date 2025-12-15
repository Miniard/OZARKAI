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
    const { companyId, startDate, endDate, maxResults = 30 } = body; // Limité pour éviter timeout

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

    console.log(`📬 Found ${messageIds.length} potential invoice emails`);

    // ⚡ OPTIMISATION : Fetch en parallèle avec format=metadata (plus rapide)
    const emails: any[] = [];
    const batchSize = 10; // Traiter par lots de 10
    
    for (let i = 0; i < Math.min(messageIds.length, maxResults); i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      
      // Fetch en parallèle
      const batchResults = await Promise.all(
        batch.map(async (msg: any) => {
          try {
            // Format=metadata est BEAUCOUP plus rapide
            const msgResponse = await fetch(
              `${GMAIL_API_URL}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
            );
            if (!msgResponse.ok) return null;
            return await msgResponse.json();
          } catch { return null; }
        })
      );
      
      // Traiter les résultats du batch
      for (const msgData of batchResults) {
        if (!msgData) continue;
        
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Sans objet';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Inconnu';
        const dateStr = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;
        const snippet = msgData.snippet || '';
        
        let date = new Date();
        if (dateStr) { try { date = new Date(dateStr); } catch {} }
        
        // 🔍 FILTRE RAPIDE sur sujet + snippet (sans fetch le body complet)
        const textToCheck = `${subject} ${snippet}`;
        
        const hasInvoiceTermInSubject = hasInvoiceTerm(subject);
        const hasBillingTermInSubject = hasBillingTerm(subject);
        const hasPriceInText = containsPrice(textToCheck);
        const hasAmountTermInText = hasAmountTerm(textToCheck);
        const excluded = isExcluded(textToCheck);
        
        // Logique simplifiée pour la vitesse
        const isInvoice = !excluded && (
          hasInvoiceTermInSubject ||
          (hasBillingTermInSubject && hasPriceInText) ||
          (hasPriceInText && hasAmountTermInText)
        );
        
        if (isInvoice) {
          emails.push({
            id: msgData.id,
            subject,
            from,
            date: date.toISOString(),
            snippet: snippet.substring(0, 100),
            // On fetche les attachments seulement à l'import, pas au scan
            attachmentCount: 0,
            attachments: [],
            invoiceType: 'unknown', // Déterminé à l'import
          });
        }
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

