/**
 * API Route : Chat avec l'expert-comptable IA
 * POST /api/chat - Envoie un message et reçoit une réponse
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { chatComptable } from '@/lib/ai/openai';
import { chatComptableLocal, isOllamaAvailable } from '@/lib/ai/ollama';
import { rateLimitMiddleware } from '@/lib/security/ratelimit';
import { getClientIp } from '@/lib/utils';
import type { ChatRequest, ChatResponse, ChatMessage } from '@/types';

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

    const body = (await request.json()) as ChatRequest;
    const { message, conversationId, companyId } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message vide' },
        { status: 400 }
      );
    }

    // Récupérer ou créer la conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // Limiter l'historique à 20 messages
          },
        },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          companyId: companyId || null,
          messages: {
            create: {
              role: 'USER',
              content: message,
            },
          },
        },
        include: {
          messages: true,
        },
      });
    } else {
      // Ajouter le message utilisateur
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: message,
        },
      });
    }

    // Construire l'historique pour l'IA
    const chatHistory: ChatMessage[] = conversation.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Ajouter le nouveau message si pas déjà dans l'historique
    if (!conversationId) {
      chatHistory.push({
        role: 'user',
        content: message,
      });
    }

    // Obtenir le contexte de l'entreprise si fourni
    let context = '';
    if (companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          userId: session.user.id,
        },
        include: {
          documents: {
            where: { analyzed: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          entries: {
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      });

      if (company) {
        context = `Entreprise: ${company.name}\n`;
        context += `Documents récents: ${company.documents.length}\n`;
        context += `Écritures récentes: ${company.entries.length}\n`;
      }
    }

    // Appeler l'IA
    let assistantResponse: string;
    
    const useLocal = process.env.USE_LOCAL_MODEL === 'true';
    if (useLocal && (await isOllamaAvailable())) {
      assistantResponse = await chatComptableLocal(chatHistory, context);
    } else {
      assistantResponse = await chatComptable(chatHistory, context);
    }

    // Sauvegarder la réponse
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: assistantResponse,
      },
    });

    const response: ChatResponse = {
      message: assistantResponse,
      conversationId: conversation.id,
      suggestions: generateSuggestions(message),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur chat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec l\'assistant' },
      { status: 500 }
    );
  }
}

/**
 * Génère des suggestions de questions basées sur le message
 */
function generateSuggestions(message: string): string[] {
  const suggestions = [
    'Comment catégoriser cette dépense ?',
    'Quelle est la TVA applicable ?',
    'Puis-je déduire cette charge ?',
    'Comment enregistrer cette facture ?',
  ];

  // Suggestions contextuelles simples
  if (message.toLowerCase().includes('tva')) {
    return [
      'Quel est le taux de TVA applicable ?',
      'Comment récupérer la TVA déductible ?',
      'Quand déclarer la TVA ?',
    ];
  }

  if (message.toLowerCase().includes('facture')) {
    return [
      'Comment enregistrer une facture d\'achat ?',
      'Que faire d\'une facture sans TVA ?',
      'Comment numéroter mes factures ?',
    ];
  }

  return suggestions;
}

