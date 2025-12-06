/**
 * Configuration NextAuth.js v5
 * Providers: Google, Microsoft + Email/Password (optionnel)
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/security/encryption';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image?: string | null;
      role: string;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    image?: string | null;
    role: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ============================================
    // GOOGLE (Principal - permet aussi Gmail plus tard)
    // ============================================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          // Scopes de base - Gmail sera demandé séparément
          scope: 'openid email profile',
        },
      },
    }),

    // ============================================
    // MICROSOFT (pour les entreprises Office 365)
    // ============================================
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      issuer: 'https://login.microsoftonline.com/common/v2.0',
      authorization: {
        params: {
          scope: 'openid email profile User.Read',
        },
      },
    }),

    // ============================================
    // EMAIL / PASSWORD (optionnel, pour ceux qui préfèrent)
    // ============================================
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Email ou mot de passe incorrect');
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error('Email ou mot de passe incorrect');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider !== 'credentials') {
          // OAuth : créer l'utilisateur s'il n'existe pas
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { companies: true },
          });

          if (!existingUser) {
            // Créer l'utilisateur ET son entreprise par défaut
            existingUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                role: 'USER',
                passwordHash: '',
                companies: {
                  create: {
                    name: user.name ? `Entreprise de ${user.name}` : 'Mon entreprise',
                    companyType: 'MICRO_ENTREPRISE',
                    vatRegime: 'FRANCHISE_BASE',
                  },
                },
              },
              include: { companies: true },
            });
            console.log('Nouvel utilisateur créé avec entreprise:', existingUser.email);
          } else if (existingUser.companies.length === 0) {
            // Utilisateur existe mais pas d'entreprise -> en créer une
            await prisma.company.create({
              data: {
                name: existingUser.name ? `Entreprise de ${existingUser.name}` : 'Mon entreprise',
                companyType: 'MICRO_ENTREPRISE',
                vatRegime: 'FRANCHISE_BASE',
                userId: existingUser.id,
              },
            });
            console.log('Entreprise créée pour utilisateur existant:', existingUser.email);
          }
        }
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        // Retourner true quand même pour permettre la connexion
        // L'utilisateur sera créé lors de la prochaine requête
        return true;
      }
    },

    async jwt({ token, user, account }) {
      try {
        if (user) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          
          token.id = dbUser?.id || user.id;
          token.role = dbUser?.role || 'USER';
          token.provider = account?.provider;
        }
        
        // Sauvegarder le refresh token pour Gmail plus tard
        if (account?.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
        if (account?.access_token) {
          token.accessToken = account.access_token;
        }
      } catch (error) {
        console.error('JWT callback error:', error);
        // Utiliser des valeurs par défaut
        if (user) {
          token.id = user.id;
          token.role = 'USER';
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  // Important pour Vercel
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
});

export const authOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
};
