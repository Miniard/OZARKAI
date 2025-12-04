/**
 * Utilitaires OpenAI pour analyse comptable
 */

import OpenAI from 'openai';
import { sanitizeForLLM } from './sanitize';
import type { DocumentAnalysis, ChatMessage, LLMConfig } from '@/types';

// Initialisation OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt système pour l'expert-comptable
const SYSTEM_PROMPT = `Tu es un expert-comptable français virtuel, spécialisé dans l'accompagnement des TPE (Très Petites Entreprises).

**Ton rôle :**
- Analyser les documents comptables (factures, reçus, relevés)
- Proposer des catégories comptables selon le plan comptable général français
- Expliquer clairement et simplement, SANS jargon technique
- Demander les documents ou informations manquantes si nécessaire
- Respecter strictement les règles comptables françaises

**Règles importantes :**
- Tu ne donnes JAMAIS de conseil fiscal illégal
- Tu expliques toujours les étapes de ton raisonnement
- Tu utilises un langage accessible aux non-comptables
- Tu cites les règles comptables quand c'est pertinent
- En cas de doute, tu le mentionnes clairement

**Catégories comptables courantes (exemples) :**
- 6063 : Fournitures d'entretien et de petit équipement
- 6064 : Fournitures administratives
- 6256 : Missions
- 6257 : Réceptions
- 625 : Déplacements, missions et réceptions
- 613 : Locations
- 626 : Frais postaux et de télécommunications
- 411 : Clients
- 401 : Fournisseurs
- 445661 : TVA déductible
- 445710 : TVA collectée
- 512 : Banques

Réponds toujours en français.`;

/**
 * Analyse un document comptable avec OpenAI
 * @param documentText - Texte extrait du document
 * @param documentType - Type de document (optionnel)
 * @returns Analyse structurée du document
 */
export async function analyzeDocument(
  documentText: string,
  documentType?: string
): Promise<DocumentAnalysis> {
  // Anonymiser les données avant envoi
  const { sanitizedText, replacements } = sanitizeForLLM(documentText);

  const prompt = `Analyse ce document comptable et extrais les informations clés.

Type de document : ${documentType || 'non spécifié'}

Contenu du document :
${sanitizedText}

Renvoie une analyse JSON structurée avec :
- type : le type de document (FACTURE_ACHAT, FACTURE_VENTE, RECU, NOTE_FRAIS, RELEVE_BANCAIRE, ou AUTRE)
- amount : montant total TTC (nombre)
- vat : montant de la TVA (nombre)
- vatRate : taux de TVA en % (nombre, optionnel)
- date : date du document au format YYYY-MM-DD (optionnel)
- supplier : nom du fournisseur ou client (optionnel)
- category : catégorie comptable suggérée (ex: "6063 - Fournitures")
- confidence : niveau de confiance (0-1)
- suggestions : tableau de suggestions ou remarques (optionnel)

Si certaines informations manquent, utilise null.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Aucune réponse de l\'IA');
    }

    const analysis = JSON.parse(content) as DocumentAnalysis;
    
    // Validation basique
    if (!analysis.type || analysis.amount === undefined) {
      throw new Error('Analyse incomplète');
    }

    return analysis;
  } catch (error) {
    console.error('Erreur lors de l\'analyse OpenAI:', error);
    throw new Error('Impossible d\'analyser le document');
  }
}

/**
 * Chat avec l'expert-comptable IA
 * @param messages - Historique de conversation
 * @param context - Contexte additionnel (optionnel)
 * @returns Réponse de l'assistant
 */
export async function chatComptable(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Ajouter contexte si fourni
  if (context) {
    const { sanitizedText } = sanitizeForLLM(context);
    chatMessages.push({
      role: 'system',
      content: `Contexte additionnel : ${sanitizedText}`,
    });
  }

  // Ajouter l'historique
  for (const msg of messages) {
    // Anonymiser les messages utilisateur
    if (msg.role === 'user') {
      const { sanitizedText } = sanitizeForLLM(msg.content);
      chatMessages.push({ role: 'user', content: sanitizedText });
    } else {
      chatMessages.push({ role: msg.role, content: msg.content });
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Aucune réponse de l\'IA');
    }

    return content;
  } catch (error) {
    console.error('Erreur lors du chat OpenAI:', error);
    throw new Error('Impossible de communiquer avec l\'assistant');
  }
}

/**
 * Extraction de texte depuis une image via OCR OpenAI
 * @param imageUrl - URL de l'image
 * @returns Texte extrait
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    console.log('🔑 Clé OpenAI configurée:', !!process.env.OPENAI_API_KEY);
    console.log('🖼️ URL de l\'image (100 premiers chars):', imageUrl.substring(0, 100));
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extrais tout le texte de ce document. Conserve la structure et la mise en forme autant que possible.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    console.log('✅ OpenAI Vision réponse reçue');
    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('❌ Erreur OpenAI Vision complète:', error);
    console.error('❌ Message:', error?.message);
    console.error('❌ Response:', error?.response?.data);
    throw new Error(`Impossible d'extraire le texte: ${error?.message || 'Erreur inconnue'}`);
  }
}

/**
 * Catégorisation intelligente d'une dépense
 * @param description - Description de la dépense
 * @param amount - Montant
 * @returns Catégorie comptable suggérée
 */
export async function categorizExpense(
  description: string,
  amount: number
): Promise<string> {
  const { sanitizedText } = sanitizeForLLM(description);

  const prompt = `Quelle est la catégorie comptable la plus appropriée pour cette dépense ?

Description : ${sanitizedText}
Montant : ${amount}€

Réponds uniquement avec le code et le libellé, par exemple : "6063 - Fournitures d'entretien"`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content || 'Non catégorisé';
  } catch (error) {
    console.error('Erreur lors de la catégorisation:', error);
    return 'Non catégorisé';
  }
}

