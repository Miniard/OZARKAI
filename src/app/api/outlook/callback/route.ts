/**
 * API : Callback OAuth Outlook
 * Échange le code contre des tokens et les stocke
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  // Gérer les erreurs
  if (error) {
    console.error('Outlook OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=outlook_auth_failed`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=missing_params`
    );
  }

  try {
    // Échanger le code contre des tokens
    const tokenResponse = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/outlook/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Stocker les tokens en base
    await prisma.user.update({
      where: { id: state },
      data: {
        outlookConnected: true,
        outlookAccessToken: tokens.access_token,
        outlookRefreshToken: tokens.refresh_token,
        outlookTokenExpiry: expiresAt,
      },
    });

    console.log('✅ Outlook connecté pour user:', state);

    // Rediriger vers le dashboard avec succès
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?outlook=connected`
    );
  } catch (error) {
    console.error('Outlook callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=outlook_callback_failed`
    );
  }
}


