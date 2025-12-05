/**
 * Utilitaires pour générer des PDF comptables professionnels
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function generateBilanPDF(data: BilanData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BILAN COMPTABLE', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.company.name, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Exercice ${data.year}`, pageWidth / 2, 34, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(15, 40, pageWidth - 15, 40);
  
  // Company info
  let yPos = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS ENTREPRISE', 15, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Type d'entreprise : ${data.company.type}`, 15, yPos);
  yPos += 5;
  doc.text(`Régime TVA : ${data.company.vatRegime}`, 15, yPos);
  yPos += 5;
  doc.text(`Nombre de documents : ${data.documents.length}`, 15, yPos);
  
  // Financial summary
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('RÉSUMÉ FINANCIER', 15, yPos);
  
  yPos += 7;
  autoTable(doc, {
    startY: yPos,
    head: [['Libellé', 'Montant']],
    body: [
      ['💰 Revenus Total', `${data.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`],
      ['💸 Dépenses Total', `${data.expenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`],
      ['💵 Solde', `${data.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`],
      ['🏛️ TVA', `${data.vat.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10 },
  });
  
  // Category breakdown
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.text('RÉPARTITION PAR CATÉGORIE', 15, yPos);
  
  yPos += 7;
  const categoryRows = data.categoryBreakdown.map(cat => [
    cat.category,
    `${cat.count} opération(s)`,
    cat.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Catégorie', 'Opérations', 'Total']],
    body: categoryRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });
  
  // Documents list (new page)
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND LIVRE - DÉTAIL DES ÉCRITURES', 15, yPos);
  
  yPos += 10;
  const documentRows = data.documents.map(doc => [
    new Date(doc.date).toLocaleDateString('fr-FR'),
    doc.type,
    doc.supplier || '-',
    doc.category,
    doc.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Type', 'Fournisseur', 'Catégorie', 'Montant']],
    body: documentRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 50 },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Footer on each page
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Document généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

export function downloadBilanPDF(data: BilanData, filename?: string) {
  const doc = generateBilanPDF(data);
  const name = filename || `bilan-${data.company.name}-${data.year}.pdf`;
  doc.save(name);
}

export function generateInsightsPDF(insights: any[], companyName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT D\'ANALYSE COMPTABLE', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 34, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(15, 40, pageWidth - 15, 40);
  
  let yPos = 50;
  
  // Group insights by type
  const suspects = insights.filter(i => i.type === 'suspect' || i.severity === 'critical');
  const warnings = insights.filter(i => i.type === 'warning' && i.severity !== 'critical');
  const success = insights.filter(i => i.type === 'success');
  const tips = insights.filter(i => i.type === 'tip');
  
  // Suspects
  if (suspects.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`ANOMALIES CRITIQUES (${suspects.length})`, 15, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
    
    suspects.forEach(insight => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      // Enlever les emojis du titre
      const cleanTitle = insight.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      doc.text(cleanTitle, 15, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const messageLines = doc.splitTextToSize(insight.message, pageWidth - 30);
      doc.text(messageLines, 15, yPos);
      yPos += messageLines.length * 5;
      
      if (insight.suggestion) {
        doc.setFont('helvetica', 'italic');
        // Enlever les emojis de la suggestion
        const cleanSuggestion = `Recommandation: ${insight.suggestion.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}`;
        const suggestionLines = doc.splitTextToSize(cleanSuggestion, pageWidth - 30);
        doc.text(suggestionLines, 15, yPos);
        yPos += suggestionLines.length * 5;
      }
      
      yPos += 8;
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
  }
  
  // Warnings
  if (warnings.length > 0) {
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(`POINTS D'ATTENTION (${warnings.length})`, 15, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
    
    warnings.slice(0, 5).forEach(insight => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      // Enlever les emojis
      const cleanTitle = insight.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      doc.text(cleanTitle, 15, yPos);
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const messageLines = doc.splitTextToSize(insight.message, pageWidth - 30);
      doc.text(messageLines, 15, yPos);
      yPos += messageLines.length * 4.5 + 6;
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
  }
  
  // Success
  if (success.length > 0) {
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(`VALIDATIONS (${success.length})`, 15, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
    
    success.forEach(insight => {
      doc.setFontSize(10);
      // Enlever les emojis
      const cleanTitle = insight.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      doc.text(`- ${cleanTitle}`, 15, yPos);
      yPos += 6;
    });
  }
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Komptal - Rapport d'analyse - Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

export function downloadInsightsPDF(insights: any[], companyName: string, filename?: string) {
  const doc = generateInsightsPDF(insights, companyName);
  const name = filename || `analyse-comptable-${companyName}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(name);
}

