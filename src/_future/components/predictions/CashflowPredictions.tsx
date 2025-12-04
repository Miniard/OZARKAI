/**
 * Prédictions de trésorerie - Design moderne et lumineux
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  balance: number;
}

interface Alert {
  type: 'warning' | 'danger' | 'info';
  month: string;
  message: string;
}

interface CashflowPredictionsProps {
  companyId: string;
}

export function CashflowPredictions({ companyId }: CashflowPredictionsProps) {
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(6);
  const [data, setData] = useState<{
    historical: MonthlyData[];
    predictions: MonthlyData[];
    alerts: Alert[];
    recommendations: string[];
    stats: any;
  } | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, [companyId, horizon]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/predictions/cashflow?companyId=${companyId}&horizon=${horizon}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Prédictions de Trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
            <span className="ml-4 text-slate-500">Analyse en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.historical.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Prédictions de Trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Pas assez de données</p>
            <p className="text-sm text-slate-400">Uploadez au moins 3 mois de factures pour activer les prédictions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour le graphique
  const chartData = [
    ...data.historical.map(d => ({
      month: new Date(d.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      revenue: d.revenue,
      expenses: d.expenses,
      balance: d.balance,
      type: 'historique',
    })),
    ...data.predictions.map(d => ({
      month: new Date(d.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      revenue: d.revenue,
      expenses: d.expenses,
      balance: d.balance,
      type: 'prédiction',
    })),
  ];

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'danger':
        return 'border-danger-200 bg-danger-50 text-danger-700';
      case 'warning':
        return 'border-warning-200 bg-warning-50 text-warning-700';
      case 'info':
        return 'border-primary-200 bg-primary-50 text-primary-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              Prédictions de Trésorerie IA
            </CardTitle>
            <div className="flex gap-2">
              {[3, 6, 12].map((h) => (
                <Button
                  key={h}
                  onClick={() => setHorizon(h)}
                  variant={horizon === h ? 'primary' : 'outline'}
                  size="sm"
                >
                  {h} mois
                </Button>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Basé sur {data.historical.length} mois d'historique • Prédiction sur {data.predictions.length} mois
          </p>
        </CardHeader>
      </Card>

      {/* Graphique principal */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution et Prévisions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#1E293B', fontWeight: 600 }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name="Revenus" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Dépenses" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#2B7FFF"
                strokeWidth={3}
                name="Solde"
                dot={{ fill: '#2B7FFF', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="mt-4 text-center text-xs text-slate-400">
            Zone gauche : historique réel • Zone droite : prédictions IA
          </p>
        </CardContent>
      </Card>

      {/* Stats clés */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <CardContent className="py-4">
            <p className="text-sm text-slate-500 mb-1">Revenu moyen</p>
            <p className="text-2xl font-bold text-slate-900">
              {data.stats.avgRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger-500">
          <CardContent className="py-4">
            <p className="text-sm text-slate-500 mb-1">Dépense moyenne</p>
            <p className="text-2xl font-bold text-slate-900">
              {data.stats.avgExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${data.stats.revenueTrend >= 0 ? 'border-l-success-500' : 'border-l-danger-500'}`}>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500 mb-1">Tendance revenus</p>
            <div className={`text-2xl font-bold flex items-center gap-2 ${data.stats.revenueTrend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {data.stats.revenueTrend >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {data.stats.revenueTrend > 0 ? '+' : ''}{data.stats.revenueTrend.toFixed(0)}€/mois
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning-500">
          <CardContent className="py-4">
            <p className="text-sm text-slate-500 mb-1">Volatilité CA</p>
            <p className="text-2xl font-bold text-slate-900">
              {data.stats.volatility.revenue}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {data.alerts.length > 0 && (
        <Card className="border-warning-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning-700">
              <AlertTriangle className="w-5 h-5" />
              Alertes Prévisionnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${getAlertStyle(alert.type)}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">
                        {new Date(alert.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      <Card className="bg-primary-50 border-primary-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-700">
            <Lightbulb className="w-5 h-5" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
