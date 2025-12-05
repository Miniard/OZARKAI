/**
 * API : Statut et configuration WhatsApp
 * GET - Vérifier si WhatsApp est connecté
 * POST - Enregistrer le numéro de téléphone
 * DELETE - Déconnecter WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET - Statut de connexion
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        whatsappConnected: true,
        whatsappPhoneNumber: true,
      },
    });

    return NextResponse.json({
      connected: user?.whatsappConnected || false,
      phoneNumber: user?.whatsappPhoneNumber || null,
    });
  } catch (error) {
    console.error('Erreur status WhatsApp:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Enregistrer le numéro
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Numéro requis' }, { status: 400 });
    }

    // Vérifier que le numéro n'est pas déjà utilisé
    const existing = await prisma.user.findFirst({
      where: {
        whatsappPhoneNumber: phoneNumber,
        id: { not: session.user.id },
      },
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'Ce numéro est déjà utilisé par un autre compte' 
      }, { status: 400 });
    }

    // Enregistrer le numéro
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        whatsappConnected: true,
        whatsappPhoneNumber: phoneNumber,
      },
    });

    return NextResponse.json({
      success: true,
      phoneNumber,
    });
  } catch (error) {
    console.error('Erreur enregistrement WhatsApp:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Déconnecter
export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        whatsappConnected: false,
        whatsappPhoneNumber: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur déconnexion WhatsApp:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

