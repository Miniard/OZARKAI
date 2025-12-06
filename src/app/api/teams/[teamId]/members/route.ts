/**
 * API Route : Gestion des membres d'une équipe
 * POST /api/teams/[teamId]/members - Inviter un membre
 * DELETE /api/teams/[teamId]/members - Retirer un membre
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: { teamId: string };
}

async function checkTeamAdmin(userId: string, teamId: string) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  return membership && ['OWNER', 'ADMIN'].includes(membership.role);
}

// Inviter un membre par email
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const isAdmin = await checkTeamAdmin(session.user.id, params.teamId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = 'MEMBER' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Vérifier si une invitation existe déjà
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: { teamId_email: { teamId: params.teamId, email } },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Une invitation a déjà été envoyée à cet email' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: params.teamId, userId: existingUser.id } },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'Cet utilisateur est déjà membre de l\'équipe' },
          { status: 400 }
        );
      }
    }

    // Créer ou mettre à jour l'invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    const invitation = await prisma.teamInvitation.upsert({
      where: { teamId_email: { teamId: params.teamId, email } },
      create: {
        teamId: params.teamId,
        email,
        role: role as any,
        invitedBy: session.user.id,
        expiresAt,
      },
      update: {
        role: role as any,
        status: 'PENDING',
        invitedBy: session.user.id,
        expiresAt,
        token: undefined, // Regenerate token
      },
    });

    // TODO: Envoyer un email d'invitation

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Erreur invitation membre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Retirer un membre
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberUserId = searchParams.get('userId');

    if (!memberUserId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Si l'utilisateur se retire lui-même
    if (memberUserId === session.user.id) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: params.teamId, userId: session.user.id } },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Vous n\'êtes pas membre' }, { status: 400 });
      }

      if (membership.role === 'OWNER') {
        return NextResponse.json(
          { error: 'Le propriétaire ne peut pas quitter. Transférez d\'abord la propriété.' },
          { status: 400 }
        );
      }

      await prisma.teamMember.delete({
        where: { teamId_userId: { teamId: params.teamId, userId: session.user.id } },
      });

      return NextResponse.json({ success: true });
    }

    // Sinon, vérifier que l'utilisateur actuel est admin
    const isAdmin = await checkTeamAdmin(session.user.id, params.teamId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Ne pas permettre de retirer le owner
    const targetMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: params.teamId, userId: memberUserId } },
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Impossible de retirer le propriétaire' },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId: params.teamId, userId: memberUserId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur retrait membre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


