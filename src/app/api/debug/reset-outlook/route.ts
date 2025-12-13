/**
 * Debug endpoint pour reset Outlook
 * À SUPPRIMER EN PRODUCTION
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET aussi pour faciliter le reset via navigateur
export async function GET() {
  return POST();
}

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: session.user.email,
          mode: 'insensitive'
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset Outlook
    await prisma.user.update({
      where: { id: user.id },
      data: {
        outlookConnected: false,
        outlookAccessToken: null,
        outlookRefreshToken: null,
        outlookTokenExpiry: null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Outlook disconnected for ' + user.email 
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
