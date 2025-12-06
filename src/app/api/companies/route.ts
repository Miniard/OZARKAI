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
    
    console.log('GET /api/companies - Session:', session?.user?.email, session?.user?.id);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Trouver l'utilisateur par email (plus fiable)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log('Utilisateur non trouvé:', session.user.email);
      return NextResponse.json([]);
    }

    const companies = await prisma.company.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Companies trouvées:', companies.length);
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Erreur récupération entreprises:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    console.log('POST /api/companies - Session:', session?.user?.email, session?.user?.id);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Trouver ou créer l'utilisateur par email (plus fiable que l'ID de session)
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Si l'utilisateur n'existe pas encore, le créer
    if (!user) {
      console.log('Utilisateur non trouvé, création:', session.user.email);
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null,
          role: 'USER',
          passwordHash: '',
        },
      });
    }

    const body = await request.json();
    const { name, siret, address, companyType, vatRegime } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom de l\'entreprise est requis' },
        { status: 400 }
      );
    }

    console.log('Création entreprise pour user:', user.id, 'nom:', name);

    const company = await prisma.company.create({
      data: {
        name,
        siret: siret || null,
        address: address || null,
        companyType: companyType || 'MICRO_ENTREPRISE',
        vatRegime: vatRegime || 'FRANCHISE_BASE',
        userId: user.id,
      },
    });

    console.log('Entreprise créée:', company.id);
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Erreur création entreprise:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

