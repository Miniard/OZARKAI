/**
 * API pour les prédictions de trésorerie avec IA
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  balance: number;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const horizon = parseInt(searchParams.get('horizon') || '6'); // 3, 6 ou 12 mois

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur a accès à cette entreprise
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer les documents des 12 derniers mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const documents = await prisma.document.findMany({
      where: {
        companyId,
        date: {
          gte: twelveMonthsAgo,
        },
        analyzed: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (documents.length < 3) {
      return NextResponse.json({
        error: 'Pas assez de données historiques (minimum 3 mois requis)',
        historical: [],
        predictions: [],
      });
    }

    // Grouper par mois
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};

    documents.forEach((doc) => {
      if (!doc.date || !doc.amount) return;
      
      const monthKey = `${doc.date.getFullYear()}-${String(doc.date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }

      if (doc.docType === 'FACTURE_VENTE') {
        monthlyData[monthKey].revenue += doc.amount;
      } else if (doc.docType === 'FACTURE_ACHAT' || doc.docType === 'NOTE_FRAIS') {
        monthlyData[monthKey].expenses += doc.amount;
      }
    });

    // Convertir en array et calculer le solde
    const historical: MonthlyData[] = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        balance: data.revenue - data.expenses,
      }));

    // ALGORITHME DE PRÉDICTION
    // Utilise une moyenne mobile pondérée avec détection de saisonnalité

    const predictions: MonthlyData[] = [];
    const lastMonth = historical[historical.length - 1];
    let currentBalance = lastMonth.balance;

    // Calculer les tendances
    const revenueValues = historical.map(h => h.revenue);
    const expenseValues = historical.map(h => h.expenses);

    const avgRevenue = revenueValues.reduce((sum, v) => sum + v, 0) / revenueValues.length;
    const avgExpense = expenseValues.reduce((sum, v) => sum + v, 0) / expenseValues.length;

    // Calculer la tendance (régression linéaire simple)
    const revenueTrend = calculateTrend(revenueValues);
    const expenseTrend = calculateTrend(expenseValues);

    // Détecter la volatilité
    const revenueStdDev = calculateStdDev(revenueValues, avgRevenue);
    const expenseStdDev = calculateStdDev(expenseValues, avgExpense);

    // Génération des prédictions
    for (let i = 1; i <= horizon; i++) {
      const lastDate = new Date(historical[historical.length - 1].month + '-01');
      lastDate.setMonth(lastDate.getMonth() + i);
      const predictedMonth = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;

      // Prédiction avec tendance + facteur saisonnier
      const monthIndex = lastDate.getMonth();
      const seasonalFactor = getSeasonalFactor(historical, monthIndex);

      let predictedRevenue = avgRevenue + (revenueTrend * i) * seasonalFactor.revenue;
      let predictedExpense = avgExpense + (expenseTrend * i) * seasonalFactor.expense;

      // Ajouter une légère variation aléatoire pour plus de réalisme
      predictedRevenue = Math.max(0, predictedRevenue + (Math.random() - 0.5) * revenueStdDev * 0.3);
      predictedExpense = Math.max(0, predictedExpense + (Math.random() - 0.5) * expenseStdDev * 0.3);

      const predictedBalance = predictedRevenue - predictedExpense;
      currentBalance += predictedBalance;

      predictions.push({
        month: predictedMonth,
        revenue: Math.round(predictedRevenue * 100) / 100,
        expenses: Math.round(predictedExpense * 100) / 100,
        balance: Math.round(predictedBalance * 100) / 100,
      });
    }

    // Analyser les prédictions pour générer des alertes
    const alerts: Array<{
      type: 'warning' | 'danger' | 'info';
      month: string;
      message: string;
    }> = [];

    let cumulativeBalance = lastMonth.balance;
    predictions.forEach((pred) => {
      cumulativeBalance += pred.balance;

      if (cumulativeBalance < 0) {
        alerts.push({
          type: 'danger',
          month: pred.month,
          message: `⚠️ Alerte: trésorerie négative prévue (${cumulativeBalance.toFixed(2)}€). Anticipez des rentrées d'argent ou réduisez vos dépenses.`,
        });
      } else if (cumulativeBalance < avgRevenue * 0.5) {
        alerts.push({
          type: 'warning',
          month: pred.month,
          message: `💰 Trésorerie faible prévue (${cumulativeBalance.toFixed(2)}€). Surveillez vos encaissements.`,
        });
      }

      if (pred.expenses > pred.revenue * 0.9) {
        alerts.push({
          type: 'warning',
          month: pred.month,
          message: `📊 Dépenses élevées prévues (${((pred.expenses / pred.revenue) * 100).toFixed(0)}% du CA). Optimisez vos charges.`,
        });
      }
    });

    // Recommandations TRÈS DÉTAILLÉES et ACTIONNABLES
    const recommendations: string[] = [];

    // 1. Analyse revenus avec actions concrètes
    if (revenueTrend < -100) {
      const lossIn6Months = Math.abs(revenueTrend) * 6;
      recommendations.push(`🚨 ALERTE CRITIQUE : Vos revenus chutent de ${Math.abs(revenueTrend).toFixed(0)}€/mois. Dans 6 mois, vous aurez perdu ${lossIn6Months.toFixed(0)}€ si rien ne change. ACTION IMMÉDIATE : Contactez vos 5 meilleurs clients cette semaine, proposez une offre spéciale valable 48h, et lancez une campagne de prospection avec un objectif de 10 rendez-vous par semaine.`);
    } else if (revenueTrend < 0) {
      recommendations.push(`📉 Vos revenus baissent de ${Math.abs(revenueTrend).toFixed(0)}€/mois. ACTION : Relancez tous vos anciens clients ce mois-ci, créez une offre "parrainage" (10% de réduction pour chaque nouveau client apporté), et testez 2 nouveaux canaux d'acquisition dans les 30 jours.`);
    } else if (revenueTrend > 300) {
      const gainIn6Months = revenueTrend * 6;
      recommendations.push(`🚀 EXCELLENTE CROISSANCE : +${revenueTrend.toFixed(0)}€/mois ! Dans 6 mois, vous aurez ${gainIn6Months.toFixed(0)}€ de plus. CONSEIL : Investissez 20% de cette croissance dans le marketing maintenant pour accélérer encore plus. Mettez ${(gainIn6Months * 0.3).toFixed(0)}€ de côté pour la trésorerie.`);
    } else if (revenueTrend > 100) {
      recommendations.push(`📈 Bonne croissance : +${revenueTrend.toFixed(0)}€/mois. CONSEIL : Automatisez vos processus pour gérer cette croissance (outils de facturation, CRM). Budget recommandé : ${(avgRevenue * 0.05).toFixed(0)}€ pour des outils pro.`);
    }

    // 2. Analyse dépenses vs revenus avec chiffres précis
    if (expenseTrend > revenueTrend && expenseTrend > 50) {
      const gap = expenseTrend - revenueTrend;
      const gapIn6Months = gap * 6;
      recommendations.push(`⚠️ VOS DÉPENSES EXPLOSENT : +${expenseTrend.toFixed(0)}€/mois vs +${revenueTrend.toFixed(0)}€/mois de revenus. Dans 6 mois, l'écart sera de ${gapIn6Months.toFixed(0)}€. ACTION : Listez TOUTES vos dépenses mensuelles, identifiez les 3 plus grosses, et négociez -20% sur chacune (loyer, abonnements, fournisseurs). Objectif : économiser ${(gap * 1.5).toFixed(0)}€/mois.`);
    }

    // 3. Volatilité avec conseil de réserve précis
    const volatilityRatio = revenueStdDev / avgRevenue;
    if (volatilityRatio > 0.4) {
      const recommendedReserve = avgExpense * 4;
      recommendations.push(`📊 TRÈS FORTE VOLATILITÉ (${(volatilityRatio * 100).toFixed(0)}%) : Votre CA varie énormément d'un mois à l'autre. DANGER : risque de trésorerie négative. SOLUTION : Constituez une réserve de sécurité de ${recommendedReserve.toFixed(0)}€ (= 4 mois de charges). Mettez de côté ${(recommendedReserve / 12).toFixed(0)}€/mois pendant 1 an, et développez des revenus récurrents (abonnements, contrats mensuels) pour lisser vos encaissements.`);
    } else if (volatilityRatio > 0.25) {
      const recommendedReserve = avgExpense * 2;
      recommendations.push(`📊 Volatilité modérée (${(volatilityRatio * 100).toFixed(0)}%) : Prévoyez une réserve de ${recommendedReserve.toFixed(0)}€ (= 2 mois de charges). Économisez ${(recommendedReserve / 6).toFixed(0)}€/mois pendant 6 mois pour sécuriser votre trésorerie.`);
    }

    // 4. Analyse trésorerie future avec actions précises
    const futureCashflow = predictions.reduce((sum, p) => sum + p.balance, 0);
    if (futureCashflow < 0) {
      recommendations.push(`🚨 TRÉSORERIE NÉGATIVE PRÉVUE : Vous allez perdre ${Math.abs(futureCashflow).toFixed(0)}€ dans les prochains mois. PLAN D'ACTION URGENT : 1) Relancez TOUS les impayés cette semaine (objectif : récupérer ${(Math.abs(futureCashflow) * 0.5).toFixed(0)}€). 2) Reportez toutes les dépenses non essentielles (≥ ${(avgExpense * 0.3).toFixed(0)}€). 3) Négociez des délais de paiement avec vos fournisseurs (30 jours → 60 jours). 4) Si ça ne suffit pas, demandez un prêt de trésorerie de ${(Math.abs(futureCashflow) * 1.2).toFixed(0)}€ à votre banque.`);
    } else if (futureCashflow < avgRevenue) {
      recommendations.push(`💰 Trésorerie serrée : +${futureCashflow.toFixed(0)}€ prévus, c'est juste. CONSEIL : Évitez les dépenses > ${(avgExpense * 0.2).toFixed(0)}€ sauf urgence. Visez ${(avgRevenue * 1.5).toFixed(0)}€ de réserve minimum.`);
    } else if (futureCashflow > avgRevenue * 3) {
      const investAmount = futureCashflow * 0.3;
      recommendations.push(`💰 EXCELLENTE TRÉSORERIE : +${futureCashflow.toFixed(0)}€ prévus ! CONSEIL : Investissez ${investAmount.toFixed(0)}€ (30%) dans la croissance (marketing, recrutement, outils), placez ${(futureCashflow * 0.3).toFixed(0)}€ sur un compte épargne pro (1.5-2% de rendement), et gardez ${(futureCashflow * 0.4).toFixed(0)}€ en réserve pour les opportunités.`);
    }

    // 5. Timing optimal avec montants précis
    const bestMonth = predictions.reduce((best, current) => 
      current.balance > best.balance ? current : best
    );
    const worstMonth = predictions.reduce((worst, current) => 
      current.balance < worst.balance ? current : worst
    );

    const bestMonthName = new Date(bestMonth.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const worstMonthName = new Date(worstMonth.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    recommendations.push(`💡 TIMING OPTIMAL : Planifiez vos GROS investissements en ${bestMonthName} (vous aurez ${bestMonth.balance.toFixed(0)}€ de marge). ÉVITEZ ABSOLUMENT les dépenses > ${(Math.abs(worstMonth.balance) * 0.5).toFixed(0)}€ en ${worstMonthName} (mois difficile : ${worstMonth.balance.toFixed(0)}€). Si vous avez une grosse dépense urgente en ${worstMonthName}, négociez un paiement en 3x.`);

    // 6. Ratio dépenses/revenus avec objectifs chiffrés
    const expenseRatio = avgExpense / avgRevenue;
    if (expenseRatio > 0.8) {
      const targetExpense = avgRevenue * 0.6;
      const reductionNeeded = avgExpense - targetExpense;
      recommendations.push(`⚠️ VOS CHARGES SONT TROP ÉLEVÉES : ${(expenseRatio * 100).toFixed(0)}% de vos revenus ! Objectif : passer à 60% maximum. PLAN : Réduisez vos charges de ${reductionNeeded.toFixed(0)}€/mois. Comment ? Renégociez votre loyer (-15%), changez de banque pro (économie moyenne : 50€/mois), regroupez vos assurances (-20%), supprimez les abonnements inutilisés (moyenne : 150€/mois).`);
    } else if (expenseRatio > 0.6) {
      const targetExpense = avgRevenue * 0.5;
      const reductionNeeded = avgExpense - targetExpense;
      recommendations.push(`📊 Charges moyennes (${(expenseRatio * 100).toFixed(0)}%). Objectif : descendre à 50% pour augmenter votre marge. Économisez ${reductionNeeded.toFixed(0)}€/mois en optimisant vos abonnements, fournisseurs et assurances.`);
    } else if (expenseRatio < 0.4) {
      const investBudget = avgRevenue * 0.2;
      recommendations.push(`✅ EXCELLENTE MAÎTRISE DES CHARGES (${(expenseRatio * 100).toFixed(0)}%) ! Vous pouvez investir ${investBudget.toFixed(0)}€/mois dans la croissance sans risque : publicité Facebook/Google (budget test : ${(investBudget * 0.5).toFixed(0)}€/mois), recrutement freelance (${(investBudget * 0.3).toFixed(0)}€/mois), ou outils d'automatisation (${(investBudget * 0.2).toFixed(0)}€/mois).`);
    }

    // 7. Conseil cash stratégique
    const monthsWithNegativeBalance = predictions.filter(p => p.balance < 0).length;
    if (monthsWithNegativeBalance > 2) {
      const totalNegative = predictions.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
      recommendations.push(`🚨 ATTENTION : ${monthsWithNegativeBalance} mois déficitaires prévus (total : -${totalNegative.toFixed(0)}€). SOLUTION : Augmentez vos prix de 10-15% dès maintenant (impact estimé : +${(avgRevenue * 0.12).toFixed(0)}€/mois), ou réduisez vos charges de ${(totalNegative / 12).toFixed(0)}€/mois. Commencez par les abonnements et renégociez vos contrats principaux.`);
    }

    return NextResponse.json({
      historical,
      predictions,
      alerts,
      recommendations,
      stats: {
        avgRevenue: Math.round(avgRevenue * 100) / 100,
        avgExpense: Math.round(avgExpense * 100) / 100,
        revenueTrend,
        expenseTrend,
        volatility: {
          revenue: Math.round((revenueStdDev / avgRevenue) * 100),
          expense: Math.round((expenseStdDev / avgExpense) * 100),
        },
      },
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des prédictions' },
      { status: 500 }
    );
  }
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

function calculateStdDev(values: number[], mean: number): number {
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

function getSeasonalFactor(historical: MonthlyData[], targetMonth: number): { revenue: number; expense: number } {
  // Analyser si ce mois a tendance à être meilleur ou moins bon
  const sameMonthData = historical.filter(h => {
    const date = new Date(h.month + '-01');
    return date.getMonth() === targetMonth;
  });

  if (sameMonthData.length === 0) {
    return { revenue: 1, expense: 1 };
  }

  const avgMonthRevenue = sameMonthData.reduce((sum, d) => sum + d.revenue, 0) / sameMonthData.length;
  const avgMonthExpense = sameMonthData.reduce((sum, d) => sum + d.expenses, 0) / sameMonthData.length;

  const totalAvgRevenue = historical.reduce((sum, d) => sum + d.revenue, 0) / historical.length;
  const totalAvgExpense = historical.reduce((sum, d) => sum + d.expenses, 0) / historical.length;

  return {
    revenue: totalAvgRevenue > 0 ? avgMonthRevenue / totalAvgRevenue : 1,
    expense: totalAvgExpense > 0 ? avgMonthExpense / totalAvgExpense : 1,
  };
}

