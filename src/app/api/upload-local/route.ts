/**
 * API Route : Upload LOCAL (sans S3)
 * POST /api/upload-local - Upload direct sur le serveur
 * 
 * ANALYSE IA AUTOMATIQUE après upload !
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { rateLimitMiddleware } from '@/lib/security/ratelimit';
import { getClientIp } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = rateLimitMiddleware(clientIp);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentification
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Parser le form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID entreprise manquant' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que l'entreprise appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise introuvable ou accès refusé' },
        { status: 404 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Le dossier existe déjà
    }

    // Générer un nom unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${randomString}-${sanitizedFilename}`;
    const filepath = join(uploadsDir, filename);

    // Écrire le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Créer l'entrée en base
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        fileUrl: `/uploads/${filename}`, // URL relative
        fileType: file.type,
        fileSize: file.size,
        companyId,
        analyzed: false,
        source: 'MANUAL',
      },
    });

    // Note: L'analyse IA sera déclenchée par le client via /api/analyze
    // pour éviter un timeout sur les gros fichiers

    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileUrl: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error('Erreur upload local:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}

