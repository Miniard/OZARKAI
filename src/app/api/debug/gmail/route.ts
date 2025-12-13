/**
 * Debug endpoint pour vérifier l'état Gmail
 * À SUPPRIMER EN PRODUCTION
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    // Récupérer tous les utilisateurs pour debug
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        gmailConnected: true,
        gmailAccessToken: true,
        gmailTokenExpiry: true,
        createdAt: true,
      },
      take: 10,
    });
    
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await prisma.user.findFirst({
        where: { 
          email: {
            equals: session.user.email,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          email: true,
          gmailConnected: true,
          gmailAccessToken: true,
          gmailRefreshToken: true,
          gmailTokenExpiry: true,
          outlookConnected: true,
          outlookAccessToken: true,
          outlookRefreshToken: true,
          outlookTokenExpiry: true,
        },
      });
    }
    
    return NextResponse.json({
      session: session ? {
        email: session.user?.email,
        id: session.user?.id,
        name: session.user?.name,
      } : null,
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        gmail: {
          connected: currentUser.gmailConnected,
          hasAccessToken: !!currentUser.gmailAccessToken,
          hasRefreshToken: !!currentUser.gmailRefreshToken,
          tokenExpiry: currentUser.gmailTokenExpiry,
          tokenExpired: currentUser.gmailTokenExpiry ? new Date(currentUser.gmailTokenExpiry) < new Date() : null,
        },
        outlook: {
          connected: currentUser.outlookConnected,
          hasAccessToken: !!currentUser.outlookAccessToken,
          hasRefreshToken: !!currentUser.outlookRefreshToken,
          tokenExpiry: currentUser.outlookTokenExpiry,
          tokenExpired: currentUser.outlookTokenExpiry ? new Date(currentUser.outlookTokenExpiry) < new Date() : null,
        },
      } : null,
      allUsersCount: allUsers.length,
      allUsers: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        gmailConnected: u.gmailConnected,
        hasToken: !!u.gmailAccessToken,
      })),
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

