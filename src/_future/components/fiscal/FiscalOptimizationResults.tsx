'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  TrendingDown,
  Target,
  Zap
} from 'lucide-react';

interface Optimization {
  title: string;
  description: string;
  advantages: string[];
  estimatedSavings: number;
  difficulty: 'FACILE' | 'MOYEN' | 'COMPLEXE';
  legalRisk: 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ';
  implementationTime?: string;
}

interface QuickWin {
  action: string;
  howTo: string;
  savings: number;
}

interface NextStep {
  step: string;
  deadline: string;
  howTo: string;
}

interface FiscalOptimizationResultsProps {
  results: {
    currentSituation: {
      taxRate: number;
      estimatedTax: number;
      fiscalStatus: string;
      country?: string;
    };
    optimizations: Optimization[];
    quickWins: QuickWin[];
    warnings: string[];
    nextSteps: NextStep[];
  };
  onBack: () => void;
}

export function FiscalOptimizationResults({ results, onBack }: FiscalOptimizationResultsProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  // Vérifications défensives pour éviter les erreurs si les données sont incomplètes
  const optimizations = results?.optimizations || [];
  const quickWins = results?.quickWins || [];
  const warnings = results?.warnings || [];
  const nextSteps = results?.nextSteps || [];
  const currentSituation = results?.currentSituation || { taxRate: 0, estimatedTax: 0, fiscalStatus: '' };

  const totalSavings = 
    optimizations.reduce((sum, o) => sum + (o.estimatedSavings || 0), 0) +
    quickWins.reduce((sum, q) => sum + (q.savings || 0), 0);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Nouvelle analyse
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Votre Plan d'Optimisation
        </h1>
        <p className="text-slate-500">
          {currentSituation.country && `${currentSituation.country} • `}
          {currentSituation.fiscalStatus}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">Économies</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {totalSavings.toLocaleString('fr-FR')} €
          </p>
          <p className="text-sm text-emerald-600">par an</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Impôts actuels</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {currentSituation.estimatedTax.toLocaleString('fr-FR')} €
          </p>
          <p className="text-sm text-slate-500">taux {currentSituation.taxRate}%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">Opportunités</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {optimizations.length + quickWins.length}
          </p>
          <p className="text-sm text-slate-500">stratégies</p>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Actions rapides
          </h2>
          <div className="space-y-3">
            {quickWins.map((qw, idx) => (
              <div key={idx} className="flex items-start justify-between bg-white rounded-lg p-4 border border-amber-100">
                <div>
                  <p className="font-medium text-slate-900">{qw.action}</p>
                  <p className="text-sm text-slate-600">{qw.howTo}</p>
                </div>
                <span className="text-emerald-600 font-semibold whitespace-nowrap ml-4">
                  +{qw.savings.toLocaleString('fr-FR')} €
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimizations */}
      <div className="space-y-3 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Stratégies d'optimisation</h2>
        
        {optimizations.map((opt, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              className="w-full flex items-start justify-between p-5 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${opt.difficulty === 'FACILE' ? 'bg-emerald-100 text-emerald-700' : 
                      opt.difficulty === 'MOYEN' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-700'}
                  `}>
                    {opt.difficulty}
                  </span>
                  {opt.implementationTime && (
                    <span className="text-xs text-slate-500">{opt.implementationTime}</span>
                  )}
                </div>
                <h3 className="font-medium text-slate-900">{opt.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{opt.description}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">
                    {opt.estimatedSavings.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-xs text-slate-500">économie/an</p>
                </div>
                {expanded === idx ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {expanded === idx && (
              <div className="px-5 pb-5 pt-0 border-t border-slate-100 bg-slate-50">
                <div className="pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Avantages :</p>
                  <ul className="space-y-1">
                    {opt.advantages.map((adv, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Points d'attention
          </h2>
          <ul className="space-y-2">
            {warnings.map((w, idx) => (
              <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                <span>•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Prochaines étapes</h2>
          <div className="space-y-3">
            {nextSteps.map((ns, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{ns.step}</p>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {ns.deadline}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{ns.howTo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
