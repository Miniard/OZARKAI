/**
 * API : Statut de connexion Outlook
 * Vérifie si l'utilisateur a connecté son Outlook
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        outlookConnected: true,
        outlookTokenExpiry: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ connected: false, email: session.user.email });
    }

    // Vérifier si le token est expiré
    const isExpired = user.outlookTokenExpiry && new Date(user.outlookTokenExpiry) < new Date();
    
    return NextResponse.json({
      connected: user.outlookConnected && !isExpired,
      email: user.email,
      needsRefresh: isExpired,
    });
  } catch (error) {
    console.error('Erreur Outlook status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Déconnecter Outlook
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        outlookConnected: false,
        outlookAccessToken: null,
        outlookRefreshToken: null,
        outlookTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur Outlook disconnect:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

