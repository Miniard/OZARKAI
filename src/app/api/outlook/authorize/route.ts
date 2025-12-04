/**
 * API : Autorisation Outlook (Microsoft Graph)
 * 
 * Flow :
 * 1. User clique "Connecter Outlook"
 * 2. Redirect vers Microsoft avec scopes Mail
 * 3. User autorise
 * 4. Callback avec tokens
 * 5. On stocke les tokens pour accéder aux emails
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

// Scopes pour lire les emails
const OUTLOOK_SCOPES = [
  'offline_access',
  'Mail.Read',
  'Mail.ReadBasic',
].join(' ');

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/outlook/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Microsoft non configuré' }, { status: 500 });
  }

  // Construire l'URL d'autorisation Microsoft
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OUTLOOK_SCOPES,
    response_mode: 'query',
    state: session.user.id, // Pour retrouver l'utilisateur au callback
    login_hint: session.user.email || '', // Pré-remplir l'email
  });

  const authUrl = `${MICROSOFT_AUTH_URL}?${params.toString()}`;

  return NextResponse.json({ authUrl });
}


