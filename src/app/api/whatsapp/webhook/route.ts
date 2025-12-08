/**
 * API : Twilio WhatsApp Webhook
 * 
 * Reçoit les messages WhatsApp via Twilio
 * et les importe automatiquement dans Komptal
 * 
 * Configuration Twilio :
 * 1. Console Twilio → Messaging → Try WhatsApp
 * 2. Webhook URL : https://votre-domaine.com/api/whatsapp/webhook
 * 3. Méthode : HTTP POST
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Validation du webhook (optionnel - pour vérifier que c'est bien Twilio)
export async function GET(request: NextRequest) {
  // Twilio n'a pas besoin de vérification comme Meta
  // On peut juste retourner OK
  return NextResponse.json({ status: 'Twilio WhatsApp Webhook actif' });
}

// Réception des messages Twilio
export async function POST(request: NextRequest) {
  try {
    // Twilio envoie en application/x-www-form-urlencoded
    const formData = await request.formData();
    
    // Extraire les données du message
    const from = formData.get('From') as string; // whatsapp:+33612345678
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const numMedia = parseInt(formData.get('NumMedia') as string || '0');
    const messageSid = formData.get('MessageSid') as string;
    
    // Nettoyer le numéro (enlever "whatsapp:")
    const phoneNumber = from?.replace('whatsapp:', '').replace('+', '');
    
    console.log('📩 Message Twilio WhatsApp reçu:', {
      from: phoneNumber,
      body: body?.substring(0, 100),
      numMedia
    });

    if (!phoneNumber) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Trouver l'utilisateur par numéro WhatsApp
    const user = await prisma.user.findFirst({
      where: { 
        whatsappPhoneNumber: phoneNumber,
        whatsappConnected: true,
      },
      include: { companies: true },
    });

    if (!user) {
      console.log('⚠️ Utilisateur non trouvé pour:', phoneNumber);
      return sendTwiMLResponse(
        '❌ Votre numéro n\'est pas lié à un compte Komptal.\n\n' +
        'Connectez-vous sur komptal.com et ajoutez votre numéro dans les paramètres WhatsApp.'
      );
    }

    const company = user.companies[0];
    if (!company) {
      return sendTwiMLResponse(
        '⚠️ Aucune entreprise trouvée sur votre compte.\n' +
        'Créez d\'abord une entreprise sur komptal.com'
      );
    }

    // Traiter les médias (images/documents)
    if (numMedia > 0) {
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = formData.get(`MediaUrl${i}`) as string;
        const mediaType = formData.get(`MediaContentType${i}`) as string;
        
        if (mediaUrl && mediaType) {
          await handleMedia(mediaUrl, mediaType, user, company, phoneNumber);
        }
      }
      
      return sendTwiMLResponse(
        '✅ Facture reçue !\n\n' +
        '🔍 Analyse en cours...\n' +
        'Consultez komptal.com pour voir les détails.'
      );
    }

    // Message texte
    const textLower = body?.toLowerCase() || '';
    
    if (textLower.includes('aide') || textLower.includes('help')) {
      return sendTwiMLResponse(
        '🤖 *Komptal Bot*\n\n' +
        'Envoyez-moi vos factures (photo ou PDF) et je les importerai automatiquement !\n\n' +
        '*Commandes :*\n' +
        '• 📸 Envoyez une photo de facture\n' +
        '• 📄 Envoyez un PDF\n' +
        '• "stats" - Voir vos statistiques\n' +
        '• "aide" - Ce message\n\n' +
        'Plus d\'options sur komptal.com 🌐'
      );
    }
    
    if (textLower.includes('stats') || textLower.includes('statistiques')) {
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

      return sendTwiMLResponse(
        `📊 *Vos statistiques*\n\n` +
        `📄 Documents : ${docCount}\n` +
        `✅ Analysés : ${analyzedCount}\n` +
        `💰 Total : ${(totalAmount._sum.amount || 0).toLocaleString('fr-FR')} €\n\n` +
        'Plus de détails sur komptal.com'
      );
    }

    // Message par défaut
    return sendTwiMLResponse(
      '👋 Bonjour !\n\n' +
      'Pour importer une facture, envoyez-moi simplement une photo ou un PDF.\n\n' +
      'Tapez "aide" pour voir les commandes disponibles.'
    );

  } catch (error) {
    console.error('Erreur webhook Twilio:', error);
    return sendTwiMLResponse('❌ Erreur interne. Veuillez réessayer.');
  }
}

// Traiter un média (image ou PDF)
async function handleMedia(
  mediaUrl: string, 
  mediaType: string,
  user: any,
  company: any,
  phoneNumber: string
) {
  try {
    console.log('📥 Téléchargement média:', mediaUrl, mediaType);
    
    // Télécharger le fichier depuis Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.error('Twilio credentials manquants');
      return;
    }

    // Auth Basic pour Twilio
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(mediaUrl, {
      headers: { 
        'Authorization': `Basic ${auth}` 
      }
    });

    if (!response.ok) {
      console.error('Erreur téléchargement média:', response.status);
      return;
    }

    const buffer = await response.arrayBuffer();
    const base64 = `data:${mediaType};base64,${Buffer.from(buffer).toString('base64')}`;

    // Déterminer le nom de fichier
    const extension = mediaType.includes('pdf') ? 'pdf' : 
                      mediaType.includes('png') ? 'png' : 'jpg';
    const filename = `whatsapp_${Date.now()}.${extension}`;

    // Créer le document
    const document = await prisma.document.create({
      data: {
        filename,
        fileUrl: base64,
        fileType: mediaType.includes('pdf') ? 'pdf' : 'image',
        fileSize: buffer.byteLength,
        companyId: company.id,
        analyzed: false,
        source: 'WHATSAPP',
      },
    });

    console.log('✅ Document créé:', document.id);

    // Analyser automatiquement si c'est une image
    if (mediaType.startsWith('image/')) {
      try {
        const analyzeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/documents/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id }),
        });

        if (analyzeResponse.ok) {
          console.log('✅ Analyse lancée pour:', document.id);
        }
      } catch (e) {
        console.error('Erreur analyse:', e);
      }
    }

  } catch (error) {
    console.error('Erreur traitement média:', error);
  }
}

// Réponse TwiML (format XML de Twilio)
function sendTwiMLResponse(message: string) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Échapper les caractères spéciaux XML
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Note: Pour envoyer des messages asynchrones, utilisez sendTwilioMessage depuis @/lib/twilio
