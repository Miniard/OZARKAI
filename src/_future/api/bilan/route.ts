/**
 * API Route : Génération du bilan comptable
 * GET /api/bilan?companyId=xxx&year=2024
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    // Par défaut : année actuelle, ou détection automatique si pas de documents
    let year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requis' }, { status: 400 });
    }

    // Vérifier que l'entreprise appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    // Si pas d'année spécifiée, détecter l'année avec le plus de documents
    if (!searchParams.get('year')) {
      const firstDoc = await prisma.document.findFirst({
        where: { companyId },
        orderBy: { date: 'desc' },
      });
      if (firstDoc?.date) {
        year = firstDoc.date.getFullYear();
        console.log(`📅 Année auto-détectée: ${year}`);
      }
    }

    // Récupérer toutes les écritures de l'année
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    console.log(`📅 Période du bilan: ${startDate.toLocaleDateString('fr-FR')} → ${endDate.toLocaleDateString('fr-FR')}`);

    const entries = await prisma.entry.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        document: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Récupérer tous les documents de la période
    const documents = await prisma.document.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log(`📄 ${documents.length} documents trouvés pour ${year}`);

    // Calculer les totaux à partir des DOCUMENTS (plus fiable)
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalVAT = 0;

    documents.forEach((doc) => {
      if (doc.vat) totalVAT += doc.vat;
      
      if (doc.amount) {
        if (doc.docType === 'FACTURE_VENTE') {
          totalRevenue += doc.amount;
        } else if (doc.docType === 'FACTURE_ACHAT' || doc.docType === 'NOTE_FRAIS' || doc.docType === 'RECU') {
          totalExpenses += doc.amount;
        }
      }
    });

    const balance = totalRevenue - totalExpenses;
    
    // Calculer aussi avec les écritures (fallback)
    let totalDebit = 0;
    let totalCredit = 0;
    
    entries.forEach((entry) => {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
    });

    // Grouper par catégorie
    const byCategory: Record<string, { debit: number; credit: number; count: number }> = {};

    entries.forEach((entry) => {
      const cat = entry.category || 'Non catégorisé';
      if (!byCategory[cat]) {
        byCategory[cat] = { debit: 0, credit: 0, count: 0 };
      }
      byCategory[cat].debit += entry.debit;
      byCategory[cat].credit += entry.credit;
      byCategory[cat].count += 1;
    });

    // Statistiques mensuelles
    const monthlyStats: Record<string, { revenue: number; expenses: number }> = {};

    documents.forEach((doc) => {
      if (!doc.date) return;
      const month = doc.date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, expenses: 0 };
      }
      if (doc.docType === 'FACTURE_VENTE') {
        monthlyStats[month].revenue += doc.amount || 0;
      } else if (doc.docType === 'FACTURE_ACHAT') {
        monthlyStats[month].expenses += doc.amount || 0;
      }
    });

    return NextResponse.json({
      company: {
        name: company.name,
        siret: company.siret,
        type: company.companyType,
        vatRegime: company.vatRegime,
      },
      period: {
        year, // L'année détectée automatiquement
        startDate,
        endDate,
      },
      summary: {
        totalRevenue,
        totalExpenses,
        balance,
        totalVAT,
        numberOfEntries: entries.length,
        numberOfDocuments: documents.length,
      },
      byCategory,
      monthlyStats,
      entries: entries.map((e) => ({
        date: e.date,
        description: e.description,
        category: e.category,
        debit: e.debit,
        credit: e.credit,
        documentName: e.document?.filename,
      })),
    });
  } catch (error) {
    console.error('Erreur génération bilan:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du bilan' },
      { status: 500 }
    );
  }
}

