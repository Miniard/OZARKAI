'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadBilanPDF } from '../../lib/export/pdf';
import { downloadBilanExcel } from '../../lib/export/excel';
import { FileDown, FileSpreadsheet } from 'lucide-react';

interface BilanData {
  company: {
    name: string;
    siret?: string;
    type: string;
    vatRegime: string;
  };
  period: {
    year: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    balance: number;
    totalVAT: number;
    numberOfEntries: number;
    numberOfDocuments: number;
  };
  byCategory: Record<string, { debit: number; credit: number; count: number }>;
  monthlyStats: Record<string, { revenue: number; expenses: number }>;
  entries: Array<{
    date: string;
    description: string;
    category: string;
    debit: number;
    credit: number;
    documentName?: string;
  }>;
}

export default function BilanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bilan, setBilan] = useState<BilanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null); // null = auto-detect
  const [companyId, setCompanyId] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchCompany() {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const companies = await res.json();
        if (companies.length > 0) {
          setCompanyId(companies[0].id);
        }
      }
    }
    if (status === 'authenticated') {
      fetchCompany();
    }
  }, [status]);

  useEffect(() => {
    async function fetchBilan() {
      if (!companyId) return;
      setLoading(true);
      
      // Si pas d'année sélectionnée, laisser l'API auto-détecter
      const yearParam = selectedYear ? `&year=${selectedYear}` : '';
      const res = await fetch(`/api/bilan?companyId=${companyId}${yearParam}`);
      
      if (res.ok) {
        const data = await res.json();
        setBilan(data);
        
        // Synchroniser l'année avec celle détectée par l'API
        if (selectedYear === null && data.period.year) {
          setSelectedYear(data.period.year);
        }
      }
      setLoading(false);
    }
    if (companyId) {
      fetchBilan();
    }
  }, [companyId, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleDownloadPDF = () => {
    if (!bilan) return;
    
    const pdfData = {
      company: {
        name: bilan.company.name,
        type: bilan.company.type,
        vatRegime: bilan.company.vatRegime,
      },
      year: bilan.period.year,
      revenue: bilan.summary.totalRevenue,
      expenses: bilan.summary.totalExpenses,
      balance: bilan.summary.balance,
      vat: bilan.summary.totalVAT,
      documents: bilan.entries.map(entry => ({
        date: new Date(entry.date),
        type: entry.description.includes('VENTE') ? 'FACTURE_VENTE' : 'FACTURE_ACHAT',
        supplier: entry.documentName || entry.description,
        category: entry.category,
        amount: entry.credit || entry.debit,
        vat: 0,
      })),
      categoryBreakdown: Object.entries(bilan.byCategory).map(([category, data]) => ({
        category,
        count: data.count,
        total: data.credit + data.debit,
      })),
    };
    
    downloadBilanPDF(pdfData);
  };

  const handleDownloadExcel = () => {
    if (!bilan) return;
    
    const excelData = {
      company: {
        name: bilan.company.name,
        type: bilan.company.type,
        vatRegime: bilan.company.vatRegime,
      },
      year: bilan.period.year,
      revenue: bilan.summary.totalRevenue,
      expenses: bilan.summary.totalExpenses,
      balance: bilan.summary.balance,
      vat: bilan.summary.totalVAT,
      documents: bilan.entries.map(entry => ({
        date: new Date(entry.date),
        type: entry.description.includes('VENTE') ? 'FACTURE_VENTE' : 'FACTURE_ACHAT',
        supplier: entry.documentName || entry.description,
        category: entry.category,
        amount: entry.credit || entry.debit,
        vat: 0,
      })),
      categoryBreakdown: Object.entries(bilan.byCategory).map(([category, data]) => ({
        category,
        count: data.count,
        total: data.credit + data.debit,
      })),
    };
    
    downloadBilanExcel(excelData);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-white text-xl">⏳ Chargement du bilan...</div>
      </div>
    );
  }

  if (!bilan) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-white text-xl">❌ Aucune donnée disponible</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient">
              📊 Bilan Comptable {selectedYear || bilan.period.year}
            </h1>
            <p className="text-gray-400 mt-2">{bilan.company.name}</p>
            {bilan.company.siret && (
              <p className="text-gray-500 text-sm">SIRET: {bilan.company.siret}</p>
            )}
          </div>
          <div className="flex gap-4">
            <select
              value={selectedYear || bilan.period.year}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2"
            >
              {[2025, 2024, 2023, 2022].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button onClick={handleDownloadPDF} className="btn-ozark">
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              ← Retour
            </Button>
          </div>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/50">
            <CardContent className="py-6">
              <p className="text-sm text-gray-300 mb-2">💰 Revenus Total</p>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(bilan.summary.totalRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-500/50">
            <CardContent className="py-6">
              <p className="text-sm text-gray-300 mb-2">💸 Dépenses Total</p>
              <p className="text-3xl font-bold text-red-400">
                {formatCurrency(bilan.summary.totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              bilan.summary.balance >= 0
                ? 'from-blue-600/20 to-blue-800/20 border-blue-500/50'
                : 'from-orange-600/20 to-orange-800/20 border-orange-500/50'
            }`}
          >
            <CardContent className="py-6">
              <p className="text-sm text-gray-300 mb-2">💵 Solde</p>
              <p
                className={`text-3xl font-bold ${
                  bilan.summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'
                }`}
              >
                {formatCurrency(bilan.summary.balance)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/50">
            <CardContent className="py-6">
              <p className="text-sm text-gray-300 mb-2">🏛️ TVA</p>
              <p className="text-3xl font-bold text-yellow-400">
                {formatCurrency(bilan.summary.totalVAT)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info entreprise */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ℹ️ Informations Entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Type d'entreprise</p>
                <p className="text-white font-semibold">{bilan.company.type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Régime TVA</p>
                <p className="text-white font-semibold">
                  {bilan.company.vatRegime.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Nombre de documents</p>
                <p className="text-white font-semibold">{bilan.summary.numberOfDocuments}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Nombre d'écritures</p>
                <p className="text-white font-semibold">{bilan.summary.numberOfEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Par catégorie */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>📁 Répartition par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(bilan.byCategory).map(([category, data]) => (
                <div key={category} className="border-b border-dark-700 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{category}</span>
                    <span className="text-gray-400 text-sm">{data.count} opération(s)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {data.credit > 0 && (
                      <div>
                        <p className="text-green-400 text-sm">Crédits</p>
                        <p className="text-white font-bold">{formatCurrency(data.credit)}</p>
                      </div>
                    )}
                    {data.debit > 0 && (
                      <div>
                        <p className="text-red-400 text-sm">Débits</p>
                        <p className="text-white font-bold">{formatCurrency(data.debit)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grand livre (aperçu) */}
        <Card>
          <CardHeader>
            <CardTitle>📖 Grand Livre - Aperçu des 20 dernières écritures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">Date</th>
                    <th className="px-4 py-3 text-left text-sm">Description</th>
                    <th className="px-4 py-3 text-left text-sm">Catégorie</th>
                    <th className="px-4 py-3 text-right text-sm">Débit</th>
                    <th className="px-4 py-3 text-right text-sm">Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {bilan.entries.slice(0, 20).map((entry, idx) => (
                    <tr key={idx} className="border-b border-dark-700 hover:bg-dark-800/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(entry.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{entry.category}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-400">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-400">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

