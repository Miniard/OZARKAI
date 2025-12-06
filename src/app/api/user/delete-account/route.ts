/**
 * API Route : Suppression de compte
 * DELETE /api/user/delete-account
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== 'SUPPRIMER MON COMPTE') {
      return NextResponse.json(
        { error: 'Confirmation incorrecte' },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur (cascade supprime companies, documents, etc.)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true, message: 'Compte supprimé' });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


