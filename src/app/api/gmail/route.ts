/**
 * API Route pour l'intégration Gmail
 * Gère la connexion OAuth et l'import des factures depuis Gmail
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Configuration OAuth Google (à configurer dans .env)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/gmail/callback';

// Scopes nécessaires pour lire les emails
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata',
].join(' ');

/**
 * GET /api/gmail - Vérifier le statut de connexion
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // TODO: Vérifier si l'utilisateur a un token Gmail valide en base de données
    // const gmailToken = await prisma.gmailToken.findUnique({
    //   where: { userId: session.user.id }
    // });

    // Pour l'instant, retourner non connecté
    return NextResponse.json({
      connected: false,
      email: null,
      lastSync: null,
    });
  } catch (error) {
    console.error('Erreur Gmail status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/gmail - Actions Gmail (scan, import)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { action, emailId, companyId } = body;

    switch (action) {
      case 'scan':
        // Scanner les emails pour trouver des factures
        return await scanEmails(session.user.id);
      
      case 'import':
        // Importer une facture spécifique
        if (!emailId || !companyId) {
          return NextResponse.json({ error: 'emailId et companyId requis' }, { status: 400 });
        }
        return await importInvoice(session.user.id, emailId, companyId);
      
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur Gmail action:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Scanner les emails pour trouver des factures
 */
async function scanEmails(userId: string) {
  // TODO: Implémenter avec l'API Gmail
  // 1. Récupérer le token Gmail de l'utilisateur
  // 2. Appeler l'API Gmail pour lister les emails
  // 3. Filtrer les emails avec pièces jointes PDF
  // 4. Utiliser l'IA pour détecter les factures

  // Données mockées pour la démo
  const mockEmails = [
    {
      id: '1',
      threadId: 't1',
      subject: 'Facture #2024-1234 - Services Cloud',
      from: 'facturation@aws.amazon.com',
      date: new Date().toISOString(),
      attachments: [
        { id: 'a1', filename: 'facture-aws-dec2024.pdf', mimeType: 'application/pdf', size: 245000 }
      ],
    },
    {
      id: '2',
      threadId: 't2',
      subject: 'Votre facture Orange Pro - Novembre 2024',
      from: 'factures@orange.fr',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { id: 'a2', filename: 'facture-orange-nov2024.pdf', mimeType: 'application/pdf', size: 189000 }
      ],
    },
  ];

  return NextResponse.json({
    emails: mockEmails,
    total: mockEmails.length,
  });
}

/**
 * Importer une facture depuis un email
 */
async function importInvoice(userId: string, emailId: string, companyId: string) {
  // TODO: Implémenter avec l'API Gmail
  // 1. Télécharger la pièce jointe
  // 2. Sauvegarder dans S3
  // 3. Créer le document en base
  // 4. Lancer l'analyse IA

  return NextResponse.json({
    success: true,
    documentId: 'doc_' + Date.now(),
    message: 'Facture importée avec succès',
  });
}


