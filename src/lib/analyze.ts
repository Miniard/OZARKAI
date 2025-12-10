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

const ANALYSIS_PROMPT = `Tu es un expert en analyse de documents comptables.
Analyse ce document et extrais TOUTES les informations au format JSON strict.
Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.

{
  "type": "FACTURE_ACHAT" | "FACTURE_VENTE" | "DEVIS" | "NOTE_FRAIS" | "RECU" | "AUTRE",
  "numero": "numéro de facture/reçu ou null",
  "date": "YYYY-MM-DD ou null",
  "dueDate": "YYYY-MM-DD (date d'échéance) ou null",
  
  "fournisseur": "nom de l'entreprise qui ÉMET la facture (celle qui vend/facture)",
  "fournisseurAdresse": "adresse complète du fournisseur ou null",
  "fournisseurEmail": "email du fournisseur ou null",
  "fournisseurTelephone": "téléphone du fournisseur ou null",
  "fournisseurTVA": "numéro TVA intracommunautaire ou SIRET ou null",
  
  "client": "nom du client qui REÇOIT la facture (celui qui doit payer) ou null",
  
  "montantHT": nombre ou null,
  "tva": nombre (montant TVA total) ou null,
  "tauxTVA": nombre (pourcentage principal) ou null,
  "montantTTC": nombre ou null,
  "devise": "EUR" | "USD" | "GBP" etc,
  
  "paymentMethod": "CB" | "ESPECES" | "CHEQUE" | "VIREMENT" | "PRELEVEMENT" | null,
  "category": "RESTAURANT" | "TRANSPORT" | "FOURNITURES" | "SERVICES" | "ABONNEMENT" | "LOGICIEL" | "HEBERGEMENT" | "AUTRES" | null,
  
  "description": "description courte du contenu",
  "notes": "informations supplémentaires remarquées ou null",
  "confiance": nombre entre 0 et 1 (niveau de confiance de l'analyse),
  
  "lineItems": [
    {
      "description": "nom du produit ou service",
      "quantity": nombre (quantité, 1 par défaut),
      "unitPrice": nombre (prix unitaire HT ou TTC selon dispo) ou null,
      "amount": nombre (montant total de la ligne),
      "vatRate": nombre (taux TVA en %) ou null
    }
  ]
}

RÈGLES CRITIQUES POUR LE TYPE:
- FACTURE_ACHAT = facture que l'utilisateur REÇOIT et doit PAYER (c'est une DÉPENSE)
  → Le fournisseur est une entreprise tierce (ex: Replicate, Amazon, restaurant...)
  → L'utilisateur est le CLIENT qui doit payer
  
- FACTURE_VENTE = facture que l'utilisateur ÉMET pour se faire PAYER (c'est un REVENU)
  → L'utilisateur est le FOURNISSEUR qui facture
  → Un client lui doit de l'argent

- 99% des factures reçues sont des FACTURE_ACHAT (dépenses)
- Si tu vois "Montant dû", "À payer", "Invoice" → c'est FACTURE_ACHAT
- Si tu vois un nom d'entreprise connue (Replicate, AWS, Google, etc.) comme émetteur → FACTURE_ACHAT

AUTRES RÈGLES:
1. Extrais TOUTES les lignes de produits/services - OBLIGATOIRE
2. Chaque article = une ligne séparée dans lineItems
3. Les montants DOIVENT être des nombres (pas de symboles €/$)
4. NE LAISSE JAMAIS lineItems VIDE
5. Catégorie LOGICIEL/SERVICES pour les outils SaaS (Replicate, AWS, etc.)`;

/**
 * Extrait le texte d'un PDF avec pdfjs-dist
 */
async function extractPDFText(filepath: string): Promise<string> {
  try {
    console.log('📖 [PDF] Lecture du fichier PDF:', filepath);
    const pdfjs = await import('pdfjs-dist');
    const { readFile } = await import('fs/promises');
    
    const data = await readFile(filepath);
    console.log('✅ [PDF] Fichier lu, taille:', data.length, 'bytes');
    
    console.log('🔧 [PDF] Chargement du document PDF...');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`📄 [PDF] PDF contient ${numPages} page(s)`);
    
    let fullText = '';
    const maxPages = Math.min(numPages, 5);
    console.log(`📄 [PDF] Extraction des ${maxPages} premières pages...`);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`📄 [PDF] Extraction page ${pageNum}/${maxPages}...`);
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
      console.log(`✅ [PDF] Page ${pageNum} extraite, ${pageText.length} caractères`);
    }
    
    console.log('✅ [PDF] Extraction PDF terminée, longueur totale:', fullText.length);
    return fullText.trim();
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

    console.log('📁 Type de fichier:', isPDF ? 'PDF' : isImage ? 'IMAGE' : 'AUTRE');
    console.log('📁 fileType:', document.fileType);
    console.log('📁 filename:', document.filename);

    let analysisResult;

    if (isPDF) {
      // === ANALYSE PDF : Extraire le texte et analyser avec GPT-4 ===
      console.log('📕 [ANALYZE] Mode PDF : extraction texte + analyse GPT-4');
      
      let pdfText = '';
      
      if (document.fileUrl.startsWith('/uploads/')) {
        const filepath = path.join(process.cwd(), 'public', document.fileUrl);
        console.log('📁 [ANALYZE] Chemin fichier:', filepath);
        pdfText = await extractPDFText(filepath);
      } else if (document.fileUrl.startsWith('data:')) {
        console.log('📁 [ANALYZE] PDF en base64, conversion...');
        const base64Data = document.fileUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const tempPath = path.join(process.cwd(), 'public', 'uploads', `temp_${Date.now()}.pdf`);
        await fs.writeFile(tempPath, buffer);
        pdfText = await extractPDFText(tempPath);
        await fs.unlink(tempPath).catch(() => {});
      }

      if (!pdfText || pdfText.length < 10) {
        console.error('❌ [ANALYZE] Texte PDF trop court ou vide');
        return { success: false, error: 'Impossible d\'extraire le texte du PDF' };
      }

      console.log('✅ [ANALYZE] Texte PDF extrait, longueur:', pdfText.length);
      console.log('📝 [ANALYZE] Aperçu (500 premiers chars):', pdfText.substring(0, 500));

      // Analyser avec GPT-4 (texte uniquement)
      console.log('🤖 [ANALYZE] Envoi à GPT-4 pour analyse...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: ANALYSIS_PROMPT,
          },
          {
            role: 'user',
            content: `Voici le texte extrait d'une facture/document comptable. Analyse-le et extrais TOUTES les informations, SURTOUT les lignes de produits/services :\n\n${pdfText}`,
          },
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('✅ [ANALYZE] Réponse GPT reçue, longueur:', responseText.length);
      console.log('📝 [ANALYZE] Aperçu réponse (500 premiers chars):', responseText.substring(0, 500));
      
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

    } else {
      return { success: false, error: 'Type de fichier non supporté (utilisez PDF ou image)' };
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
          supplierAddress: analysisResult.fournisseurAdresse || null,
          supplierEmail: analysisResult.fournisseurEmail || null,
          supplierPhone: analysisResult.fournisseurTelephone || null,
          supplierVatNumber: analysisResult.fournisseurTVA || null,
          invoiceNumber: analysisResult.numero || null,
          currency: analysisResult.devise || 'EUR',
          lineItems: analysisResult.lineItems || [],
          paymentMethod: analysisResult.paymentMethod || null,
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
