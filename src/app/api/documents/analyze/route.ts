/**
 * API : Analyse automatique des factures via OpenAI Vision
 * POST /api/documents/analyze
 * 
 * Extrait automatiquement :
 * - Montant total
 * - TVA
 * - Fournisseur/Client
 * - Date de facture
 * - Numéro de facture
 * - Type de document
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types de documents détectables
const DOC_TYPES = {
  FACTURE_VENTE: 'Facture de vente (vous facturez)',
  FACTURE_ACHAT: 'Facture d\'achat (vous payez)',
  DEVIS: 'Devis',
  NOTE_FRAIS: 'Note de frais',
  RECU: 'Reçu / Ticket',
  AUTRE: 'Autre document',
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId requis' }, { status: 400 });
    }

    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { company: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès
    if (document.company.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Préparer l'image/PDF pour OpenAI Vision
    let imageContent: any;
    
    if (document.fileUrl.startsWith('data:')) {
      // Base64 data URL
      imageContent = {
        type: 'image_url',
        image_url: {
          url: document.fileUrl,
          detail: 'high',
        },
      };
    } else {
      // URL externe
      imageContent = {
        type: 'image_url',
        image_url: {
          url: document.fileUrl,
          detail: 'high',
        },
      };
    }

    // Appel OpenAI Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en analyse de documents comptables français. 
Analyse cette image de document et extrais les informations suivantes au format JSON strict.
Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.

{
  "type": "FACTURE_VENTE" | "FACTURE_ACHAT" | "DEVIS" | "NOTE_FRAIS" | "RECU" | "AUTRE",
  "numero": "numéro de facture ou null",
  "date": "YYYY-MM-DD ou null",
  "fournisseur": "nom de l'entreprise émettrice ou null",
  "client": "nom du client/destinataire ou null",
  "montantHT": nombre ou null,
  "tva": nombre (montant TVA) ou null,
  "tauxTVA": nombre (pourcentage) ou null,
  "montantTTC": nombre ou null,
  "devise": "EUR" par défaut,
  "description": "description courte du contenu",
  "confiance": nombre entre 0 et 1 (niveau de confiance de l'analyse)
}

Si c'est une facture que l'entreprise ÉMET → FACTURE_VENTE
Si c'est une facture que l'entreprise REÇOIT/PAIE → FACTURE_ACHAT
Les montants doivent être des nombres (pas de symboles €)`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyse ce document comptable et extrais les informations :',
            },
            imageContent,
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parser le JSON
    let analysisResult;
    try {
      // Nettoyer le texte (enlever markdown si présent)
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisResult = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Erreur parsing JSON:', responseText);
      return NextResponse.json({ 
        error: 'Erreur lors de l\'analyse du document',
        details: 'Format de réponse invalide',
      }, { status: 500 });
    }

    // Mettre à jour le document avec les données analysées
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        analyzed: true,
        docType: analysisResult.type || 'AUTRE',
        amount: analysisResult.montantTTC || analysisResult.montantHT || null,
        vat: analysisResult.tva || null,
        date: analysisResult.date ? new Date(analysisResult.date) : null,
        supplier: analysisResult.fournisseur || analysisResult.client || null,
        analysisData: {
          ...analysisResult,
          analyzedAt: new Date().toISOString(),
          model: 'gpt-4o',
        },
      },
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      analysis: analysisResult,
    });

  } catch (error) {
    console.error('Erreur analyse document:', error);
    
    // Gérer les erreurs OpenAI spécifiques
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json({ 
          error: 'Limite d\'API atteinte, réessayez plus tard' 
        }, { status: 429 });
      }
      if (error.status === 400) {
        return NextResponse.json({ 
          error: 'Format de document non supporté' 
        }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    );
  }
}

// Analyser tous les documents non analysés d'une entreprise
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requis' }, { status: 400 });
    }

    // Vérifier l'accès à l'entreprise
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || company.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les documents non analysés
    const unanalyzedDocs = await prisma.document.findMany({
      where: {
        companyId,
        analyzed: false,
      },
      take: 10, // Limiter pour éviter timeout
    });

    if (unanalyzedDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tous les documents sont déjà analysés',
        analyzed: 0,
      });
    }

    // Analyser chaque document (en séquentiel pour éviter rate limits)
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const doc of unanalyzedDocs) {
      try {
        // Appeler notre propre API d'analyse
        const analyzeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/documents/analyze`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({ documentId: doc.id }),
        });

        if (analyzeResponse.ok) {
          successCount++;
          results.push({ id: doc.id, status: 'success' });
        } else {
          errorCount++;
          results.push({ id: doc.id, status: 'error' });
        }
      } catch (e) {
        errorCount++;
        results.push({ id: doc.id, status: 'error' });
      }

      // Petit délai entre les appels
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: true,
      analyzed: successCount,
      errors: errorCount,
      total: unanalyzedDocs.length,
      results,
    });

  } catch (error) {
    console.error('Erreur analyse batch:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}

