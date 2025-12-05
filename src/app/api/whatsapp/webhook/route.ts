/**
 * API : WhatsApp Business Webhook
 * 
 * Reçoit les messages WhatsApp avec factures
 * et les importe automatiquement dans OZARKAI
 * 
 * Configuration requise :
 * 1. Créer une app sur Meta for Developers
 * 2. Activer WhatsApp Business API
 * 3. Configurer le webhook URL : https://votre-domaine.com/api/whatsapp/webhook
 * 4. Copier le verify token et l'ajouter en variable d'env
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Vérification du webhook par Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp webhook vérifié');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Réception des messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📩 WhatsApp webhook reçu:', JSON.stringify(body, null, 2));

    // Structure du webhook WhatsApp
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    if (!value?.messages) {
      return NextResponse.json({ status: 'no messages' });
    }

    for (const message of value.messages) {
      await processMessage(message, value.metadata?.phone_number_id);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Erreur webhook WhatsApp:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function processMessage(message: any, phoneNumberId: string) {
  const from = message.from; // Numéro expéditeur
  const messageType = message.type;
  const timestamp = new Date(parseInt(message.timestamp) * 1000);

  console.log(`📱 Message de ${from} (type: ${messageType})`);

  // Trouver l'utilisateur par numéro WhatsApp
  const user = await prisma.user.findFirst({
    where: { 
      whatsappPhoneNumber: from,
      whatsappConnected: true,
    },
    include: { companies: true },
  });

  if (!user) {
    console.log('⚠️ Utilisateur non trouvé pour ce numéro WhatsApp');
    await sendWhatsAppMessage(phoneNumberId, from, 
      '❌ Votre numéro n\'est pas lié à un compte OZARKAI.\n\n' +
      'Connectez-vous sur ozarkai.com et ajoutez votre numéro dans les paramètres.'
    );
    return;
  }

  const company = user.companies[0]; // Prendre la première entreprise
  if (!company) {
    await sendWhatsAppMessage(phoneNumberId, from,
      '⚠️ Aucune entreprise trouvée sur votre compte.\n' +
      'Créez d\'abord une entreprise sur ozarkai.com'
    );
    return;
  }

  // Traitement selon le type de message
  switch (messageType) {
    case 'image':
      await handleImageMessage(message, user, company, phoneNumberId, from);
      break;
    case 'document':
      await handleDocumentMessage(message, user, company, phoneNumberId, from);
      break;
    case 'text':
      await handleTextMessage(message, user, phoneNumberId, from);
      break;
    default:
      await sendWhatsAppMessage(phoneNumberId, from,
        '📄 Pour importer une facture, envoyez-moi :\n' +
        '• Une photo de la facture\n' +
        '• Un document PDF\n\n' +
        'Je l\'analyserai automatiquement ! 🤖'
      );
  }
}

async function handleImageMessage(
  message: any, 
  user: any, 
  company: any,
  phoneNumberId: string, 
  from: string
) {
  try {
    const mediaId = message.image?.id;
    
    if (!mediaId) {
      throw new Error('Pas d\'ID média');
    }

    // Télécharger l'image depuis WhatsApp
    const imageData = await downloadWhatsAppMedia(mediaId);
    
    if (!imageData) {
      throw new Error('Impossible de télécharger l\'image');
    }

    // Créer le document
    const document = await prisma.document.create({
      data: {
        filename: `whatsapp_${Date.now()}.jpg`,
        fileUrl: imageData.base64,
        fileType: 'image/jpeg',
        fileSize: imageData.size || 0,
        companyId: company.id,
        analyzed: false,
      },
    });

    // Envoyer confirmation
    await sendWhatsAppMessage(phoneNumberId, from,
      '✅ Facture reçue !\n\n' +
      '🔍 Analyse en cours...\n' +
      'Je vous envoie les détails dans quelques secondes.'
    );

    // Analyser automatiquement (appeler notre API)
    try {
      const analyzeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/documents/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (analyzeResponse.ok) {
        const result = await analyzeResponse.json();
        const analysis = result.analysis;

        // Envoyer le résumé
        const summary = formatAnalysisSummary(analysis);
        await sendWhatsAppMessage(phoneNumberId, from, summary);
      } else {
        await sendWhatsAppMessage(phoneNumberId, from,
          '⚠️ L\'analyse automatique a échoué.\n' +
          'La facture a été importée, vous pouvez l\'analyser sur ozarkai.com'
        );
      }
    } catch (e) {
      console.error('Erreur analyse:', e);
    }

  } catch (error) {
    console.error('Erreur traitement image:', error);
    await sendWhatsAppMessage(phoneNumberId, from,
      '❌ Erreur lors du traitement de l\'image.\n' +
      'Veuillez réessayer ou importer sur ozarkai.com'
    );
  }
}

async function handleDocumentMessage(
  message: any, 
  user: any, 
  company: any,
  phoneNumberId: string, 
  from: string
) {
  try {
    const doc = message.document;
    const mediaId = doc?.id;
    const filename = doc?.filename || `document_${Date.now()}.pdf`;
    const mimeType = doc?.mime_type || 'application/pdf';

    if (!mediaId) {
      throw new Error('Pas d\'ID média');
    }

    // Vérifier que c'est un PDF ou une image
    if (!mimeType.includes('pdf') && !mimeType.startsWith('image/')) {
      await sendWhatsAppMessage(phoneNumberId, from,
        '⚠️ Format non supporté.\n\n' +
        'Envoyez uniquement :\n' +
        '• Documents PDF\n' +
        '• Images (JPG, PNG)'
      );
      return;
    }

    // Télécharger le document
    const docData = await downloadWhatsAppMedia(mediaId);
    
    if (!docData) {
      throw new Error('Impossible de télécharger le document');
    }

    // Créer le document
    const document = await prisma.document.create({
      data: {
        filename,
        fileUrl: docData.base64,
        fileType: mimeType.includes('pdf') ? 'pdf' : 'image',
        fileSize: docData.size || 0,
        companyId: company.id,
        analyzed: false,
      },
    });

    await sendWhatsAppMessage(phoneNumberId, from,
      `✅ Document "${filename}" reçu !\n\n` +
      '🔍 Analyse en cours...'
    );

    // Analyser si c'est une image (les PDFs sont plus complexes pour Vision)
    if (mimeType.startsWith('image/')) {
      try {
        const analyzeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/documents/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id }),
        });

        if (analyzeResponse.ok) {
          const result = await analyzeResponse.json();
          const summary = formatAnalysisSummary(result.analysis);
          await sendWhatsAppMessage(phoneNumberId, from, summary);
        }
      } catch (e) {
        console.error('Erreur analyse:', e);
      }
    } else {
      await sendWhatsAppMessage(phoneNumberId, from,
        '📄 Document PDF importé !\n\n' +
        'Consultez ozarkai.com pour voir les détails et l\'analyser.'
      );
    }

  } catch (error) {
    console.error('Erreur traitement document:', error);
    await sendWhatsAppMessage(phoneNumberId, from,
      '❌ Erreur lors du traitement.\nVeuillez réessayer.'
    );
  }
}

async function handleTextMessage(
  message: any, 
  user: any,
  phoneNumberId: string, 
  from: string
) {
  const text = message.text?.body?.toLowerCase() || '';

  if (text.includes('aide') || text.includes('help')) {
    await sendWhatsAppMessage(phoneNumberId, from,
      '🤖 *OZARKAI Bot*\n\n' +
      'Envoyez-moi vos factures (photo ou PDF) et je les importerai automatiquement !\n\n' +
      '*Commandes :*\n' +
      '• 📸 Envoyez une photo de facture\n' +
      '• 📄 Envoyez un PDF\n' +
      '• "stats" - Voir vos statistiques\n' +
      '• "aide" - Ce message\n\n' +
      'Plus d\'options sur ozarkai.com 🌐'
    );
  } else if (text.includes('stats') || text.includes('statistiques')) {
    // Récupérer les stats
    const company = user.companies[0];
    if (company) {
      const docCount = await prisma.document.count({
        where: { companyId: company.id },
      });
      const analyzedCount = await prisma.document.count({
        where: { companyId: company.id, analyzed: true },
      });
      const totalAmount = await prisma.document.aggregate({
        where: { companyId: company.id, analyzed: true },
        _sum: { amount: true },
      });

      await sendWhatsAppMessage(phoneNumberId, from,
        `📊 *Vos statistiques*\n\n` +
        `📄 Documents : ${docCount}\n` +
        `✅ Analysés : ${analyzedCount}\n` +
        `💰 Total : ${(totalAmount._sum.amount || 0).toLocaleString('fr-FR')} €\n\n` +
        'Plus de détails sur ozarkai.com'
      );
    }
  } else {
    await sendWhatsAppMessage(phoneNumberId, from,
      '👋 Bonjour !\n\n' +
      'Pour importer une facture, envoyez-moi simplement une photo ou un PDF.\n\n' +
      'Tapez "aide" pour voir les commandes disponibles.'
    );
  }
}

// Télécharger un média depuis WhatsApp
async function downloadWhatsAppMedia(mediaId: string): Promise<{ base64: string; size: number } | null> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('WHATSAPP_ACCESS_TOKEN manquant');
    return null;
  }

  try {
    // 1. Obtenir l'URL du média
    const mediaUrlResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!mediaUrlResponse.ok) {
      throw new Error('Erreur récupération URL média');
    }

    const mediaData = await mediaUrlResponse.json();
    const mediaUrl = mediaData.url;

    // 2. Télécharger le média
    const downloadResponse = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!downloadResponse.ok) {
      throw new Error('Erreur téléchargement média');
    }

    const buffer = await downloadResponse.arrayBuffer();
    const base64 = `data:${downloadResponse.headers.get('content-type')};base64,${Buffer.from(buffer).toString('base64')}`;

    return {
      base64,
      size: buffer.byteLength,
    };
  } catch (error) {
    console.error('Erreur download média WhatsApp:', error);
    return null;
  }
}

// Envoyer un message WhatsApp
async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!accessToken || !phoneNumberId) {
    console.log('WhatsApp non configuré, message non envoyé:', text);
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur envoi WhatsApp:', error);
    }
  } catch (error) {
    console.error('Erreur envoi WhatsApp:', error);
  }
}

// Formater le résumé d'analyse
function formatAnalysisSummary(analysis: any): string {
  if (!analysis) {
    return '⚠️ Analyse incomplète';
  }

  const type = analysis.type === 'FACTURE_ACHAT' ? '📥 Achat' :
               analysis.type === 'FACTURE_VENTE' ? '📤 Vente' :
               analysis.type === 'NOTE_FRAIS' ? '🧾 Note de frais' :
               analysis.type === 'RECU' ? '🧾 Reçu' : '📄 Document';

  const lines = [
    '✅ *Analyse terminée !*\n',
    `${type}`,
  ];

  if (analysis.fournisseur) {
    lines.push(`🏢 ${analysis.fournisseur}`);
  }

  if (analysis.montantTTC) {
    lines.push(`💰 *${analysis.montantTTC.toLocaleString('fr-FR')} €* TTC`);
  }

  if (analysis.tva) {
    lines.push(`📊 TVA : ${analysis.tva.toLocaleString('fr-FR')} €`);
  }

  if (analysis.date) {
    lines.push(`📅 ${new Date(analysis.date).toLocaleDateString('fr-FR')}`);
  }

  if (analysis.numero) {
    lines.push(`#️⃣ N° ${analysis.numero}`);
  }

  lines.push('\n📱 Plus de détails sur ozarkai.com');

  return lines.join('\n');
}

