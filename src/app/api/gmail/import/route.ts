/**
 * API : Importer une facture depuis Gmail
 * POST - Importe les pièces jointes d'un email
 * 
 * ANALYSE IA AUTOMATIQUE après import !
 * + REFRESH TOKEN AUTOMATIQUE
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { analyzeDocument } from '@/lib/analyze';
import { getValidGmailToken } from '@/lib/oauth-refresh';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { emailId, companyId } = await request.json();

    if (!emailId || !companyId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Obtenir un token valide (refresh automatique si nécessaire)
    const tokenResult = await getValidGmailToken(session.user.email);
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      return NextResponse.json({ 
        error: tokenResult.error || 'Gmail non connecté',
        needsReconnect: true 
      }, { status: 401 });
    }
    
    const accessToken = tokenResult.accessToken;

    // Vérifier que l'entreprise appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer les détails de l'email avec les pièces jointes
    const messageResponse = await fetch(
      `${GMAIL_API_URL}/users/me/messages/${emailId}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!messageResponse.ok) {
      return NextResponse.json({ error: 'Erreur Gmail API' }, { status: 500 });
    }

    const message = await messageResponse.json();
    const importedDocuments: string[] = [];

    // Trouver les pièces jointes
    const parts = message.payload?.parts || [];
    
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        // Télécharger la pièce jointe
        const attachmentResponse = await fetch(
          `${GMAIL_API_URL}/users/me/messages/${emailId}/attachments/${part.body.attachmentId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!attachmentResponse.ok) continue;

        const attachmentData = await attachmentResponse.json();
        
        // Décoder le contenu base64
        const content = Buffer.from(
          attachmentData.data.replace(/-/g, '+').replace(/_/g, '/'),
          'base64'
        );

        // Créer le dossier uploads
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        try {
          await mkdir(uploadsDir, { recursive: true });
        } catch {}

        // Sauvegarder le fichier
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const sanitizedFilename = part.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${randomStr}-${sanitizedFilename}`;
        const filepath = join(uploadsDir, filename);
        
        await writeFile(filepath, content);

        // Créer l'entrée en base
        const document = await prisma.document.create({
          data: {
            filename: part.filename,
            fileUrl: `/uploads/${filename}`,
            fileType: part.mimeType || 'application/octet-stream',
            fileSize: content.length,
            companyId,
            analyzed: false,
            source: 'GMAIL',
          },
        });

        importedDocuments.push(document.id);
        
        // 🔥 ANALYSE IA AUTOMATIQUE
        try {
          console.log('🔍 Analyse Gmail auto:', document.id);
          await analyzeDocument(document.id);
        } catch (e) {
          console.error('⚠️ Erreur analyse Gmail:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: importedDocuments.length,
      documentIds: importedDocuments,
      analyzed: true,
    });
  } catch (error) {
    console.error('Erreur import Gmail:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




