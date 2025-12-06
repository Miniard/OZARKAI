/**
 * API Route : Upload de document
 * POST /api/upload - Génère une URL présignée pour upload sécurisé
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePresignedUploadUrl, validateUploadMetadata } from '@/lib/upload/s3';
import { prisma } from '@/lib/db/prisma';
import { rateLimitMiddleware } from '@/lib/security/ratelimit';
import { getClientIp } from '@/lib/utils';
import type { UploadRequest, UploadResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResponse = rateLimitMiddleware(clientIp);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentification
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Parse la requête
    const body = (await request.json()) as UploadRequest;
    const { filename, fileType, fileSize, companyId } = body;

    // Validation des données
    const validation = validateUploadMetadata(filename, fileType, fileSize);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Vérifier que l'entreprise appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise introuvable ou accès refusé' },
        { status: 404 }
      );
    }

    // Générer l'URL présignée
    const { uploadUrl, key } = await generatePresignedUploadUrl(
      filename,
      fileType,
      fileSize,
      session.user.id
    );

    // Créer l'entrée de document en base
    const document = await prisma.document.create({
      data: {
        filename,
        fileUrl: key,
        fileType,
        fileSize,
        companyId,
        analyzed: false,
      },
    });

    const response: UploadResponse = {
      uploadUrl,
      documentId: document.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'URL d\'upload' },
      { status: 500 }
    );
  }
}

