/**
 * API Route : Gestion d'une équipe spécifique
 * GET /api/teams/[teamId] - Détails de l'équipe
 * PUT /api/teams/[teamId] - Modifier l'équipe
 * DELETE /api/teams/[teamId] - Supprimer l'équipe
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: { teamId: string };
}

async function checkTeamAccess(userId: string, teamId: string, requiredRoles?: string[]) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!membership) return null;
  if (requiredRoles && !requiredRoles.includes(membership.role)) return null;
  
  return membership;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const membership = await checkTeamAccess(session.user.id, params.teamId);
    if (!membership) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
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
          orderBy: { joinedAt: 'asc' },
        },
        invitations: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ ...team, myRole: membership.role });
  } catch (error) {
    console.error('Erreur récupération équipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const membership = await checkTeamAccess(session.user.id, params.teamId, ['OWNER', 'ADMIN']);
    if (!membership) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    const team = await prisma.team.update({
      where: { id: params.teamId },
      data: {
        name: name?.trim() || undefined,
        description: description?.trim() || undefined,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Erreur modification équipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const membership = await checkTeamAccess(session.user.id, params.teamId, ['OWNER']);
    if (!membership) {
      return NextResponse.json({ error: 'Seul le propriétaire peut supprimer l\'équipe' }, { status: 403 });
    }

    await prisma.team.delete({
      where: { id: params.teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression équipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


