/**
 * Middleware Next.js - TEMPORAIREMENT DÉSACTIVÉ
 * Pour tester sans middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Laisser passer toutes les requêtes pour l'instant
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/cabinet/:path*',
  ],
};

