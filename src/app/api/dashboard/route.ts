/**
 * API Route : Dashboard - Données financières agrégées
 * GET /api/dashboard?companyId=xxx
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { rateLimitMiddleware } from '@/lib/security/ratelimit';
import { getClientIp } from '@/lib/utils';
import type { DashboardData, DocumentSummary, MonthlyData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = rateLimitMiddleware(clientIp);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentification
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer le companyId depuis les query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId requis' },
        { status: 400 }
      );
    }

    // Vérifier l'accès
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise introuvable ou accès refusé' },
        { status: 404 }
      );
    }

    // Récupérer TOUTES les écritures comptables (pas de filtre de date)
    const entries = await prisma.entry.findMany({
      where: {
        companyId,
      },
      orderBy: { date: 'desc' },
    });

    // Calculer les totaux
    let revenue = 0;
    let expenses = 0;

    for (const entry of entries) {
      revenue += entry.credit;
      expenses += entry.debit;
    }

    const balance = revenue - expenses;

    // Récupérer TOUS les documents pour calculs
    const documents = await prisma.document.findMany({
      where: {
        companyId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const vat = documents.reduce((sum, doc) => sum + (doc.vat || 0), 0);

    // Documents récents (10 premiers)
    const documentSummaries: DocumentSummary[] = documents.slice(0, 10).map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      type: doc.docType || 'AUTRE',
      amount: doc.amount || 0,
      date: doc.date?.toISOString() || doc.date?.toISOString() || new Date().toISOString(),
      analyzed: doc.analyzed,
    }));

    // Données mensuelles - détection automatique de la période
    const monthlyData: MonthlyData[] = [];
    
    // Trouver le mois le plus ancien et le plus récent avec des documents
    const docsWithDates = documents.filter((d) => d.date);
    if (docsWithDates.length > 0) {
      const oldestDate = new Date(Math.min(...docsWithDates.map((d) => d.date!.getTime())));
      const newestDate = new Date(Math.max(...docsWithDates.map((d) => d.date!.getTime())));
      
      // Afficher depuis le mois le plus ancien jusqu'à maintenant (max 12 mois)
      const startMonth = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
      const endMonth = new Date();
      
      let currentMonth = new Date(startMonth);
      let monthCount = 0;
      
      while (currentMonth <= endMonth && monthCount < 12) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        // Filtrer les documents du mois
        const monthDocs = documents.filter(
          (doc) => doc.date && doc.date >= monthStart && doc.date <= monthEnd
        );

        // Calculer revenus et dépenses
        let monthRevenue = 0;
        let monthExpenses = 0;

        monthDocs.forEach((doc) => {
          if (doc.amount) {
            if (doc.docType === 'FACTURE_VENTE') {
              monthRevenue += doc.amount;
            } else if (doc.docType === 'FACTURE_ACHAT' || doc.docType === 'NOTE_FRAIS' || doc.docType === 'RECU') {
              monthExpenses += doc.amount;
            }
          }
        });

        const monthLabel = currentMonth.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
        
        monthlyData.push({
          month: monthLabel,
          revenue: monthRevenue,
          expenses: monthExpenses,
        });
        
        console.log(`📊 ${monthLabel}: Revenus ${monthRevenue}€, Dépenses ${monthExpenses}€ (${monthDocs.length} docs)`);
        
        // Mois suivant
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        monthCount++;
      }
    } else {
      console.log('⚠️ Aucun document avec date trouvé');
    }

    console.log(`✅ Données mensuelles générées:`, monthlyData);

    const dashboardData: DashboardData = {
      revenue,
      expenses,
      vat,
      balance,
      recentDocuments: documentSummaries,
      monthlyData,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Erreur dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

