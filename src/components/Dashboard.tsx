/**
 * Composant Dashboard principal - Design moderne et professionnel
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Receipt, FileText, ArrowUpRight, ArrowDownRight, Info, Sparkles, Loader2 } from 'lucide-react';
import type { DashboardData } from '@/types';

// Couleurs pour les graphiques
const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316', '#EAB308', '#22C55E', '#14B8A6'];
const EXPENSE_COLORS = {
  'Fournitures': '#6366F1',
  'Services': '#8B5CF6', 
  'Abonnements': '#EC4899',
  'Transport': '#F97316',
  'Restauration': '#EAB308',
  'Autres': '#94A3B8',
};

interface DashboardProps {
  companyId: string;
}

export function Dashboard({ companyId }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchData();
    } else {
      setLoading(false);
      setData(null);
    }
  }, [companyId]);

  async function fetchData() {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard?companyId=${companyId}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  // Analyser tous les documents en attente
  const handleAnalyzeAll = async () => {
    setIsAnalyzingAll(true);
    try {
      const response = await fetch('/api/documents/analyze', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${result.analyzed} document(s) analysé(s) !`);
        fetchData(); // Recharger les données
      }
    } catch (e) {
      alert('Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="font-medium text-amber-700">Aucune donnée à afficher</p>
          <p className="text-sm text-amber-600 mt-2">Importez vos premières factures depuis Gmail ou Outlook pour voir vos statistiques</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  // Calculer les données pour le graphique circulaire des dépenses
  const expensesByCategory = data?.recentDocuments
    ?.filter(doc => doc.type === 'FACTURE_ACHAT' || doc.type === 'NOTE_FRAIS')
    ?.reduce((acc: any[], doc: any) => {
      const category = doc.analysisData?.category || 'Autres';
      const existing = acc.find(item => item.name === category);
      if (existing) {
        existing.value += doc.amount || 0;
      } else {
        acc.push({ name: category, value: doc.amount || 0 });
      }
      return acc;
    }, []) || [];

  // Documents non analysés
  const unanalyzedCount = data?.recentDocuments?.filter(d => !d.analyzed).length || 0;

  return (
    <div className="space-y-6">
      {/* Alerte documents non analysés */}
      {unanalyzedCount > 0 && (
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {unanalyzedCount} document{unanalyzedCount > 1 ? 's' : ''} en attente d'analyse
                  </p>
                  <p className="text-sm text-slate-500">
                    L'IA peut extraire automatiquement les montants et informations
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleAnalyzeAll}
                disabled={isAnalyzingAll}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isAnalyzingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tout analyser
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solde principal - Plus grand et impactant */}
      <Card className={`border-2 ${data.balance >= 0 ? 'border-success-200 bg-gradient-to-br from-success-50 to-emerald-50' : 'border-danger-200 bg-gradient-to-br from-danger-50 to-red-50'}`}>
        <CardContent className="py-10">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600 mb-3 uppercase tracking-wider">Solde actuel</p>
            <div className={`text-6xl font-bold mb-4 ${data.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {formatCurrency(data.balance)}
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${data.balance >= 0 ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
              {data.balance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {data.balance >= 0 
                  ? 'Rentabilité positive' 
                  : 'Attention : dépenses > revenus'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards - Design amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenus */}
        <Card className="relative overflow-hidden">
          <CardContent className="py-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-medium">Entrées</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Revenus totaux</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.revenue)}</p>
            <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>
        
        {/* Dépenses */}
        <Card className="relative overflow-hidden">
          <CardContent className="py-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                <ArrowDownRight className="w-4 h-4" />
                <span className="text-xs font-medium">Sorties</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Dépenses totales</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.expenses)}</p>
            <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((data.expenses / data.revenue) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        
        {/* TVA */}
        <Card className="relative overflow-hidden">
          <CardContent className="py-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <span className="text-xs font-medium">À récupérer</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">TVA déductible</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.vat)}</p>
            <p className="text-xs text-slate-400 mt-3">TVA sur vos achats professionnels</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques en ligne */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle - Graphique en aires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Évolution mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#1E293B', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des dépenses - Graphique circulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-500" />
              Répartition des dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expensesByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
                <Receipt className="w-12 h-12 mb-3 opacity-50" />
                <p>Pas encore de dépenses analysées</p>
                <p className="text-sm">Importez et analysez vos factures</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Barres de comparaison Revenus vs Dépenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-primary-500" />
            Comparaison mensuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#1E293B', fontWeight: 600 }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenus" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Dépenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Documents récents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dernières factures</CardTitle>
            <span className="text-sm text-slate-500">
              {data.recentDocuments.length} document{data.recentDocuments.length > 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentDocuments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">Aucune facture</p>
              <p className="text-sm text-slate-400">Importez votre première facture pour commencer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentDocuments.map((doc) => {
                const isExpense = doc.type === 'FACTURE_ACHAT' || doc.type === 'NOTE_FRAIS';
                const isIncome = doc.type === 'FACTURE_VENTE';
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isExpense ? 'bg-danger-100' : isIncome ? 'bg-success-100' : 'bg-primary-100'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          isExpense ? 'text-danger-600' : isIncome ? 'text-success-600' : 'text-primary-600'
                        }`} />
                      </div>
                      
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
                          {doc.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isExpense 
                              ? 'bg-danger-100 text-danger-700' 
                              : isIncome 
                                ? 'bg-success-100 text-success-700'
                                : 'bg-primary-100 text-primary-700'
                          }`}>
                            {isExpense ? 'Dépense' : isIncome ? 'Revenu' : doc.type}
                          </span>
                          <span className="text-xs text-slate-400">{formatDateShort(doc.date)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            doc.analyzed 
                              ? 'bg-success-100 text-success-700' 
                              : 'bg-warning-100 text-warning-700'
                          }`}>
                            {doc.analyzed ? '✓ Analysé' : 'En cours'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className={`text-xl font-bold ${
                      isExpense ? 'text-danger-600' : isIncome ? 'text-success-600' : 'text-primary-600'
                    }`}>
                      {formatCurrency(doc.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
