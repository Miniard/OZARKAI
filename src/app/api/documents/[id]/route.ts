/**
 * API Documents - Opérations sur un document spécifique
 * GET /api/documents/[id] - Récupérer un document
 * PATCH /api/documents/[id] - Mettre à jour un document
 * DELETE /api/documents/[id] - Supprimer un document
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET - Récupérer un document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { company: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Vérifier l'accès
    if (document.company.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Erreur GET document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour un document
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { company: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Vérifier l'accès
    if (document.company.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const {
      docType,
      supplier,
      supplierVatNumber,
      invoiceNumber,
      date,
      amount,
      vat,
      currency,
      paymentMethod,
      category,
      notes,
      lineItems,
    } = body;

    // Mettre à jour le document
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        docType: docType || document.docType,
        supplier: supplier || document.supplier,
        amount: amount !== undefined ? amount : document.amount,
        vat: vat !== undefined ? vat : document.vat,
        date: date ? new Date(date) : document.date,
        analyzed: true, // Marquer comme "traité" même si manuellement
        analysisData: {
          ...(document.analysisData as object || {}),
          supplierVatNumber,
          invoiceNumber,
          currency,
          paymentMethod,
          category,
          notes,
          lineItems: lineItems || [],
          updatedAt: new Date().toISOString(),
          updatedManually: true,
        },
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Erreur PATCH document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { company: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Vérifier l'accès
    if (document.company.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Document supprimé' });
  } catch (error) {
    console.error('Erreur DELETE document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}



