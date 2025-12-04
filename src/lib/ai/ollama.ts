/**
 * Utilitaires Ollama pour modèle local (Mistral 7B)
 * Alternative locale à OpenAI pour analyses simples
 */

import axios from 'axios';
import { sanitizeForLLM } from './sanitize';
import type { DocumentAnalysis, ChatMessage } from '@/types';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = 'mistral:7b';

// Prompt système simplifié pour Mistral
const SYSTEM_PROMPT = `Tu es un expert-comptable français. Analyse les documents et réponds clairement.

Catégories comptables courantes :
- 6063 : Fournitures
- 6064 : Fournitures administratives
- 625 : Déplacements
- 613 : Locations
- 626 : Télécommunications
- 411 : Clients
- 401 : Fournisseurs
- 445661 : TVA déductible
- 445710 : TVA collectée

Réponds en français, simplement.`;

/**
 * Vérifie si Ollama est disponible
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Analyse un document avec Ollama (local)
 * Version simplifiée pour analyses rapides
 */
export async function analyzeDocumentLocal(
  documentText: string,
  documentType?: string
): Promise<DocumentAnalysis> {
  const { sanitizedText } = sanitizeForLLM(documentText);

  const prompt = `Analyse ce document comptable. Réponds en JSON strict.

Type : ${documentType || 'non spécifié'}
Document : ${sanitizedText}

Format JSON attendu :
{
  "type": "FACTURE_ACHAT",
  "amount": 100.50,
  "vat": 20.10,
  "date": "2024-01-15",
  "supplier": "Nom fournisseur",
  "category": "6063 - Fournitures",
  "confidence": 0.8
}

JSON :`;

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: MODEL_NAME,
        prompt: `${SYSTEM_PROMPT}\n\n${prompt}`,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 500,
        },
      },
      { timeout: 30000 }
    );

    const generatedText = response.data.response;
    
    // Extraire JSON de la réponse
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Aucun JSON trouvé dans la réponse');
    }

    const analysis = JSON.parse(jsonMatch[0]) as DocumentAnalysis;
    
    // Validation
    if (!analysis.type || analysis.amount === undefined) {
      throw new Error('Analyse incomplète');
    }

    return analysis;
  } catch (error) {
    console.error('Erreur lors de l\'analyse Ollama:', error);
    throw new Error('Impossible d\'analyser le document avec le modèle local');
  }
}

/**
 * Chat avec Ollama (version locale)
 */
export async function chatComptableLocal(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  let prompt = SYSTEM_PROMPT + '\n\n';

  if (context) {
    const { sanitizedText } = sanitizeForLLM(context);
    prompt += `Contexte : ${sanitizedText}\n\n`;
  }

  // Construire l'historique
  for (const msg of messages) {
    const content = msg.role === 'user' 
      ? sanitizeForLLM(msg.content).sanitizedText 
      : msg.content;
    
    prompt += `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${content}\n`;
  }

  prompt += '\nAssistant : ';

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: MODEL_NAME,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500,
        },
      },
      { timeout: 30000 }
    );

    return response.data.response || 'Désolé, je n\'ai pas pu générer de réponse.';
  } catch (error) {
    console.error('Erreur lors du chat Ollama:', error);
    throw new Error('Impossible de communiquer avec l\'assistant local');
  }
}

/**
 * Catégorisation simple avec Ollama
 */
export async function categorizeExpenseLocal(
  description: string,
  amount: number
): Promise<string> {
  const { sanitizedText } = sanitizeForLLM(description);

  const prompt = `${SYSTEM_PROMPT}

Catégorie comptable pour :
- Description : ${sanitizedText}
- Montant : ${amount}€

Réponds uniquement avec le code et libellé (ex: "6063 - Fournitures") :`;

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: MODEL_NAME,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 50,
        },
      },
      { timeout: 10000 }
    );

    return response.data.response.trim() || 'Non catégorisé';
  } catch (error) {
    console.error('Erreur lors de la catégorisation Ollama:', error);
    return 'Non catégorisé';
  }
}

