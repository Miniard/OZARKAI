/**
 * API Route : Gestion du profil utilisateur
 * GET /api/user/profile - Récupérer le profil
 * PUT /api/user/profile - Mettre à jour le profil
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        gmailConnected: true,
        createdAt: true,
        _count: {
          select: {
            companies: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


