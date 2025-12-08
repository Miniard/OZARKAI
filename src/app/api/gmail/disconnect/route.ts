/**
 * API : Déconnecter Gmail
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
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




