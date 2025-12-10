/**
 * API : Analyse automatique des factures via OpenAI Vision
 * POST /api/documents/analyze - Analyser UN document
 * PUT /api/documents/analyze - Analyser TOUS les non-analysés
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { analyzeDocument, analyzeBatch } from '@/lib/analyze';

// Analyser UN document
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId requis' }, { status: 400 });
    }

    // Récupérer le document et vérifier l'accès
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { company: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    if (document.company.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Lancer l'analyse
    const result = await analyzeDocument(documentId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Récupérer le document mis à jour
    const updatedDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      analysis: result.analysis,
    });

  } catch (error) {
    console.error('Erreur analyse document:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    );
  }
}

// Analyser tous les documents non analysés d'une entreprise
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requis' }, { status: 400 });
    }

    // Vérifier l'accès à l'entreprise
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || company.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les documents non analysés
    const unanalyzedDocs = await prisma.document.findMany({
      where: {
        companyId,
        analyzed: false,
      },
      take: 10, // Limiter pour éviter timeout
    });

    if (unanalyzedDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tous les documents sont déjà analysés',
        analyzed: 0,
      });
    }

    // Analyser en batch
    const results = await analyzeBatch(unanalyzedDocs.map(d => d.id));

    return NextResponse.json({
      success: true,
      analyzed: results.success,
      errors: results.errors,
      total: unanalyzedDocs.length,
      results: results.results,
    });

  } catch (error) {
    console.error('Erreur analyse batch:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}
