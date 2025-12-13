/**
 * API : Callback OAuth Outlook
 * Échange le code contre des tokens et les stocke
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // email de l'utilisateur
  const error = searchParams.get('error');
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  console.log('🔵 Outlook callback received - state:', state, 'has code:', !!code);

  // Gérer les erreurs
  if (error) {
    console.error('❌ Outlook OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&outlook=error&message=${error}`);
  }

  if (!code || !state) {
    console.error('❌ Outlook callback - Missing params');
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&outlook=error&message=missing_params`);
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
        redirect_uri: `${baseUrl}/api/outlook/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Token exchange error:', errorData);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&outlook=error&message=token_error`);
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Outlook tokens received - expires_in:', tokens.expires_in, 'has refresh:', !!tokens.refresh_token);

    // Stocker les tokens en base (state = email)
    const userEmail = decodeURIComponent(state);
    console.log('📧 Outlook callback - Looking for user:', userEmail);
    
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
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&outlook=error&message=user_not_found`);
    }

    console.log('✅ User found:', user.id, user.email);

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // LOG IMPORTANT - Pour tracer quand Outlook est connecté
    console.log('🔴🔴🔴 OUTLOOK CALLBACK - CONNECTING OUTLOOK FOR USER:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      hasRefreshToken: !!tokens.refresh_token,
      expiresAt: expiresAt.toISOString(),
    });

    // Mettre à jour avec l'ID pour être sûr
    await prisma.user.update({
      where: { id: user.id },
      data: {
        outlookConnected: true,
        outlookAccessToken: tokens.access_token,
        outlookRefreshToken: tokens.refresh_token || user.outlookRefreshToken,
        outlookTokenExpiry: expiresAt,
      },
    });

    console.log('✅ Outlook tokens saved successfully for user:', user.email);
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&outlook=success`);
  } catch (error) {
    console.error('❌ Outlook callback error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard?tab=connectors&outlook=error&message=server_error`);
  }
}


