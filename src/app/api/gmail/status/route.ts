/**
 * API : Statut de connexion Gmail
 * Vérifie si l'utilisateur a connecté son Gmail
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        gmailConnected: true,
        gmailTokenExpiry: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier si le token est expiré
    const isExpired = user.gmailTokenExpiry && new Date(user.gmailTokenExpiry) < new Date();
    
    return NextResponse.json({
      connected: user.gmailConnected && !isExpired,
      email: user.email,
      needsRefresh: isExpired,
    });
  } catch (error) {
    console.error('Erreur Gmail status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Déconnecter Gmail
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        gmailConnected: false,
        gmailAccessToken: null,
        gmailRefreshToken: null,
        gmailTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur Gmail disconnect:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

