/**
 * Module d'analyse IA des documents
 * 
 * Extrait automatiquement via OpenAI :
 * - Montant total, TVA, HT
 * - Fournisseur (nom, adresse, email, téléphone, TVA)
 * - Numéro de facture, date
 * - Lignes détaillées (produits/services)
 * - Type de document
 * 
 * Supporte : Images (JPG, PNG) et PDFs
 */

import { prisma } from '@/lib/db/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Logos des marques connues (URL publiques)
const BRAND_LOGOS: Record<string, string> = {
  'apple': 'https://logo.clearbit.com/apple.com',
  'amazon': 'https://logo.clearbit.com/amazon.com',
  'google': 'https://logo.clearbit.com/google.com',
  'netflix': 'https://logo.clearbit.com/netflix.com',
  'spotify': 'https://logo.clearbit.com/spotify.com',
  'uber': 'https://logo.clearbit.com/uber.com',
  'bolt': 'https://logo.clearbit.com/bolt.eu',
  'lyft': 'https://logo.clearbit.com/lyft.com',
  'deliveroo': 'https://logo.clearbit.com/deliveroo.com',
  'uber eats': 'https://logo.clearbit.com/ubereats.com',
  'just eat': 'https://logo.clearbit.com/justeat.com',
  'microsoft': 'https://logo.clearbit.com/microsoft.com',
  'adobe': 'https://logo.clearbit.com/adobe.com',
  'dropbox': 'https://logo.clearbit.com/dropbox.com',
  'slack': 'https://logo.clearbit.com/slack.com',
  'zoom': 'https://logo.clearbit.com/zoom.us',
  'notion': 'https://logo.clearbit.com/notion.so',
  'figma': 'https://logo.clearbit.com/figma.com',
  'canva': 'https://logo.clearbit.com/canva.com',
  'openai': 'https://logo.clearbit.com/openai.com',
  'replicate': 'https://logo.clearbit.com/replicate.com',
  'vercel': 'https://logo.clearbit.com/vercel.com',
  'netlify': 'https://logo.clearbit.com/netlify.com',
  'aws': 'https://logo.clearbit.com/aws.amazon.com',
  'paypal': 'https://logo.clearbit.com/paypal.com',
  'stripe': 'https://logo.clearbit.com/stripe.com',
  'ikea': 'https://logo.clearbit.com/ikea.com',
  'carrefour': 'https://logo.clearbit.com/carrefour.com',
  'leclerc': 'https://logo.clearbit.com/e-leclerc.com',
  'lidl': 'https://logo.clearbit.com/lidl.com',
  'aldi': 'https://logo.clearbit.com/aldi.com',
  'orange': 'https://logo.clearbit.com/orange.com',
  'sfr': 'https://logo.clearbit.com/sfr.fr',
  'free': 'https://logo.clearbit.com/free.fr',
  'bouygues': 'https://logo.clearbit.com/bouyguestelecom.fr',
  'sncf': 'https://logo.clearbit.com/sncf.com',
  'air france': 'https://logo.clearbit.com/airfrance.com',
  'easyjet': 'https://logo.clearbit.com/easyjet.com',
  'ryanair': 'https://logo.clearbit.com/ryanair.com',
  'booking': 'https://logo.clearbit.com/booking.com',
  'airbnb': 'https://logo.clearbit.com/airbnb.com',
  'supercell': 'https://logo.clearbit.com/supercell.com',
  'clash royale': 'https://logo.clearbit.com/supercell.com',
  'app store': 'https://logo.clearbit.com/apple.com',
  'google play': 'https://logo.clearbit.com/play.google.com',
  'steam': 'https://logo.clearbit.com/steampowered.com',
  'playstation': 'https://logo.clearbit.com/playstation.com',
  'xbox': 'https://logo.clearbit.com/xbox.com',
  'nintendo': 'https://logo.clearbit.com/nintendo.com',
  'epic games': 'https://logo.clearbit.com/epicgames.com',
  'discord': 'https://logo.clearbit.com/discord.com',
  'twitch': 'https://logo.clearbit.com/twitch.tv',
  'youtube': 'https://logo.clearbit.com/youtube.com',
  'tiktok': 'https://logo.clearbit.com/tiktok.com',
  'instagram': 'https://logo.clearbit.com/instagram.com',
  'facebook': 'https://logo.clearbit.com/facebook.com',
  'meta': 'https://logo.clearbit.com/meta.com',
};

