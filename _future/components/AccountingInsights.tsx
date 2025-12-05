/**
 * Insights comptables IA - Design moderne et lumineux
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, CheckCircle, TrendingUp, Lightbulb, Eye, DollarSign, Sparkles } from 'lucide-react';

export interface Insight {
  type: 'warning' | 'success' | 'info' | 'tip' | 'suspect';
  title: string;
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  amount?: number;
  suggestion?: string;
  documents?: string[];
}

interface AccountingInsightsProps {
  insights: Insight[];
  loading?: boolean;
}

export function AccountingInsights({ insights, loading }: AccountingInsightsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
        <span className="ml-3 text-slate-500">Analyse en cours...</span>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium mb-1">Pas encore d'analyse</p>
        <p className="text-sm text-slate-400">Importez des factures pour obtenir des insights.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
      case 'suspect':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'info':
        return <TrendingUp className="w-4 h-4" />;
      case 'tip':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getStyle = (type: string, severity?: string) => {
    if (type === 'suspect' || (type === 'warning' && severity === 'critical')) {
      return {
        bg: 'bg-danger-50',
        border: 'border-danger-200',
        text: 'text-danger-700',
        iconBg: 'bg-danger-100',
        icon: 'text-danger-600',
      };
    }
    
    switch (type) {
      case 'warning':
        return severity === 'high'
          ? { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', iconBg: 'bg-warning-100', icon: 'text-warning-600' }
          : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100', icon: 'text-amber-600' };
      case 'success':
        return { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', iconBg: 'bg-success-100', icon: 'text-success-600' };
      case 'info':
        return { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-700', iconBg: 'bg-primary-100', icon: 'text-primary-600' };
      case 'tip':
        return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100', icon: 'text-purple-600' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', iconBg: 'bg-slate-100', icon: 'text-slate-600' };
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    
    const badges: Record<string, { label: string; color: string }> = {
      low: { label: 'Faible', color: 'bg-primary-100 text-primary-700' },
      medium: { label: 'Moyen', color: 'bg-amber-100 text-amber-700' },
      high: { label: 'Élevé', color: 'bg-warning-100 text-warning-700' },
      critical: { label: 'Critique', color: 'bg-danger-100 text-danger-700' },
    };
    
    const badge = badges[severity];
    return badge ? (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    ) : null;
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => {
        const style = getStyle(insight.type, insight.severity);
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${style.bg} ${style.border}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${style.iconBg} ${style.icon} flex items-center justify-center flex-shrink-0`}>
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`font-semibold text-sm ${style.text}`}>{insight.title}</h4>
                  {getSeverityBadge(insight.severity)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{insight.message}</p>
                
                {insight.amount && (
                  <div className="flex items-center gap-2 mt-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">
                      {insight.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                )}
                
                {insight.suggestion && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">💡 Recommandation :</span> {insight.suggestion}
                    </p>
                  </div>
                )}
                
                {insight.documents && insight.documents.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    📄 {insight.documents.length} document{insight.documents.length > 1 ? 's' : ''} concerné{insight.documents.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
