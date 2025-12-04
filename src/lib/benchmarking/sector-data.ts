/**
 * Données de benchmarking par secteur
 * Moyennes du marché français 2024
 */

export interface SectorBenchmark {
  sector: string;
  avgRevenue: number; // CA moyen annuel
  avgMargin: number; // Marge nette moyenne (%)
  avgExpenseRatio: number; // Ratio charges/CA (%)
  avgEmployeeCost: number; // Coût moyen par employé
  top10Margin: number; // Marge des 10% meilleurs
  medianRevenue: number; // CA médian
}

export const SECTOR_BENCHMARKS: Record<string, SectorBenchmark> = {
  'consulting_it': {
    sector: 'Conseil IT / Développement',
    avgRevenue: 85000,
    avgMargin: 32,
    avgExpenseRatio: 45,
    avgEmployeeCost: 55000,
    top10Margin: 55,
    medianRevenue: 72000,
  },
  'ecommerce': {
    sector: 'E-commerce',
    avgRevenue: 120000,
    avgMargin: 18,
    avgExpenseRatio: 68,
    avgEmployeeCost: 35000,
    top10Margin: 35,
    medianRevenue: 95000,
  },
  'restauration': {
    sector: 'Restauration',
    avgRevenue: 250000,
    avgMargin: 12,
    avgExpenseRatio: 75,
    avgEmployeeCost: 28000,
    top10Margin: 22,
    medianRevenue: 180000,
  },
  'services_pro': {
    sector: 'Services aux professionnels',
    avgRevenue: 95000,
    avgMargin: 28,
    avgExpenseRatio: 52,
    avgEmployeeCost: 42000,
    top10Margin: 48,
    medianRevenue: 78000,
  },
  'artisanat': {
    sector: 'Artisanat',
    avgRevenue: 65000,
    avgMargin: 25,
    avgExpenseRatio: 58,
    avgEmployeeCost: 32000,
    top10Margin: 42,
    medianRevenue: 52000,
  },
  'immobilier': {
    sector: 'Immobilier / Gestion locative',
    avgRevenue: 145000,
    avgMargin: 22,
    avgExpenseRatio: 62,
    avgEmployeeCost: 38000,
    top10Margin: 40,
    medianRevenue: 110000,
  },
  'sante': {
    sector: 'Santé / Paramédical',
    avgRevenue: 110000,
    avgMargin: 35,
    avgExpenseRatio: 42,
    avgEmployeeCost: 45000,
    top10Margin: 52,
    medianRevenue: 95000,
  },
  'marketing': {
    sector: 'Marketing / Communication',
    avgRevenue: 78000,
    avgMargin: 30,
    avgExpenseRatio: 48,
    avgEmployeeCost: 40000,
    top10Margin: 50,
    medianRevenue: 65000,
  },
  'formation': {
    sector: 'Formation / Coaching',
    avgRevenue: 68000,
    avgMargin: 38,
    avgExpenseRatio: 40,
    avgEmployeeCost: 48000,
    top10Margin: 58,
    medianRevenue: 55000,
  },
  'transport': {
    sector: 'Transport / Logistique',
    avgRevenue: 180000,
    avgMargin: 15,
    avgExpenseRatio: 72,
    avgEmployeeCost: 32000,
    top10Margin: 28,
    medianRevenue: 145000,
  },
  'other': {
    sector: 'Autre secteur',
    avgRevenue: 80000,
    avgMargin: 25,
    avgExpenseRatio: 55,
    avgEmployeeCost: 38000,
    top10Margin: 42,
    medianRevenue: 65000,
  },
};

export function detectSector(companyName: string, description?: string): string {
  const text = `${companyName} ${description || ''}`.toLowerCase();

  if (text.includes('dev') || text.includes('it') || text.includes('informatique') || text.includes('web') || text.includes('software')) {
    return 'consulting_it';
  }
  if (text.includes('ecommerce') || text.includes('e-commerce') || text.includes('boutique') || text.includes('shop')) {
    return 'ecommerce';
  }
  if (text.includes('restaurant') || text.includes('café') || text.includes('bar') || text.includes('traiteur')) {
    return 'restauration';
  }
  if (text.includes('conseil') || text.includes('consulting') || text.includes('audit')) {
    return 'services_pro';
  }
  if (text.includes('artisan') || text.includes('plombier') || text.includes('électricien') || text.includes('menuisier')) {
    return 'artisanat';
  }
  if (text.includes('immobilier') || text.includes('location') || text.includes('gestion locative')) {
    return 'immobilier';
  }
  if (text.includes('santé') || text.includes('médical') || text.includes('infirmier') || text.includes('kiné')) {
    return 'sante';
  }
  if (text.includes('marketing') || text.includes('communication') || text.includes('pub') || text.includes('design')) {
    return 'marketing';
  }
  if (text.includes('formation') || text.includes('coaching') || text.includes('formateur')) {
    return 'formation';
  }
  if (text.includes('transport') || text.includes('livraison') || text.includes('logistique')) {
    return 'transport';
  }

  return 'other';
}

