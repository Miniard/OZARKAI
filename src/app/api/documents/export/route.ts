/**
 * API Route : Export des documents
 * GET /api/documents/export - Exporter les documents en CSV ou JSON
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const format = searchParams.get('format') || 'json'; // json ou csv
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requis' }, { status: 400 });
    }

    // Vérifier l'accès
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: session.user.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Construire le filtre de dates
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Récupérer les documents
    const documents = await prisma.document.findMany({
      where: {
        companyId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        filename: true,
        docType: true,
        amount: true,
        vat: true,
        date: true,
        supplier: true,
        analyzed: true,
        createdAt: true,
      },
    });

    // Format JSON
    if (format === 'json') {
      return new NextResponse(JSON.stringify(documents, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="documents-${company.name}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Format CSV
    const csvHeaders = ['Date', 'Fournisseur', 'Type', 'Montant HT', 'TVA', 'Montant TTC', 'Fichier', 'Analysé'];
    const csvRows = documents.map((doc) => [
      doc.date ? new Date(doc.date).toLocaleDateString('fr-FR') : '',
      doc.supplier || '',
      doc.docType || '',
      doc.amount?.toFixed(2) || '0',
      doc.vat?.toFixed(2) || '0',
      ((doc.amount || 0) + (doc.vat || 0)).toFixed(2),
      doc.filename,
      doc.analyzed ? 'Oui' : 'Non',
    ]);

    const csv = [
      csvHeaders.join(';'),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ].join('\n');

    // Ajouter BOM pour Excel
    const bom = '\uFEFF';

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="documents-${company.name}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Erreur export documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


