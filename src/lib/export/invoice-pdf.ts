/**
 * Génération de factures/devis en PDF professionnel
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  company: {
    name: string;
    address?: string;
    siret?: string;
    email?: string;
    phone?: string;
  };
  invoice: {
    number: string;
    type: 'INVOICE' | 'QUOTE';
    date: Date;
    dueDate?: Date;
  };
  client: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    total: number;
  }>;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string;
}

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [30, 58, 138];
  const accentColor: [number, number, number] = [59, 130, 246];
  
  // Header avec fond coloré
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const title = data.invoice.type === 'INVOICE' ? 'FACTURE' : 'DEVIS';
  doc.text(title, 15, 25);
  
  doc.setFontSize(14);
  doc.text(data.invoice.number, 15, 35);
  
  // Date à droite du header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${data.invoice.date.toLocaleDateString('fr-FR')}`, pageWidth - 15, 25, { align: 'right' });
  if (data.invoice.dueDate) {
    doc.text(`Échéance: ${data.invoice.dueDate.toLocaleDateString('fr-FR')}`, pageWidth - 15, 32, { align: 'right' });
  }
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPos = 60;
  
  // Informations émetteur et client côte à côte
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR', 15, yPos);
  doc.text('CLIENT', pageWidth / 2 + 5, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Émetteur (gauche)
  doc.setFont('helvetica', 'bold');
  doc.text(data.company.name, 15, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  
  if (data.company.address) {
    const addressLines = doc.splitTextToSize(data.company.address, 80);
    doc.text(addressLines, 15, yPos);
    yPos += addressLines.length * 5;
  }
  if (data.company.siret) {
    doc.text(`SIRET: ${data.company.siret}`, 15, yPos);
    yPos += 5;
  }
  if (data.company.email) {
    doc.text(data.company.email, 15, yPos);
    yPos += 5;
  }
  if (data.company.phone) {
    doc.text(data.company.phone, 15, yPos);
  }
  
  // Client (droite)
  yPos = 67;
  doc.setFont('helvetica', 'bold');
  doc.text(data.client.name, pageWidth / 2 + 5, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  
  if (data.client.address) {
    const clientAddressLines = doc.splitTextToSize(data.client.address, 80);
    doc.text(clientAddressLines, pageWidth / 2 + 5, yPos);
    yPos += clientAddressLines.length * 5;
  }
  if (data.client.email) {
    doc.text(data.client.email, pageWidth / 2 + 5, yPos);
    yPos += 5;
  }
  if (data.client.phone) {
    doc.text(data.client.phone, pageWidth / 2 + 5, yPos);
  }
  
  // Tableau des lignes
  yPos = 120;
  
  const tableData = data.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${(item.vatRate * 100).toFixed(0)}%`,
    `${item.total.toFixed(2)} €`,
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix Unit. HT', 'TVA', 'Total HT']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Totaux
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  const totalsX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT:', totalsX, yPos);
  doc.text(`${data.subtotal.toFixed(2)} €`, pageWidth - 15, yPos, { align: 'right' });
  
  yPos += 7;
  doc.text('TVA:', totalsX, yPos);
  doc.text(`${data.vatAmount.toFixed(2)} €`, pageWidth - 15, yPos, { align: 'right' });
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setFillColor(...accentColor);
  doc.rect(totalsX - 5, yPos - 6, 80, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TTC:', totalsX, yPos);
  doc.text(`${data.total.toFixed(2)} €`, pageWidth - 15, yPos, { align: 'right' });
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Notes
  if (data.notes) {
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 15, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 30);
    doc.text(notesLines, 15, yPos);
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  
  if (data.invoice.type === 'INVOICE') {
    doc.text(
      'Merci pour votre confiance. Paiement à réception de facture.',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  } else {
    doc.text(
      'Ce devis est valable 30 jours à compter de sa date d\'émission.',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }
  
  doc.text(
    `Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );
  
  return doc;
}

export function downloadInvoicePDF(data: InvoiceData, filename?: string) {
  const doc = generateInvoicePDF(data);
  const name = filename || `${data.invoice.type === 'INVOICE' ? 'facture' : 'devis'}-${data.invoice.number}.pdf`;
  doc.save(name);
}

export function getInvoicePDFBlob(data: InvoiceData): Blob {
  const doc = generateInvoicePDF(data);
  return doc.output('blob');
}

