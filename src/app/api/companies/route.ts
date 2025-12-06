/**
 * API Route : Gestion des entreprises
 * GET /api/companies - Liste des entreprises de l'utilisateur
 * POST /api/companies - Créer une nouvelle entreprise
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const companies = await prisma.company.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, siret, address, companyType, vatRegime } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom de l\'entreprise est requis' },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
        siret: siret || null,
        address: address || null,
        companyType: companyType || 'MICRO_ENTREPRISE',
        vatRegime: vatRegime || 'FRANCHISE_BASE',
        userId: session.user.id,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'entreprise:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

