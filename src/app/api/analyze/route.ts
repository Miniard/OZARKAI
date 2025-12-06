/**
 * API Route : Analyse de document
 * POST /api/analyze - Analyse un document uploadé avec l'IA
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { analyzeDocument } from '@/lib/ai/openai';
import { analyzeDocumentLocal, isOllamaAvailable } from '@/lib/ai/ollama';
import { generatePresignedDownloadUrl } from '@/lib/upload/s3';
import { rateLimitMiddleware } from '@/lib/security/ratelimit';
import { getClientIp } from '@/lib/utils';
import axios from 'axios';

interface AnalyzeRequest {
  documentId: string;
  useLocalModel?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 START ANALYZE API');
    
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = rateLimitMiddleware(clientIp);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentification
    const session = await auth();
    console.log('👤 Session:', session?.user?.id);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as AnalyzeRequest;
    const { documentId, useLocalModel } = body;
    console.log('📄 Document ID:', documentId);

    // Récupérer le document
    console.log('🔍 Recherche document...');
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        company: {
          userId: session.user.id,
        },
      },
      include: {
        company: true,
      },
    });

    if (!document) {
      console.log('❌ Document non trouvé');
      return NextResponse.json(
        { error: 'Document introuvable ou accès refusé' },
        { status: 404 }
      );
    }
    
    console.log('✅ Document trouvé:', document.filename);

    // Vérifier si déjà analysé
    if (document.analyzed) {
      return NextResponse.json({
        message: 'Document déjà analysé',
        analysis: document.analysisData,
      });
    }

    // Lire le fichier (local ou S3)
    let documentText = '';
    
    if (document.fileUrl.startsWith('/uploads/')) {
      // Fichier local
      const { readFile, access } = await import('fs/promises');
      const { join } = await import('path');
      const filepath = join(process.cwd(), 'public', document.fileUrl);
      
      console.log('📁 Chemin complet du fichier:', filepath);
      
      // Vérifier que le fichier existe
      try {
        await access(filepath);
        console.log('✅ Fichier existe');
      } catch (err) {
        console.log('❌ Fichier introuvable !');
        throw new Error(`Fichier introuvable: ${filepath}`);
      }
      
      if (document.fileType === 'text/html' || filepath.endsWith('.html')) {
        // Support HTML (extraction simple avec regex)
        console.log('📄 Lecture HTML...');
        const htmlContent = await readFile(filepath, 'utf-8');
        // Extraire le texte visible (simple regex)
        documentText = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        console.log('📄 HTML extrait (longueur):', documentText.length);
        console.log('📄 HTML extrait (début):', documentText.substring(0, 200));
      } else if (document.fileType === 'application/pdf' || filepath.endsWith('.pdf')) {
        // Extraction VRAIE des PDFs avec pdfjs-dist
        console.log('📕 Extraction PDF avec pdfjs-dist...');
        documentText = await extractPDFText(filepath);
        console.log('📄 PDF extrait (longueur):', documentText.length);
        console.log('📄 PDF extrait (début):', documentText.substring(0, 300));
      } else {
        // Pour les images, on ne peut pas extraire sans OCR
        console.log('⚠️ Type de fichier non supporté:', document.fileType);
        documentText = `Document image - OCR non disponible en mode basique`;
      }
    } else {
      // Fichier S3 (mode production) - Non supporté en mode basique
      console.log('⚠️ Mode S3 non disponible en analyse basique');
      documentText = `Document distant - Mode basique non supporté`;
    }

    // Analyser le document
    console.log('🤖 Début analyse...');
    console.log('📝 Texte extrait (100 premiers chars):', documentText.substring(0, 100));
    let analysis;
    
    // Utiliser OpenAI si la clé est configurée, sinon analyse basique
    if (process.env.OPENAI_API_KEY) {
      console.log('☁️ Analyse avec OpenAI (texte uniquement)');
      try {
        analysis = await analyzeDocument(documentText);
        console.log('✅ Analyse OpenAI réussie:', analysis);
      } catch (error) {
        console.error('❌ Erreur OpenAI, fallback sur analyse basique:', error);
        analysis = analyzeDocumentBasic(documentText);
      }
    } else {
      console.log('⚠️ Pas de clé OpenAI, analyse basique');
      analysis = analyzeDocumentBasic(documentText);
    }
    
    console.log('✅ Analyse terminée:', analysis);

    // Mettre à jour le document en base
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        analyzed: true,
        analysisData: analysis as any,
        docType: analysis.type,
        amount: analysis.amount,
        vat: analysis.vat,
        date: analysis.date ? new Date(analysis.date) : null,
        supplier: analysis.supplier,
      },
    });

    // Créer une écriture comptable
    await prisma.entry.create({
      data: {
        companyId: document.companyId,
        documentId: document.id,
        date: analysis.date ? new Date(analysis.date) : new Date(),
        description: `${analysis.type} - ${analysis.supplier || 'Non spécifié'}`,
        category: analysis.category || 'Non catégorisé',
        debit: analysis.type === 'FACTURE_ACHAT' ? analysis.amount : 0,
        credit: analysis.type === 'FACTURE_VENTE' ? analysis.amount : 0,
        validated: false,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
      document: updatedDocument,
    });
  } catch (error) {
    console.error('❌ Erreur analyse complète:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    );
  }
}

/**
 * Analyse basique d'un document avec regex (sans IA)
 */