export function compareToBenchmark(
  revenue: number,
  expenses: number,
  sector: string
): {
  sector: SectorBenchmark;
  revenueComparison: number; // % vs moyenne
  marginComparison: number; // points vs moyenne
  expenseComparison: number; // points vs moyenne
  percentile: number; // Position (0-100)
  insights: string[];
  recommendations: string[];
} {
  const benchmark = SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS['other'];
  const margin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
  const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;

  const revenueComparison = revenue > 0 ? ((revenue - benchmark.avgRevenue) / benchmark.avgRevenue) * 100 : 0;
  const marginComparison = margin - benchmark.avgMargin;
  const expenseComparison = expenseRatio - benchmark.avgExpenseRatio;

  // Calculer le percentile (simplifié)
  let percentile = 50;
  if (margin >= benchmark.top10Margin) {
    percentile = 90 + ((margin - benchmark.top10Margin) / benchmark.top10Margin) * 10;
  } else if (margin >= benchmark.avgMargin) {
    percentile = 50 + ((margin - benchmark.avgMargin) / (benchmark.top10Margin - benchmark.avgMargin)) * 40;
  } else {
    percentile = (margin / benchmark.avgMargin) * 50;
  }
  percentile = Math.min(99, Math.max(1, percentile));

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Analyse du CA
  if (revenueComparison > 50) {
    insights.push(`💰 Votre CA (${revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) est **${revenueComparison.toFixed(0)}% au-dessus** de la moyenne du secteur. Excellent !`);
  } else if (revenueComparison > 10) {
    insights.push(`👍 Votre CA est ${revenueComparison.toFixed(0)}% au-dessus de la moyenne sectorielle.`);
  } else if (revenueComparison > -10) {
    insights.push(`📊 Votre CA est dans la moyenne du secteur (${revenueComparison > 0 ? '+' : ''}${revenueComparison.toFixed(0)}%).`);
  } else if (revenueComparison > -30) {
    insights.push(`⚠️ Votre CA est ${Math.abs(revenueComparison).toFixed(0)}% en dessous de la moyenne sectorielle.`);
    recommendations.push(`Augmentez vos prix de 10-15% ou intensifiez vos actions commerciales pour atteindre la moyenne du secteur (${benchmark.avgRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}).`);
  } else {
    insights.push(`🚨 Votre CA est largement inférieur à la moyenne du secteur (-${Math.abs(revenueComparison).toFixed(0)}%).`);
    recommendations.push(`Action urgente : Votre CA devrait être au minimum de ${benchmark.medianRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} (médiane du secteur). Revoyez votre stratégie commerciale.`);
  }

  // Analyse de la marge
  if (marginComparison > 10) {
    insights.push(`✅ Votre marge (${margin.toFixed(1)}%) est **excellente**, ${marginComparison.toFixed(1)} points au-dessus de la moyenne du secteur !`);
    insights.push(`🏆 Vous êtes dans le **top ${(100 - percentile).toFixed(0)}%** du secteur.`);
  } else if (marginComparison > 0) {
    insights.push(`👍 Votre marge (${margin.toFixed(1)}%) est ${marginComparison.toFixed(1)} points au-dessus de la moyenne.`);
  } else if (marginComparison > -5) {
    insights.push(`📊 Votre marge (${margin.toFixed(1)}%) est légèrement en dessous de la moyenne sectorielle (${benchmark.avgMargin}%).`);
    recommendations.push(`Optimisez vos charges ou augmentez vos prix de 5% pour atteindre la moyenne du secteur.`);
  } else {
    insights.push(`⚠️ Votre marge (${margin.toFixed(1)}%) est ${Math.abs(marginComparison).toFixed(1)} points sous la moyenne du secteur.`);
    recommendations.push(`Réduisez vos charges de ${(expenseRatio - benchmark.avgExpenseRatio).toFixed(1)} points pour atteindre la norme sectorielle.`);
  }

  // Analyse des charges
  if (expenseComparison < -5) {
    insights.push(`💪 Vos charges (${expenseRatio.toFixed(1)}% du CA) sont bien maîtrisées, ${Math.abs(expenseComparison).toFixed(1)} points sous la moyenne.`);
  } else if (expenseComparison < 5) {
    insights.push(`📊 Votre ratio de charges (${expenseRatio.toFixed(1)}%) est dans la norme sectorielle.`);
  } else {
    insights.push(`⚠️ Vos charges (${expenseRatio.toFixed(1)}% du CA) sont ${expenseComparison.toFixed(1)} points au-dessus de la moyenne.`);
    recommendations.push(`Identifiez les postes de dépenses à optimiser. La moyenne du secteur est à ${benchmark.avgExpenseRatio}%.`);
  }

  // Recommandations générales
  if (margin < benchmark.top10Margin) {
    const gap = benchmark.top10Margin - margin;
    recommendations.push(`💡 Pour rejoindre le top 10% du secteur (marge ${benchmark.top10Margin}%), améliorez votre marge de ${gap.toFixed(1)} points. Cela représente ${((revenue * gap) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de profit supplémentaire.`);
  }

  return {
    sector: benchmark,
    revenueComparison,
    marginComparison,
    expenseComparison,
    percentile,
    insights,
    recommendations,
  };
}

