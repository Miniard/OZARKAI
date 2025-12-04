/**
 * Composant Dashboard principal - Design moderne et lumineux
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Receipt, FileText, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import type { DashboardData } from '@/types';

interface DashboardProps {
  companyId: string;
}

export function Dashboard({ companyId }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
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

    fetchData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-danger-50 border-danger-200">
        <CardContent className="py-6">
          <p className="font-medium text-danger-700">Erreur</p>
          <p className="text-sm text-danger-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Solde principal */}
      <Card className={`border-2 ${data.balance >= 0 ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50'}`}>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600 mb-2">Solde actuel</p>
            <div className={`text-5xl font-bold mb-3 ${data.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {formatCurrency(data.balance)}
            </div>
            <p className={`text-sm ${data.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {data.balance >= 0 
                ? '✓ Vos revenus dépassent vos dépenses' 
                : '⚠ Vos dépenses dépassent vos revenus'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenus */}
        <Card className="border-l-4 border-l-success-500">
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success-500" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-success-500" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Revenus</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.revenue)}</p>
            <p className="text-xs text-slate-400 mt-2">Total des ventes et facturations</p>
          </CardContent>
        </Card>
        
        {/* Dépenses */}
        <Card className="border-l-4 border-l-danger-500">
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-danger-500" />
              </div>
              <ArrowDownRight className="w-5 h-5 text-danger-500" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Dépenses</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.expenses)}</p>
            <p className="text-xs text-slate-400 mt-2">Total des achats et charges</p>
          </CardContent>
        </Card>
        
        {/* TVA */}
        <Card className="border-l-4 border-l-warning-500">
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">TVA estimée</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.vat)}</p>
            <p className="text-xs text-slate-400 mt-2">TVA récupérable sur vos achats</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-primary-50 border-primary-100">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Comment lire ces chiffres ?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-success-600">Revenus</strong> = argent reçu • 
                <strong className="text-danger-600"> Dépenses</strong> = argent payé • 
                <strong className="text-warning-600"> TVA</strong> = taxe récupérable • 
                <strong className="text-primary-600"> Solde</strong> = revenus - dépenses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique mensuel */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
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
              <Bar dataKey="revenue" name="Revenus" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Dépenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
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
