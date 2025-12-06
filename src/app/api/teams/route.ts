/**
 * API Route : Gestion des équipes
 * GET /api/teams - Liste des équipes de l'utilisateur
 * POST /api/teams - Créer une nouvelle équipe
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

    // Récupérer les équipes où l'utilisateur est membre
    const memberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                members: true,
                invitations: { where: { status: 'PENDING' } },
              },
            },
          },
        },
      },
    });

    const teams = memberships.map((m) => ({
      ...m.team,
      myRole: m.role,
      memberCount: m.team._count.members,
      pendingInvitations: m.team._count.invitations,
    }));

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Erreur récupération équipes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    // Générer un slug unique
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.team.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Créer l'équipe avec l'utilisateur comme owner
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Erreur création équipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


