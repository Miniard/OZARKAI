/**
 * Composant Chat avec l'expert-comptable IA - Design moderne
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send, Bot, User, Sparkles, Lightbulb, HelpCircle, RefreshCw } from 'lucide-react';
import type { ChatMessage } from '@/types';

interface ChatComptableProps {
  companyId?: string;
}

const SUGGESTIONS = [
  { icon: <Lightbulb className="w-4 h-4" />, text: "Comment déclarer ma TVA ?" },
  { icon: <HelpCircle className="w-4 h-4" />, text: "Quelles dépenses sont déductibles ?" },
  { icon: <Sparkles className="w-4 h-4" />, text: "Optimiser ma fiscalité" },
];

export function ChatComptable({ companyId }: ChatComptableProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
          companyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.conversationId);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <Card padding="none" className="flex flex-col h-[700px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Assistant Comptable IA</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
              </span>
              Disponible 24/7
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNewConversation}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Nouvelle conversation
          </Button>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
        {messages.length === 0 ? (
          // Welcome State
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary-100 flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Bonjour ! Je suis votre expert-comptable IA
            </h3>
            <p className="text-slate-500 mb-8 max-w-md">
              Posez-moi vos questions sur la comptabilité, la fiscalité, la TVA... 
              Je suis là pour vous aider !
            </p>
            
            {/* Suggestions */}
            <div className="flex flex-wrap gap-3 justify-center">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion.text)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl 
                           text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 
                           transition-all hover:-translate-y-0.5 hover:shadow-soft-sm"
                >
                  {suggestion.icon}
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
            
            {loading && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-500" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-soft-sm border border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl
                       text-slate-900 placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                       transition-all"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || loading}
            size="lg"
            className="px-5"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center">
          L'IA peut faire des erreurs. Vérifiez les informations importantes avec un professionnel.
        </p>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-slate-200' : 'bg-primary-100'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-slate-600" />
        ) : (
          <Bot className="w-5 h-5 text-primary-500" />
        )}
      </div>
      
      {/* Message */}
      <div
        className={`max-w-[75%] px-5 py-4 ${
          isUser
            ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm'
            : 'bg-white text-slate-700 rounded-2xl rounded-tl-sm shadow-soft-sm border border-slate-100'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