function analyzeDocumentBasic(text: string): any {
  console.log('🔍 Analyse basique avec regex...');
  
  // Détecter le type de document
  let type = 'AUTRE';
  if (text.toLowerCase().includes('facture') && text.toLowerCase().includes('total')) {
    if (text.toLowerCase().includes('client') || text.toLowerCase().includes('devis')) {
      type = 'FACTURE_VENTE';
    } else {
      type = 'FACTURE_ACHAT';
    }
  } else if (text.toLowerCase().includes('reçu') || text.toLowerCase().includes('ticket')) {
    type = 'RECU';
  } else if (text.toLowerCase().includes('note de frais') || text.toLowerCase().includes('restaurant')) {
    type = 'NOTE_FRAIS';
  } else if (text.toLowerCase().includes('loyer') || text.toLowerCase().includes('location')) {
    type = 'FACTURE_ACHAT';
  }
  
  // Extraire les montants (cherche "Total TTC", "Total", "TOTAL", etc.)
  let amount = 0;
  let vat = 0;
  
  // Regex pour trouver "Total TTC: XXX,XX €" ou "TOTAL TTC: XXX €" etc.
  const totalRegex = /(?:total|montant)[\s:]*(?:ttc)?[\s:]*(\d+[\s,.]?\d*)[€\s]/i;
  const totalMatch = text.match(totalRegex);
  if (totalMatch) {
    amount = parseFloat(totalMatch[1].replace(/[\s,]/g, '.').replace(/[^\d.]/g, ''));
  }
  
  // Regex pour TVA
  const vatRegex = /tva[\s:]*(?:\d+%)?[\s:]*(\d+[\s,.]?\d*)[€\s]/i;
  const vatMatch = text.match(vatRegex);
  if (vatMatch) {
    vat = parseFloat(vatMatch[1].replace(/[\s,]/g, '.').replace(/[^\d.]/g, ''));
  }
  
  // Extraire la date (format DD/MM/YYYY ou DD-MM-YYYY)
  let date = null;
  const dateRegex = /(?:date|le)[\s:]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Extraire le fournisseur (première ligne avec des majuscules)
  let supplier = null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines.slice(0, 10)) {
    if (line.length > 3 && line.length < 50 && /[A-Z]/.test(line)) {
      supplier = line;
      break;
    }
  }
  
  // Catégorie par défaut selon le type
  let category = '6000 - Achats';
  if (type === 'FACTURE_VENTE') {
    category = '7000 - Ventes';
  } else if (type === 'NOTE_FRAIS') {
    category = '6257 - Réceptions';
  } else if (text.toLowerCase().includes('loyer')) {
    category = '6130 - Locations';
  } else if (text.toLowerCase().includes('carburant') || text.toLowerCase().includes('essence')) {
    category = '6061 - Carburant';
  } else if (text.toLowerCase().includes('fourniture') || text.toLowerCase().includes('bureau')) {
    category = '6064 - Fournitures administratives';
  }
  
  console.log('📊 Résultat analyse basique:', { type, amount, vat, date, supplier, category });
  
  return {
    type,
    amount,
    vat,
    vatRate: vat && amount ? ((vat / (amount - vat)) * 100).toFixed(1) : null,
    date,
    supplier,
    category,
    confidence: 0.7,
    suggestions: ['Analyse basique sans IA - Vérifiez les données'],
  };
}

/**
 * Extrait le texte d'un PDF avec pdfjs-dist
 */
async function extractPDFText(filepath: string): Promise<string> {
  try {
    // Import dynamique de pdfjs-dist (bon chemin pour v3)
    const pdfjs = await import('pdfjs-dist');
    const { readFile } = await import('fs/promises');
    
    console.log('📖 Lecture du fichier PDF...');
    const data = await readFile(filepath);
    
    console.log('🔧 Chargement du document PDF...');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
      standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`📄 PDF contient ${numPages} page(s)`);
    
    let fullText = '';
    
    // Extraire le texte de chaque page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('✅ Extraction PDF terminée');
    return fullText.trim();
  } catch (error) {
    console.error('❌ Erreur extraction PDF:', error);
    throw new Error(`Impossible d'extraire le PDF: ${error}`);
  }
}

/**
 * Extrait le texte d'un PDF (simplifié)
 */
async function extractTextFromPDF(url: string): Promise<string> {
  // Dans une vraie implémentation, utiliser pdf-parse
  // Ici on simule avec un appel direct à GPT-4 Vision
  const { extractTextFromImage } = await import('@/lib/ai/openai');
  return extractTextFromImage(url);
}

/**
 * Extrait le texte d'une image via OCR
 */
async function extractTextFromImage(url: string): Promise<string> {
  const { extractTextFromImage } = await import('@/lib/ai/openai');
  return extractTextFromImage(url);
}

