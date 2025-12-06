/**
 * API pour gérer les factures/devis
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur a accès à cette entreprise
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer toutes les factures/devis
    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des factures' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    const { companyId, type, clientName, clientEmail, clientAddress, items, notes } = data;

    // Vérifier que l'utilisateur a accès à cette entreprise
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Générer numéro de facture/devis
    const lastInvoice = await prisma.invoice.findFirst({
      where: { companyId, type },
      orderBy: { number: 'desc' },
    });

    const nextNumber = (lastInvoice?.number || 0) + 1;
    const prefix = type === 'INVOICE' ? 'FAC' : 'DEV';
    const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;

    // Calculer totaux
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const vatAmount = subtotal * (items[0]?.vatRate || 0.2);
    const total = subtotal + vatAmount;

    // Créer la facture/devis
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        type,
        number: nextNumber,
        invoiceNumber,
        clientName,
        clientEmail,
        clientAddress,
        subtotal,
        vatAmount,
        total,
        notes,
        status: 'DRAFT',
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate || 0.2,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la facture' },
      { status: 500 }
    );
  }
}

