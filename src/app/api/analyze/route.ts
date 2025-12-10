/**
 * API Route : Analyse de document avec IA
 * POST /api/analyze - Analyse un document uploadé et extrait toutes les données
 * 
 * Extrait automatiquement :
 * - Fournisseur (nom, adresse, email, téléphone)
 * - Montants (HT, TVA, TTC)
 * - Lignes détaillées (produits/services)
 * - Date, numéro de facture
 * - Catégorie, méthode de paiement
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { analyzeDocument } from '@/lib/analyze';
import { rateLimitMiddleware } from '@/lib/security/ratelimit';
import { getClientIp } from '@/lib/utils';

interface AnalyzeRequest {
  documentId: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 ========== START ANALYZE API ==========');
    
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = rateLimitMiddleware(clientIp);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentification
    const session = await auth();
    console.log('👤 [AUTH] Session:', session?.user?.email);
    if (!session?.user?.email) {
      console.error('❌ [AUTH] Non authentifié');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error('❌ [USER] Utilisateur non trouvé');
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as AnalyzeRequest;
    const { documentId } = body;
    console.log('📄 [DOC] Document ID:', documentId);

    if (!documentId) {
      console.error('❌ [DOC] documentId manquant');
      return NextResponse.json(
        { error: 'documentId requis' },
        { status: 400 }
      );
    }

    // Récupérer le document et vérifier l'accès
    console.log('🔍 [DOC] Recherche du document...');
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        company: {
          userId: user.id,
        },
      },
      include: {
        company: true,
      },
    });

    if (!document) {
      console.error('❌ [DOC] Document non trouvé ou accès refusé');
      return NextResponse.json(
        { error: 'Document introuvable ou accès refusé' },
        { status: 404 }
      );
    }
    
    console.log('✅ [DOC] Document trouvé:', document.filename);
    console.log('📁 [DOC] Type:', document.fileType);
    console.log('📁 [DOC] URL:', document.fileUrl);
    console.log('📊 [DOC] Déjà analysé?', document.analyzed);

    // Vérifier si déjà analysé
    if (document.analyzed && document.analysisData) {
      console.log('ℹ️ [DOC] Document déjà analysé, retour des données existantes');
      const analysisData = document.analysisData as Record<string, any>;
      console.log('📊 [DOC] Lignes existantes:', analysisData?.lineItems?.length || 0);
      return NextResponse.json({
        success: true,
        message: 'Document déjà analysé',
        analysis: analysisData,
        document: document,
      });
    }

    // Vérifier la clé OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ [OPENAI] Clé API manquante dans .env');
      return NextResponse.json(
        { error: 'Configuration OpenAI manquante. Vérifiez OPENAI_API_KEY dans .env' },
        { status: 500 }
      );
    }
    console.log('✅ [OPENAI] Clé API détectée');

    // 🔥 ANALYSE IA AVEC GPT-4 VISION
    console.log('🤖 [ANALYZE] Lancement analyse IA...');
    const result = await analyzeDocument(documentId);
    
    if (!result.success) {
      console.error('❌ [ANALYZE] Erreur:', result.error);
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'analyse' },
        { status: 500 }
      );
    }

    console.log('✅ [ANALYZE] Analyse réussie!');
    console.log('📊 [ANALYZE] Lignes extraites:', result.analysis?.lineItems?.length || 0);
    console.log('💰 [ANALYZE] Montant TTC:', result.analysis?.montantTTC);
    console.log('🏢 [ANALYZE] Fournisseur:', result.analysis?.fournisseur);
    console.log('📅 [ANALYZE] Date:', result.analysis?.date);
    console.log('🔢 [ANALYZE] Numéro:', result.analysis?.numero);

    // Récupérer le document mis à jour
    const updatedDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    console.log('💾 [DB] Document mis à jour en base');

    // Créer une écriture comptable si analyse réussie
    if (result.analysis) {
      try {
        await prisma.entry.create({
          data: {
            companyId: document.companyId,
            documentId: document.id,
            date: result.analysis.date ? new Date(result.analysis.date) : new Date(),
            description: `${result.analysis.type} - ${result.analysis.fournisseur || 'Non spécifié'}`,
            category: result.analysis.category || 'Non catégorisé',
            debit: result.analysis.type === 'FACTURE_ACHAT' ? (result.analysis.montantTTC || 0) : 0,
            credit: result.analysis.type === 'FACTURE_VENTE' ? (result.analysis.montantTTC || 0) : 0,
            validated: false,
          },
        });
        console.log('✅ [DB] Entrée comptable créée');
      } catch (entryError) {
        console.log('⚠️ [DB] Entrée non créée (peut-être déjà existante):', entryError);
      }
    }

    console.log('🎉 ========== ANALYZE API SUCCESS ==========');
    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      document: updatedDocument,
    });

  } catch (error) {
    console.error('❌ ========== ERREUR ANALYZE API ==========');
    console.error('❌ [ERROR] Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [ERROR] Message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [ERROR] Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    );
  }
}
