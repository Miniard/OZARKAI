/**
 * API : Statut de connexion Gmail
 * Vérifie si l'utilisateur a connecté son Gmail
 * Rafraîchit automatiquement le token si expiré
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Fonction pour rafraîchir le token Gmail
async function refreshGmailToken(userId: string, refreshToken: string): Promise<boolean> {
  try {
    console.log('🔄 Refreshing Gmail token for user:', userId);
    
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Token refresh failed:', error);
      return false;
    }

    const tokens = await response.json();
    console.log('✅ New token received, expires_in:', tokens.expires_in);

    // Mettre à jour le token en base
    await prisma.user.update({
      where: { id: userId },
      data: {
        gmailAccessToken: tokens.access_token,
        gmailTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        // Google ne renvoie pas toujours un nouveau refresh_token
        ...(tokens.refresh_token && { gmailRefreshToken: tokens.refresh_token }),
      },
    });

    return true;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return false;
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ connected: false, error: 'Non autorisé' });
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: session.user.email,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        gmailConnected: true,
        gmailTokenExpiry: true,
        gmailAccessToken: true,
        gmailRefreshToken: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ connected: false, email: session.user.email });
    }

    // Vérifier si le token existe
    const hasToken = !!user.gmailAccessToken;
    const hasRefreshToken = !!user.gmailRefreshToken;
    let isExpired = user.gmailTokenExpiry && new Date(user.gmailTokenExpiry) < new Date();
    
    // Si le token est expiré mais on a un refresh token, on rafraîchit
    if (user.gmailConnected && hasToken && isExpired && hasRefreshToken) {
      console.log('🔄 Token expired, attempting refresh...');
      const refreshed = await refreshGmailToken(user.id, user.gmailRefreshToken!);
      if (refreshed) {
        isExpired = false; // Token rafraîchi avec succès
        console.log('✅ Token refreshed successfully');
      } else {
        console.log('❌ Token refresh failed, user needs to reconnect');
      }
    }
    
    // Connecté si: gmailConnected est true ET on a un token ET il n'est pas expiré
    const isConnected = user.gmailConnected && hasToken && !isExpired;
    
    console.log('📧 Gmail status:', { email: user.email, isConnected, isExpired });
    
    return NextResponse.json({
      connected: isConnected,
      email: user.email,
      needsRefresh: isExpired && hasToken && !hasRefreshToken,
    });
  } catch (error) {
    console.error('❌ Gmail status error:', error);
    return NextResponse.json({ connected: false, error: 'Erreur serveur' });
  }
}

// Déconnecter Gmail
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Trouver l'utilisateur (insensible à la casse)
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
          gmailConnected: false,
          gmailAccessToken: null,
          gmailRefreshToken: null,
          gmailTokenExpiry: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur Gmail disconnect:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

