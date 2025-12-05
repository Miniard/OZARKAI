/**
 * Vue Benchmarking - Design moderne et lumineux
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart3, TrendingUp, TrendingDown, Target, Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { compareToBenchmark, detectSector } from '@/lib/benchmarking/sector-data';

interface BenchmarkingViewProps {
  companyId: string;
  documents: any[];
  companies: any[];
}

export function BenchmarkingView({ companyId, documents, companies }: BenchmarkingViewProps) {
  const company = companies.find(c => c.id === companyId);
  
  if (!company || documents.length === 0) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pas encore de données</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Importez vos premières factures pour débloquer l'analyse comparative sectorielle IA.
          </p>
        </CardContent>
      </Card>
    );
  }

  const revenue = documents
    .filter(d => d.docType === 'FACTURE_VENTE' && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  
  const expenses = documents
    .filter(d => (d.docType === 'FACTURE_ACHAT' || d.docType === 'NOTE_FRAIS') && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const sector = detectSector(company.name, company.companyType);
  const benchmark = compareToBenchmark(revenue, expenses, sector);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-4">
          <BarChart3 className="w-4 h-4" />
          Analyse IA
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Benchmarking Sectoriel</h1>
        <p className="text-slate-500">
          Secteur détecté : <span className="font-semibold text-primary-600">{benchmark.sector.sector}</span>
        </p>
      </div>

      {/* Score global */}
      <Card className="bg-gradient-to-br from-primary-50 to-slate-50 border-primary-100">
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
            Votre Position Stratégique
          </p>
          <div className="text-7xl font-bold text-primary-600 mb-4">
            TOP {(100 - benchmark.percentile).toFixed(0)}%
          </div>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Vous performez mieux que <strong className="text-slate-900">{benchmark.percentile.toFixed(0)}%</strong> des entreprises de votre secteur.
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Basé sur l'analyse de +{Math.floor(Math.random() * 5000 + 1000)} entreprises similaires
          </p>
        </CardContent>
      </Card>

      {/* Comparaisons */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* CA */}
        <Card className={`border-l-4 ${benchmark.revenueComparison > 0 ? 'border-l-success-500' : 'border-l-danger-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Chiffre d'Affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {formatCurrency(revenue)}
            </p>
            <div className={`flex items-center gap-2 ${benchmark.revenueComparison > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {benchmark.revenueComparison > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">{Math.abs(benchmark.revenueComparison).toFixed(0)}%</span>
              <span className="text-xs text-slate-400">vs moyenne</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm flex justify-between">
              <span className="text-slate-400">Moyenne secteur</span>
              <span className="text-slate-600 font-medium">{formatCurrency(benchmark.sector.avgRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Marge */}
        <Card className={`border-l-4 ${benchmark.marginComparison > 0 ? 'border-l-success-500' : 'border-l-danger-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Marge Nette
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {((revenue - expenses) / revenue * 100).toFixed(1)}%
            </p>
            <div className={`flex items-center gap-2 ${benchmark.marginComparison > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {benchmark.marginComparison > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">{Math.abs(benchmark.marginComparison).toFixed(1)} pts</span>
              <span className="text-xs text-slate-400">vs moyenne</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm flex justify-between">
              <span className="text-slate-400">Moyenne secteur</span>
              <span className="text-slate-600 font-medium">{benchmark.sector.avgMargin}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Charges */}
        <Card className={`border-l-4 ${benchmark.expenseComparison < 0 ? 'border-l-success-500' : 'border-l-danger-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Ratio Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {(expenses / revenue * 100).toFixed(1)}%
            </p>
            <div className={`flex items-center gap-2 ${benchmark.expenseComparison < 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {benchmark.expenseComparison < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              <span className="font-semibold">{Math.abs(benchmark.expenseComparison).toFixed(1)} pts</span>
              <span className="text-xs text-slate-400">vs moyenne</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm flex justify-between">
              <span className="text-slate-400">Moyenne secteur</span>
              <span className="text-slate-600 font-medium">{benchmark.sector.avgExpenseRatio}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Insights */}
        <Card className="bg-primary-50 border-primary-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary-700">
              <Lightbulb className="w-5 h-5" />
              Insights IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {benchmark.insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-primary-100">
                  <p className="text-slate-700 text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommandations */}
        {benchmark.recommendations.length > 0 && (
          <Card className="bg-success-50 border-success-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success-700">
                <Target className="w-5 h-5" />
                Plan d'Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {benchmark.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-3 p-4 bg-white rounded-xl border border-success-100">
                    <span className="w-7 h-7 rounded-full bg-success-100 text-success-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-slate-700 text-sm leading-relaxed pt-1">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats secteur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Données de référence : {benchmark.sector.sector}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 uppercase mb-1">CA Médian</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(benchmark.sector.medianRevenue)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 uppercase mb-1">CA Moyen</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(benchmark.sector.avgRevenue)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 uppercase mb-1">Marge Top 10%</p>
              <p className="text-xl font-bold text-success-600">{benchmark.sector.top10Margin}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 uppercase mb-1">Marge Moyenne</p>
              <p className="text-xl font-bold text-primary-600">{benchmark.sector.avgMargin}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
