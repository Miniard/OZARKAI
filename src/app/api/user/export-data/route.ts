/**
 * API Route : Export des données utilisateur (RGPD)
 * GET /api/user/export-data - Exporter toutes les données de l'utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer toutes les données de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        gmailConnected: true,
        outlookConnected: true,
        createdAt: true,
        updatedAt: true,
        companies: {
          select: {
            id: true,
            name: true,
            siret: true,
            address: true,
            companyType: true,
            vatRegime: true,
            createdAt: true,
            documents: {
              select: {
                id: true,
                filename: true,
                fileType: true,
                fileSize: true,
                docType: true,
                amount: true,
                vat: true,
                date: true,
                supplier: true,
                analyzed: true,
                createdAt: true,
              },
            },
            entries: {
              select: {
                id: true,
                date: true,
                description: true,
                category: true,
                debit: true,
                credit: true,
                createdAt: true,
              },
            },
            invoices: {
              select: {
                id: true,
                type: true,
                invoiceNumber: true,
                clientName: true,
                clientEmail: true,
                subtotal: true,
                vatAmount: true,
                total: true,
                status: true,
                issueDate: true,
                dueDate: true,
                createdAt: true,
                items: {
                  select: {
                    description: true,
                    quantity: true,
                    unitPrice: true,
                    vatRate: true,
                    total: true,
                  },
                },
              },
            },
          },
        },
        teamMemberships: {
          select: {
            role: true,
            joinedAt: true,
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Préparer les données pour l'export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: 'Komptal - Export RGPD',
      user: {
        ...user,
        // Supprimer les données sensibles
        passwordHash: undefined,
        gmailAccessToken: undefined,
        gmailRefreshToken: undefined,
        outlookAccessToken: undefined,
        outlookRefreshToken: undefined,
      },
    };

    // Retourner en JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="komptal-export-${session.user.email}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Erreur export données:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


