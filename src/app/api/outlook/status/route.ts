/**
 * API : Statut de connexion Outlook
 * Vérifie si l'utilisateur a connecté son Outlook
 * Rafraîchit automatiquement le token si expiré
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

// Fonction pour rafraîchir le token Outlook
async function refreshOutlookToken(userId: string, refreshToken: string): Promise<boolean> {
  try {
    console.log('🔄 Refreshing Outlook token for user:', userId);
    
    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadBasic offline_access',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Outlook token refresh failed:', error);
      return false;
    }

    const tokens = await response.json();
    console.log('✅ New Outlook token received, expires_in:', tokens.expires_in);

    await prisma.user.update({
      where: { id: userId },
      data: {
        outlookAccessToken: tokens.access_token,
        outlookTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        ...(tokens.refresh_token && { outlookRefreshToken: tokens.refresh_token }),
      },
    });

    return true;
  } catch (error) {
    console.error('❌ Outlook token refresh error:', error);
    return false;
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ connected: false, error: 'Non autorisé' });
    }

    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: session.user.email,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        outlookConnected: true,
        outlookTokenExpiry: true,
        outlookAccessToken: true,
        outlookRefreshToken: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ connected: false, email: session.user.email });
    }

    const hasToken = !!user.outlookAccessToken;
    const hasRefreshToken = !!user.outlookRefreshToken;
    let isExpired = user.outlookTokenExpiry && new Date(user.outlookTokenExpiry) < new Date();
    
    // Si le token est expiré mais on a un refresh token, on rafraîchit
    if (user.outlookConnected && hasToken && isExpired && hasRefreshToken) {
      console.log('🔄 Outlook token expired, attempting refresh...');
      const refreshed = await refreshOutlookToken(user.id, user.outlookRefreshToken!);
      if (refreshed) {
        isExpired = false;
        console.log('✅ Outlook token refreshed successfully');
      }
    }
    
    const isConnected = user.outlookConnected && hasToken && !isExpired;
    
    return NextResponse.json({
      connected: isConnected,
      email: user.email,
      needsRefresh: isExpired && hasToken && !hasRefreshToken,
    });
  } catch (error) {
    console.error('❌ Outlook status error:', error);
    return NextResponse.json({ connected: false, error: 'Erreur serveur' });
  }
}

// Déconnecter Outlook
export async function DELETE() {
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
      select: { id: true },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          outlookConnected: false,
          outlookAccessToken: null,
          outlookRefreshToken: null,
          outlookTokenExpiry: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur Outlook disconnect:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




