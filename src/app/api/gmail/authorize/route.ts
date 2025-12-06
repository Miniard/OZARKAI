/**
 * API : Autorisation Gmail (scopes supplémentaires)
 * 
 * Flow :
 * 1. User clique "Connecter Gmail"
 * 2. Redirect vers Google avec scopes Gmail
 * 3. User autorise
 * 4. Callback avec tokens
 * 5. On stocke les tokens pour accéder à Gmail
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// Scopes pour lire les emails (factures)
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
].join(' ');

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/gmail/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Google non configuré' }, { status: 500 });
  }

  // Construire l'URL d'autorisation Google
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: session.user.id, // Pour retrouver l'utilisateur au callback
    login_hint: session.user.email, // Pré-remplir l'email
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  return NextResponse.json({ authUrl });
}

