/**
 * API Route : Upload Document
 * POST /api/upload-local - Upload avec stockage base64 (compatible Vercel)
 * 
 * Sur Vercel, les fichiers sont stockés en base64 dans la base de données
 * En local, les fichiers sont écrits sur le filesystem pour les performances
 * 
 * ✨ L'analyse IA est lancée automatiquement en arrière-plan après l'upload
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { rateLimitMiddleware } from '@/lib/security/ratelimit';
import { getClientIp } from '@/lib/utils';
import { analyzeDocument } from '@/lib/analyze';

// Limite de taille pour le stockage base64 (5 MB)
const MAX_BASE64_SIZE = 5 * 1024 * 1024;

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

    // Vérifier la taille du fichier
    if (file.size > MAX_BASE64_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 5 MB)' },
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

    // Convertir le fichier en base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('📤 [UPLOAD] Fichier reçu:', file.name, '- Taille:', file.size, 'bytes');

    // Essayer d'écrire sur le filesystem (fonctionne en local)
    let fileUrl = dataUrl; // Par défaut, utiliser le data URL
    
    const isVercel = process.env.VERCEL === '1';
    
    if (!isVercel) {
      try {
        const { writeFile, mkdir } = await import('fs/promises');
        const { join } = await import('path');
        
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });
        
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${randomString}-${sanitizedFilename}`;
        const filepath = join(uploadsDir, filename);
        
        await writeFile(filepath, buffer);
        fileUrl = `/uploads/${filename}`;
        
        console.log('📁 [UPLOAD] Fichier écrit sur filesystem:', fileUrl);
      } catch (fsError) {
        console.warn('⚠️ [UPLOAD] Impossible d\'écrire sur le filesystem, utilisation du data URL');
        // On garde le dataUrl
      }
    } else {
      console.log('☁️ [UPLOAD] Mode Vercel - stockage en base64');
    }

    // Créer l'entrée en base
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        fileUrl: fileUrl,
        fileType: file.type,
        fileSize: file.size,
        companyId,
        analyzed: false,
        source: 'MANUAL',
      },
    });

    console.log('✅ [UPLOAD] Document créé:', document.id);

    // 🚀 Lancer l'analyse IA en arrière-plan (fire and forget)
    // Le client n'attend pas - l'analyse se fait automatiquement
    analyzeDocument(document.id)
      .then((result) => {
        if (result.success) {
          console.log('✅ [AUTO-ANALYZE] Analyse terminée pour:', document.id);
        } else {
          console.warn('⚠️ [AUTO-ANALYZE] Échec analyse:', document.id, result.error);
        }
      })
      .catch((err) => {
        console.error('❌ [AUTO-ANALYZE] Erreur:', document.id, err);
      });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileUrl: fileUrl.startsWith('data:') ? '[base64]' : fileUrl,
      analyzing: true, // Indique au frontend que l'analyse est en cours
    });
  } catch (error) {
    console.error('❌ [UPLOAD] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}

