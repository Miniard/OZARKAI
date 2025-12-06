/**
 * API Route : Accepter une invitation à rejoindre une équipe
 * POST /api/teams/invitations/accept
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 });
    }

    // Trouver l'invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation non trouvée' }, { status: 404 });
    }

    // Vérifier que l'email correspond
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Cette invitation n\'est pas pour vous' },
        { status: 403 }
      );
    }

    // Vérifier le statut
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cette invitation a déjà été ${invitation.status === 'ACCEPTED' ? 'acceptée' : 'déclinée'}` },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    if (new Date() > invitation.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Cette invitation a expiré' }, { status: 400 });
    }

    // Ajouter l'utilisateur comme membre
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: session.user.id,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      team: invitation.team,
    });
  } catch (error) {
    console.error('Erreur acceptation invitation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


