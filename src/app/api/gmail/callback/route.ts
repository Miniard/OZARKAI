/**
 * API : Callback Gmail OAuth
 * Reçoit le code d'autorisation et échange contre des tokens
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // email de l'utilisateur
  const error = searchParams.get('error');

  // Redirect vers le dashboard avec le résultat
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  console.log('🔵 Gmail callback received - state:', state, 'has code:', !!code);

  if (error) {
    console.error('❌ Gmail OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&gmail=error&message=${error}`);
  }

  if (!code || !state) {
    console.error('❌ Gmail callback - Missing params');
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&gmail=error&message=missing_params`);
  }

  try {
    // Échanger le code contre des tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/gmail/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Token exchange error:', errorData);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&gmail=error&message=token_error`);
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Gmail tokens received - expires_in:', tokens.expires_in, 'has refresh:', !!tokens.refresh_token);

    // Stocker les tokens dans la base de données (state = email)
    const userEmail = decodeURIComponent(state);
    console.log('📧 Gmail callback - Looking for user:', userEmail);
    
    // Chercher l'utilisateur avec comparaison insensible à la casse
    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: userEmail,
          mode: 'insensitive'
        }
      },
    });

    if (!user) {
      console.error('❌ User not found:', userEmail);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&gmail=error&message=user_not_found`);
    }

    console.log('✅ User found:', user.id, user.email);

    // Mettre à jour avec l'ID pour être sûr
    await prisma.user.update({
      where: { id: user.id },
      data: {
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token || user.gmailRefreshToken, // Garder l'ancien refresh token si pas de nouveau
        gmailTokenExpiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        gmailConnected: true,
      },
    });

    console.log('✅ Gmail tokens saved successfully for user:', user.email);
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&gmail=success`);
  } catch (error) {
    console.error('❌ Gmail callback error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&gmail=error&message=server_error`);
  }
}

