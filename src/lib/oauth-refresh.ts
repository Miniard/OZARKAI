/**
 * Utilitaires pour rafraîchir les tokens OAuth Gmail et Outlook
 */

import { prisma } from '@/lib/db/prisma';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  error?: string;
}

/**
 * Rafraîchir le token Gmail si expiré
 */
export async function refreshGmailToken(userEmail: string): Promise<RefreshResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        gmailAccessToken: true,
        gmailRefreshToken: true,
        gmailTokenExpiry: true,
      },
    });

    if (!user?.gmailRefreshToken) {
      return { success: false, error: 'Pas de refresh token Gmail' };
    }

    // Vérifier si le token est encore valide (avec 5min de marge)
    const expiryTime = user.gmailTokenExpiry ? new Date(user.gmailTokenExpiry).getTime() : 0;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiryTime > now + fiveMinutes && user.gmailAccessToken) {
      // Token encore valide
      return { success: true, accessToken: user.gmailAccessToken };
    }

    console.log('🔄 Refreshing Gmail token for:', userEmail);

    // Rafraîchir le token
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.gmailRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail refresh error:', errorText);
      
      // Si le refresh token est invalide, déconnecter l'utilisateur
      if (response.status === 400 || response.status === 401) {
        await prisma.user.update({
          where: { email: userEmail },
          data: {
            gmailConnected: false,
            gmailAccessToken: null,
            gmailRefreshToken: null,
            gmailTokenExpiry: null,
          },
        });
        return { success: false, error: 'Session Gmail expirée, reconnexion nécessaire' };
      }
      
      return { success: false, error: 'Erreur lors du refresh Gmail' };
    }

    const tokens = await response.json();

    // Mettre à jour les tokens en base
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        gmailAccessToken: tokens.access_token,
        gmailTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        // Garder le refresh token existant si pas fourni
        ...(tokens.refresh_token && { gmailRefreshToken: tokens.refresh_token }),
      },
    });

    console.log('✅ Gmail token refreshed successfully');
    return { success: true, accessToken: tokens.access_token };

  } catch (error) {
    console.error('Gmail refresh exception:', error);
    return { success: false, error: 'Erreur système lors du refresh' };
  }
}

/**
 * Rafraîchir le token Outlook si expiré
 */
export async function refreshOutlookToken(userEmail: string): Promise<RefreshResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        outlookAccessToken: true,
        outlookRefreshToken: true,
        outlookTokenExpiry: true,
      },
    });

    if (!user?.outlookRefreshToken) {
      return { success: false, error: 'Pas de refresh token Outlook' };
    }

    // Vérifier si le token est encore valide (avec 5min de marge)
    const expiryTime = user.outlookTokenExpiry ? new Date(user.outlookTokenExpiry).getTime() : 0;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiryTime > now + fiveMinutes && user.outlookAccessToken) {
      // Token encore valide
      return { success: true, accessToken: user.outlookAccessToken };
    }

    console.log('🔄 Refreshing Outlook token for:', userEmail);

    // Rafraîchir le token
    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: user.outlookRefreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadBasic offline_access',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Outlook refresh error:', errorText);
      
      // Si le refresh token est invalide, déconnecter l'utilisateur
      if (response.status === 400 || response.status === 401) {
        await prisma.user.update({
          where: { email: userEmail },
          data: {
            outlookConnected: false,
            outlookAccessToken: null,
            outlookRefreshToken: null,
            outlookTokenExpiry: null,
          },
        });
        return { success: false, error: 'Session Outlook expirée, reconnexion nécessaire' };
      }
      
      return { success: false, error: 'Erreur lors du refresh Outlook' };
    }

    const tokens = await response.json();

    // Mettre à jour les tokens en base
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        outlookAccessToken: tokens.access_token,
        outlookTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        ...(tokens.refresh_token && { outlookRefreshToken: tokens.refresh_token }),
      },
    });

    console.log('✅ Outlook token refreshed successfully');
    return { success: true, accessToken: tokens.access_token };

  } catch (error) {
    console.error('Outlook refresh exception:', error);
    return { success: false, error: 'Erreur système lors du refresh' };
  }
}

/**
 * Obtenir un token Gmail valide (refresh si nécessaire)
 */
export async function getValidGmailToken(userEmail: string): Promise<RefreshResult> {
  return refreshGmailToken(userEmail);
}

/**
 * Obtenir un token Outlook valide (refresh si nécessaire)
 */
export async function getValidOutlookToken(userEmail: string): Promise<RefreshResult> {
  return refreshOutlookToken(userEmail);
}

