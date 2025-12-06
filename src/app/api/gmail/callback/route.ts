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
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  // Redirect vers le dashboard avec le résultat
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/dashboard?gmail=error&message=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?gmail=error&message=missing_params`);
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
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(`${baseUrl}/dashboard?gmail=error&message=token_error`);
    }

    const tokens = await tokenResponse.json();

    // Stocker les tokens dans la base de données (state = email)
    const userEmail = decodeURIComponent(state);
    console.log('Gmail callback - Updating user:', userEmail);
    
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token || undefined, // Peut être absent si déjà autorisé
        gmailTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        gmailConnected: true,
      },
    });

    console.log('Gmail tokens saved successfully');
    return NextResponse.redirect(`${baseUrl}/dashboard?gmail=success`);
  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard?gmail=error&message=server_error`);
  }
}

