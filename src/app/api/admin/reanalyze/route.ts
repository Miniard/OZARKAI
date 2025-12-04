/**
 * API Route : Re-analyser les documents mal analysés
 * POST /api/admin/reanalyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('🔄 Re-analyse des documents...');

    // Récupérer tous les documents avec type AUTRE ou montant = 0
    const companies = await prisma.company.findMany({
      where: { userId: session.user.id },
    });

    let reanalyzed = 0;

    for (const company of companies) {
      const badDocuments = await prisma.document.findMany({
        where: {
          companyId: company.id,
          OR: [
            { docType: 'AUTRE' },
            { amount: 0 },
            { amount: null },
          ],
        },
      });

      console.log(`📁 ${company.name}: ${badDocuments.length} documents à re-analyser`);

      for (const doc of badDocuments) {
        console.log(`🔍 Re-analyse: ${doc.filename}`);

        // Supprimer l'analyse précédente
        await prisma.document.update({
          where: { id: doc.id },
          data: { analyzed: false, analysisData: null },
        });

        // Supprimer les écritures associées
        await prisma.entry.deleteMany({
          where: { documentId: doc.id },
        });

        reanalyzed++;
      }
    }

    console.log(`✅ ${reanalyzed} documents marqués pour re-analyse`);

    return NextResponse.json({
      success: true,
      reanalyzed,
      message: `${reanalyzed} document(s) marqué(s) pour re-analyse. Uploadez-les à nouveau pour les analyser.`,
    });
  } catch (error) {
    console.error('❌ Erreur re-analyse:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la re-analyse' },
      { status: 500 }
    );
  }
}

