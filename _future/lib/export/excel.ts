/**
 * Utilitaires pour générer des fichiers Excel
 */

import * as XLSX from 'xlsx';

interface BilanData {
  company: {
    name: string;
    type: string;
    vatRegime: string;
  };
  year: number;
  revenue: number;
  expenses: number;
  balance: number;
  vat: number;
  documents: Array<{
    date: Date;
    type: string;
    supplier: string;
    category: string;
    amount: number;
    vat: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    total: number;
  }>;
}

export function generateBilanExcel(data: BilanData) {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Résumé
  const summaryData = [
    ['BILAN COMPTABLE'],
    [data.company.name],
    [`Exercice ${data.year}`],
    [],
    ['INFORMATIONS ENTREPRISE'],
    ['Type d\'entreprise', data.company.type],
    ['Régime TVA', data.company.vatRegime],
    ['Nombre de documents', data.documents.length],
    [],
    ['RÉSUMÉ FINANCIER'],
    ['Libellé', 'Montant (€)'],
    ['Revenus Total', data.revenue],
    ['Dépenses Total', data.expenses],
    ['Solde', data.balance],
    ['TVA', data.vat],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Styles (largeur des colonnes)
  summarySheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');
  
  // Sheet 2: Répartition par catégorie
  const categoryData = [
    ['RÉPARTITION PAR CATÉGORIE'],
    [],
    ['Catégorie', 'Nombre d\'opérations', 'Total (€)'],
    ...data.categoryBreakdown.map(cat => [
      cat.category,
      cat.count,
      cat.total,
    ]),
  ];
  
  const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
  categorySheet['!cols'] = [
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Catégories');
  
  // Sheet 3: Grand Livre
  const documentsData = [
    ['GRAND LIVRE - DÉTAIL DES ÉCRITURES'],
    [],
    ['Date', 'Type', 'Fournisseur', 'Catégorie', 'Montant (€)', 'TVA (€)'],
    ...data.documents.map(doc => [
      new Date(doc.date).toLocaleDateString('fr-FR'),
      doc.type,
      doc.supplier || '-',
      doc.category,
      doc.amount,
      doc.vat || 0,
    ]),
  ];
  
  const documentsSheet = XLSX.utils.aoa_to_sheet(documentsData);
  documentsSheet['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 25 },
    { wch: 35 },
    { wch: 15 },
    { wch: 12 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, documentsSheet, 'Grand Livre');
  
  return workbook;
}

export function downloadBilanExcel(data: BilanData, filename?: string) {
  const workbook = generateBilanExcel(data);
  const name = filename || `bilan-${data.company.name}-${data.year}.xlsx`;
  XLSX.writeFile(workbook, name);
}

export function generateInsightsExcel(insights: any[], companyName: string) {
  const workbook = XLSX.utils.book_new();
  
  // Sheet: Insights
  const insightsData = [
    ['RAPPORT D\'ANALYSE COMPTABLE'],
    [companyName],
    [`Généré le ${new Date().toLocaleDateString('fr-FR')}`],
    [],
    ['Type', 'Sévérité', 'Titre', 'Message', 'Suggestion', 'Montant (€)'],
    ...insights.map(insight => [
      insight.type,
      insight.severity || '-',
      insight.title,
      insight.message,
      insight.suggestion || '-',
      insight.amount || '-',
    ]),
  ];
  
  const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
  insightsSheet['!cols'] = [
    { wch: 10 },
    { wch: 10 },
    { wch: 30 },
    { wch: 60 },
    { wch: 60 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Analyse');
  
  return workbook;
}

export function downloadInsightsExcel(insights: any[], companyName: string, filename?: string) {
  const workbook = generateInsightsExcel(insights, companyName);
  const name = filename || `analyse-comptable-${companyName}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, name);
}

export function generateDeclarationTVA(data: {
  company: { name: string; siret?: string };
  period: { start: Date; end: Date };
  tvaCollectee: number;
  tvaDeductible: number;
  tvaDue: number;
  details: Array<{
    libelle: string;
    montantHT: number;
    tva: number;
  }>;
}) {
  const workbook = XLSX.utils.book_new();
  
  const declarationData = [
    ['DÉCLARATION DE TVA'],
    [data.company.name],
    [data.company.siret ? `SIRET: ${data.company.siret}` : ''],
    [`Période: du ${data.period.start.toLocaleDateString('fr-FR')} au ${data.period.end.toLocaleDateString('fr-FR')}`],
    [],
    ['RÉCAPITULATIF'],
    ['TVA Collectée', data.tvaCollectee],
    ['TVA Déductible', data.tvaDeductible],
    ['TVA à payer', data.tvaDue],
    [],
    ['DÉTAIL DES OPÉRATIONS'],
    ['Libellé', 'Montant HT (€)', 'TVA (€)'],
    ...data.details.map(d => [d.libelle, d.montantHT, d.tva]),
  ];
  
  const sheet = XLSX.utils.aoa_to_sheet(declarationData);
  sheet['!cols'] = [
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'Déclaration TVA');
  
  return workbook;
}

export function downloadDeclarationTVA(data: any, filename?: string) {
  const workbook = generateDeclarationTVA(data);
  const name = filename || `declaration-tva-${data.period.start.toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, name);
}