// Trouver le logo d'une marque
function findBrandLogo(vendorName: string): string | null {
  if (!vendorName) return null;
  const lowerName = vendorName.toLowerCase();
  
  // Chercher une correspondance exacte ou partielle
  for (const [brand, logo] of Object.entries(BRAND_LOGOS)) {
    if (lowerName.includes(brand) || brand.includes(lowerName)) {
      return logo;
    }
  }
  
  // Essayer avec le domaine via Clearbit
  const words = vendorName.split(/\s+/);
  if (words.length > 0) {
    const mainWord = words[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    if (mainWord.length > 2) {
      return `https://logo.clearbit.com/${mainWord}.com`;
    }
  }
  
  return null;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate?: number;
}

export interface AnalysisResult {
  success: boolean;
  analysis?: {
    type: string;
    numero: string | null;
    date: string | null;
    fournisseur: string | null;
    fournisseurAdresse: string | null;
    fournisseurEmail: string | null;
    fournisseurTelephone: string | null;
    fournisseurTVA: string | null;
    client: string | null;
    montantHT: number | null;
    tva: number | null;
    tauxTVA: number | null;
    montantTTC: number | null;
    devise: string;
    description: string | null;
    confiance: number;
    lineItems: LineItem[];
    paymentMethod: string | null;
    dueDate: string | null;
    category: string | null;
    notes: string | null;
  };
  error?: string;
}

const ANALYSIS_PROMPT = `Tu es un expert en analyse de documents comptables français et internationaux.
Analyse ce document et extrais TOUTES les informations au format JSON strict.
Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.

{
  "type": "FACTURE_ACHAT" | "RECU" | "FACTURE_VENTE" | "DEVIS" | "NOTE_FRAIS" | "AVOIR" | "ABONNEMENT" | "AUTRE",
  "numero": "numéro de facture/reçu/commande ou null",
  "date": "YYYY-MM-DD ou null",
  "dueDate": "YYYY-MM-DD (date d'échéance) ou null",
  
  "fournisseur": "nom EXACT de l'entreprise/marque (ex: Apple, Amazon, Uber, Netflix...)",
  "fournisseurAdresse": "adresse complète ou null",
  "fournisseurEmail": "email ou null", 
  "fournisseurTelephone": "téléphone ou null",
  "fournisseurTVA": "numéro TVA/SIRET/identifiant fiscal ou null",
  "fournisseurSiteWeb": "site web ou null",
  
  "client": "nom du client destinataire ou null",
  "clientEmail": "email du client ou null",
  
  "montantHT": nombre ou null,
  "tva": nombre (montant TVA) ou null,
  "tauxTVA": nombre (%) ou null,
  "montantTTC": nombre TOTAL ou null,
  "devise": "EUR" | "USD" | "GBP" | autre,
  
  "paymentMethod": "CB" | "APPLE_PAY" | "GOOGLE_PAY" | "PAYPAL" | "VIREMENT" | "PRELEVEMENT" | "ESPECES" | "CHEQUE" | null,
  "paymentStatus": "PAYE" | "EN_ATTENTE" | "ECHOUE" | null,
  
  "category": "LOGICIEL" | "JEUX_VIDEO" | "STREAMING" | "ABONNEMENT" | "TRANSPORT" | "RESTAURANT" | "COURSES" | "FOURNITURES" | "TELECOM" | "HEBERGEMENT" | "SERVICES" | "AUTRES",
  
  "description": "description courte et claire",
  "notes": "informations importantes (conditions, garantie, etc.) ou null",
  "confiance": nombre 0-1,
  
  "lineItems": [
    {
      "description": "nom EXACT du produit/service",
      "quantity": nombre,
      "unitPrice": nombre ou null,
      "amount": nombre,
      "vatRate": nombre ou null,
      "sku": "référence produit ou null"
    }
  ]
}

=== RÈGLES DE CATÉGORISATION DU TYPE ===

RECU (Ticket de caisse, confirmation d'achat ponctuel):
- App Store, Google Play (achat in-app, jeux)
- Uber, Bolt, Lyft (course)
- Amazon (achat unique)
- Restaurant, café
- Mots-clés: "reçu", "receipt", "confirmation d'achat", "your purchase"

FACTURE_ACHAT (Facture formelle avec numéro):
- Facture avec TVA détaillée
- Numéro de facture explicite
- Document fiscal officiel
- Mots-clés: "facture n°", "invoice #", "TVA", "N° TVA"

ABONNEMENT (Paiement récurrent):
- Netflix, Spotify, Apple Music
- AWS, Google Cloud, Replicate
- Téléphone, Internet
- Mots-clés: "abonnement", "subscription", "mensuel", "renouvellement"

AVOIR (Remboursement, crédit):
- Montant négatif ou "crédit"
- Mots-clés: "avoir", "credit note", "remboursement"

=== RÈGLES D'EXTRACTION ===

1. FOURNISSEUR: Extrais le nom de MARQUE (Apple, pas "App Store Receipt")
2. LINE ITEMS: CHAQUE produit/service = UNE ligne séparée, avec son prix exact
3. Pour les achats in-app (jeux), extrais le nom du jeu ET l'item acheté
4. MONTANTS: Nombres uniquement, PAS de symboles (€/$)
5. Si le document est en anglais, traduis description et notes en français
6. CATEGORY: Utilise JEUX_VIDEO pour les achats de jeux/in-app gaming`;

/**
 * Extrait le texte d'un PDF avec unpdf
 * Compatible Vercel (serverless) - conçu pour edge/serverless
 */
async function extractPDFText(source: string | Buffer): Promise<string> {
  try {
    // Importer unpdf (compatible serverless, pas de worker)
    const { extractText } = await import('unpdf');
    
    let data: Buffer;
    
    if (typeof source === 'string') {
      console.log('📖 [PDF] Lecture du fichier PDF:', source);
      const { readFile } = await import('fs/promises');
      data = await readFile(source);
    } else {
      console.log('📖 [PDF] Traitement du PDF depuis Buffer');
      data = source;
    }
    
    console.log('✅ [PDF] Données lues, taille:', data.length, 'bytes');
    
    // Utiliser unpdf (conçu pour serverless, pas de DOMMatrix requis)
    console.log('🔧 [PDF] Extraction du texte avec unpdf...');
    
    // Convertir Buffer en Uint8Array (requis par unpdf)
    const uint8Array = new Uint8Array(data);
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true });
    
    console.log(`📄 [PDF] PDF contient ${totalPages} page(s)`);
    console.log('✅ [PDF] Extraction terminée, longueur:', text.length);
    
    return text.trim();
  } catch (error) {
    console.error('❌ [PDF] Erreur extraction PDF:', error);
    throw new Error(`Impossible d'extraire le PDF: ${error}`);
  }
}

