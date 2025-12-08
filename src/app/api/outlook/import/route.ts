/**
 * API : Importer une facture depuis Outlook
 * POST - Importe les pièces jointes d'un email
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

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

    // Récupérer l'utilisateur et ses tokens
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        outlookAccessToken: true,
        outlookRefreshToken: true,
        outlookTokenExpiry: true,
      },
    });

    if (!user?.outlookAccessToken) {
      return NextResponse.json({ error: 'Outlook non connecté' }, { status: 401 });
    }

    // Vérifier que l'entreprise appartient à l'utilisateur
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer les pièces jointes de l'email
    const attachmentsResponse = await fetch(
      `${GRAPH_API_URL}/me/messages/${emailId}/attachments`,
      {
        headers: { Authorization: `Bearer ${user.outlookAccessToken}` },
      }
    );

    if (!attachmentsResponse.ok) {
      return NextResponse.json({ error: 'Erreur Graph API' }, { status: 500 });
    }

    const attachmentsData = await attachmentsResponse.json();
    const attachments = attachmentsData.value || [];
    const importedDocuments: string[] = [];

    // Créer le dossier uploads
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {}

    for (const attachment of attachments) {
      // Ignorer les inline attachments (images dans le corps)
      if (attachment.isInline) continue;
      
      // Vérifier que c'est un type de fichier supporté
      const supportedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/html',
      ];
      
      if (!supportedTypes.some(t => attachment.contentType?.includes(t))) {
        continue;
      }

      // Récupérer le contenu
      let content: Buffer;
      
      if (attachment.contentBytes) {
        content = Buffer.from(attachment.contentBytes, 'base64');
      } else if (attachment['@odata.type'] === '#microsoft.graph.fileAttachment') {
        // Télécharger le contenu si pas inclus
        const contentResponse = await fetch(
          `${GRAPH_API_URL}/me/messages/${emailId}/attachments/${attachment.id}/$value`,
          {
            headers: { Authorization: `Bearer ${user.outlookAccessToken}` },
          }
        );
        
        if (!contentResponse.ok) continue;
        
        const arrayBuffer = await contentResponse.arrayBuffer();
        content = Buffer.from(arrayBuffer);
      } else {
        continue;
      }

      // Sauvegarder le fichier
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const sanitizedFilename = (attachment.name || 'attachment').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}-${randomStr}-${sanitizedFilename}`;
      const filepath = join(uploadsDir, filename);
      
      await writeFile(filepath, content);

      // Créer l'entrée en base
      const document = await prisma.document.create({
        data: {
          filename: attachment.name || 'attachment',
          fileUrl: `/uploads/${filename}`,
          fileType: attachment.contentType || 'application/octet-stream',
          fileSize: content.length,
          companyId,
          analyzed: false,
          source: 'OUTLOOK',
        },
      });

      importedDocuments.push(document.id);
    }

    return NextResponse.json({
      success: true,
      importedCount: importedDocuments.length,
      documentIds: importedDocuments,
    });
  } catch (error) {
    console.error('Erreur import Outlook:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