/**
 * Analyse un document avec OpenAI
 * @param documentId - ID du document dans la base
 * @returns Résultat de l'analyse
 */
export async function analyzeDocument(documentId: string): Promise<AnalysisResult> {
  try {
    console.log('🚀 [ANALYZE] ========== Début analyse document ==========');
    console.log('📄 [ANALYZE] Document ID:', documentId);
    
    // Récupérer le document
    console.log('🔍 [ANALYZE] Récupération du document depuis la DB...');
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      console.error('❌ [ANALYZE] Document non trouvé en DB');
      return { success: false, error: 'Document non trouvé' };
    }

    console.log('✅ [ANALYZE] Document trouvé:', document.filename);
    console.log('📁 [ANALYZE] Type:', document.fileType);
    console.log('📁 [ANALYZE] URL:', document.fileUrl?.substring(0, 50) + '...');

    // Vérifier qu'on a bien une clé OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ [ANALYZE] OPENAI_API_KEY non configurée dans .env');
      return { success: false, error: 'Configuration OpenAI manquante' };
    }
    console.log('✅ [ANALYZE] Clé OpenAI détectée');

    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Déterminer le type de fichier
    const isPDF = document.fileType === 'application/pdf' || 
                  document.filename?.toLowerCase().endsWith('.pdf');
    const isImage = document.fileType?.startsWith('image/') || 
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(document.filename || '');
    const isHTML = document.fileType === 'text/html' || 
                   document.filename?.toLowerCase().endsWith('.html');

    console.log('📁 Type de fichier:', isPDF ? 'PDF' : isImage ? 'IMAGE' : isHTML ? 'HTML' : 'AUTRE');
    console.log('📁 fileType:', document.fileType);
    console.log('📁 filename:', document.filename);

    let analysisResult;

    if (isPDF) {
      // === ANALYSE PDF : Extraire le texte puis analyser avec GPT-4 ===
      console.log('📕 [ANALYZE] Mode PDF : extraction texte + GPT-4');
      
      let pdfText = '';
      
      if (document.fileUrl.startsWith('/uploads/')) {
        const filepath = path.join(process.cwd(), 'public', document.fileUrl);
        console.log('📁 [ANALYZE] Chemin fichier:', filepath);
        pdfText = await extractPDFText(filepath);
      } else if (document.fileUrl.startsWith('data:')) {
        console.log('📁 [ANALYZE] PDF en base64...');
        const base64Data = document.fileUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        pdfText = await extractPDFText(buffer);
      } else {
        return { success: false, error: 'Format de fichier PDF non supporté' };
      }

      if (!pdfText || pdfText.length < 10) {
        console.error('❌ [ANALYZE] Texte PDF trop court ou vide');
        return { success: false, error: 'Impossible d\'extraire le texte du PDF' };
      }

      console.log('✅ [ANALYZE] Texte extrait, longueur:', pdfText.length);
      console.log('📝 [ANALYZE] Aperçu (500 chars):', pdfText.substring(0, 500));

      // Analyser avec GPT-4
      console.log('🤖 [ANALYZE] Envoi du texte à GPT-4...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: ANALYSIS_PROMPT,
          },
          {
            role: 'user',
            content: `Voici le texte extrait d'une facture. Analyse-le et extrais TOUTES les informations, SURTOUT les lignes de produits/services :\n\n${pdfText}`,
          },
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('✅ [ANALYZE] Réponse GPT reçue, longueur:', responseText.length);
      console.log('📝 [ANALYZE] Aperçu réponse (500 chars):', responseText.substring(0, 500));
      
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisResult = JSON.parse(cleanJson);
      console.log('✅ [ANALYZE] JSON parsé avec succès');

    } else if (isImage) {
      // === ANALYSE IMAGE : Utiliser GPT-4 Vision ===
      console.log('🖼️ [ANALYZE] Mode IMAGE : GPT-4 Vision');
      
      let imageContent: any;
      
      if (document.fileUrl.startsWith('data:')) {
        console.log('📁 [ANALYZE] Image en base64 (data URL)');
        imageContent = {
          type: 'image_url',
          image_url: {
            url: document.fileUrl,
            detail: 'high',
          },
        };
      } else if (document.fileUrl.startsWith('/uploads/')) {
        console.log('📁 [ANALYZE] Image locale, conversion en base64...');
        const filepath = path.join(process.cwd(), 'public', document.fileUrl);
        const fileBuffer = await fs.readFile(filepath);
        const mimeType = document.fileType || 'image/jpeg';
        const base64 = fileBuffer.toString('base64');
        console.log('✅ [ANALYZE] Image convertie, taille base64:', base64.length);
        imageContent = {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: 'high',
          },
        };
      } else {
        console.log('📁 [ANALYZE] Image URL externe');
        imageContent = {
          type: 'image_url',
          image_url: {
            url: document.fileUrl,
            detail: 'high',
          },
        };
      }

      console.log('🤖 [ANALYZE] Envoi à GPT-4 Vision...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: ANALYSIS_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyse cette image de facture/reçu et extrais TOUTES les informations, SURTOUT chaque ligne de produit/service :',
              },
              imageContent,
            ],
          },
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('✅ [ANALYZE] Réponse GPT Vision reçue, longueur:', responseText.length);
      console.log('📝 [ANALYZE] Aperçu réponse (500 premiers chars):', responseText.substring(0, 500));
      
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisResult = JSON.parse(cleanJson);
      console.log('✅ [ANALYZE] JSON parsé avec succès');

    } else if (isHTML) {
      // === ANALYSE HTML : Extraire le texte du HTML puis analyser avec GPT-4 ===
      console.log('🌐 [ANALYZE] Mode HTML : extraction texte + GPT-4');
      
      let htmlText = '';
      
      if (document.fileUrl.startsWith('data:')) {
        console.log('📁 [ANALYZE] HTML en base64...');
        const base64Data = document.fileUrl.split(',')[1];
        let htmlContent = Buffer.from(base64Data, 'base64').toString('utf-8');
        
        // Corriger les problèmes d'encodage courants (UTF-8 mal décodé)
        htmlContent = htmlContent
          .replace(/Ã©/g, 'é')
          .replace(/Ã¨/g, 'è')
          .replace(/Ãª/g, 'ê')
          .replace(/Ã /g, 'à')
          .replace(/Ã¢/g, 'â')
          .replace(/Ã´/g, 'ô')
          .replace(/Ã¹/g, 'ù')
          .replace(/Ã»/g, 'û')
          .replace(/Ã®/g, 'î')
          .replace(/Ã¯/g, 'ï')
          .replace(/Ã§/g, 'ç')
          .replace(/Å"/g, 'œ')
          .replace(/â‚¬/g, '€')
          .replace(/â€™/g, "'")
          .replace(/â€œ/g, '"')
          .replace(/â€/g, '"')
          .replace(/Â /g, ' ')  // Non-breaking space mal encodé
          .replace(/Â€/g, '€')
          .replace(/Â£/g, '£')
          .replace(/Â¥/g, '¥')
          .replace(/Â/g, '')    // Enlever les Â parasites
          .replace(/\u00A0/g, ' '); // Non-breaking space Unicode
        
        // Extraire le texte du HTML (enlever les balises)
        htmlText = htmlContent
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Enlever les styles
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Enlever les scripts
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '') // Enlever le head
          .replace(/<[^>]+>/g, ' ') // Enlever les balises
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&euro;/g, '€')
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code))) // Decode HTML entities
          .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
          .replace(/\s+/g, ' ') // Normaliser les espaces
          .trim();
      } else {
        return { success: false, error: 'Format de fichier HTML non supporté' };
      }

      if (!htmlText || htmlText.length < 10) {
        console.error('❌ [ANALYZE] Texte HTML trop court ou vide');
        return { success: false, error: 'Impossible d\'extraire le texte du HTML' };
      }

      console.log('✅ [ANALYZE] Texte HTML extrait, longueur:', htmlText.length);
      console.log('📝 [ANALYZE] Aperçu (500 chars):', htmlText.substring(0, 500));

      // Analyser avec GPT-4
      console.log('🤖 [ANALYZE] Envoi du texte HTML à GPT-4...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: ANALYSIS_PROMPT,
          },
          {
            role: 'user',
            content: `Voici le texte extrait d'un email de facture/reçu. Analyse-le et extrais TOUTES les informations, SURTOUT les lignes de produits/services :\n\n${htmlText.substring(0, 8000)}`,
          },
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('✅ [ANALYZE] Réponse GPT reçue, longueur:', responseText.length);
      
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisResult = JSON.parse(cleanJson);
      console.log('✅ [ANALYZE] JSON parsé avec succès');

    } else {
      return { success: false, error: 'Type de fichier non supporté (utilisez PDF, image ou HTML)' };
    }

    console.log('✅ [ANALYZE] Analyse réussie !');
    console.log('📊 [ANALYZE] Lignes extraites:', analysisResult.lineItems?.length || 0);
    if (analysisResult.lineItems && analysisResult.lineItems.length > 0) {
      console.log('📋 [ANALYZE] Première ligne:', analysisResult.lineItems[0]);
    }
    console.log('💰 [ANALYZE] Montant TTC:', analysisResult.montantTTC);
    console.log('💰 [ANALYZE] Montant HT:', analysisResult.montantHT);
    console.log('💰 [ANALYZE] TVA:', analysisResult.tva);
    console.log('🏢 [ANALYZE] Fournisseur:', analysisResult.fournisseur);
    console.log('📅 [ANALYZE] Date:', analysisResult.date);
    console.log('🔢 [ANALYZE] Numéro:', analysisResult.numero);
    console.log('📂 [ANALYZE] Type:', analysisResult.type);
    console.log('🏷️ [ANALYZE] Catégorie:', analysisResult.category);

    // Trouver le logo du fournisseur
    const vendorLogo = findBrandLogo(analysisResult.fournisseur);
    console.log('🏷️ [ANALYZE] Logo trouvé:', vendorLogo ? 'Oui' : 'Non');

    // Mettre à jour le document avec les données analysées
    console.log('💾 [ANALYZE] Sauvegarde en base de données...');
    await prisma.document.update({
      where: { id: documentId },
      data: {
        analyzed: true,
        docType: analysisResult.type || 'AUTRE',
        amount: analysisResult.montantTTC || analysisResult.montantHT || null,
        vat: analysisResult.tva || null,
        date: analysisResult.date ? new Date(analysisResult.date) : null,
        supplier: analysisResult.fournisseur || analysisResult.client || null,
        analysisData: {
          ...analysisResult,
          vendorLogo,
          supplierAddress: analysisResult.fournisseurAdresse || null,
          supplierEmail: analysisResult.fournisseurEmail || null,
          supplierPhone: analysisResult.fournisseurTelephone || null,
          supplierVatNumber: analysisResult.fournisseurTVA || null,
          supplierWebsite: analysisResult.fournisseurSiteWeb || null,
          clientEmail: analysisResult.clientEmail || null,
          invoiceNumber: analysisResult.numero || null,
          currency: analysisResult.devise || 'EUR',
          lineItems: analysisResult.lineItems || [],
          paymentMethod: analysisResult.paymentMethod || null,
          paymentStatus: analysisResult.paymentStatus || null,
          dueDate: analysisResult.dueDate || null,
          category: analysisResult.category || null,
          notes: analysisResult.notes || null,
          analyzedAt: new Date().toISOString(),
          model: 'gpt-4o',
        },
      },
    });

    console.log('✅ [ANALYZE] Document sauvegardé en base');
    console.log('🎉 [ANALYZE] ========== Analyse terminée avec succès ==========');

    return {
      success: true,
      analysis: analysisResult,
    };

  } catch (error) {
    console.error('❌ [ANALYZE] ========== ERREUR ANALYZE ==========');
    console.error('❌ [ANALYZE] Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [ANALYZE] Message:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof OpenAI.APIError) {
      console.error('❌ [ANALYZE] OpenAI Error status:', error.status);
      console.error('❌ [ANALYZE] OpenAI Error message:', error.message);
      console.error('❌ [ANALYZE] OpenAI Error code:', error.code);
      if (error.status === 429) {
        return { success: false, error: 'Limite API atteinte, réessayez plus tard' };
      }
      if (error.status === 400) {
        return { success: false, error: 'Format de document non supporté par OpenAI' };
      }
      if (error.status === 401) {
        return { success: false, error: 'Clé API OpenAI invalide. Vérifiez OPENAI_API_KEY dans .env' };
      }
    }

    if (error instanceof SyntaxError) {
      console.error('❌ [ANALYZE] Erreur de parsing JSON');
      return { success: false, error: 'Erreur de parsing de la réponse IA' };
    }

    console.error('❌ [ANALYZE] Stack:', error instanceof Error ? error.stack : 'N/A');
    return { success: false, error: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}` };
  }
}

/**
 * Analyse plusieurs documents en batch
 */
export async function analyzeBatch(documentIds: string[]): Promise<{ 
  success: number; 
  errors: number; 
  results: { id: string; status: 'success' | 'error' }[] 
}> {
  const results: { id: string; status: 'success' | 'error' }[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const docId of documentIds) {
    try {
      const result = await analyzeDocument(docId);
      if (result.success) {
        successCount++;
        results.push({ id: docId, status: 'success' });
      } else {
        errorCount++;
        results.push({ id: docId, status: 'error' });
      }
    } catch (e) {
      errorCount++;
      results.push({ id: docId, status: 'error' });
    }

    // Petit délai entre les appels pour éviter les rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { success: successCount, errors: errorCount, results };
}
