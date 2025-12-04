/**
 * Types TypeScript pour Komptal
 */

// Types d'analyse de document
export interface DocumentAnalysis {
  type: 'FACTURE_ACHAT' | 'FACTURE_VENTE' | 'RECU' | 'NOTE_FRAIS' | 'RELEVE_BANCAIRE' | 'AUTRE';
  amount: number;
  vat: number;
  vatRate?: number;
  date?: string;
  supplier?: string;
  category: string;
  confidence: number;
  suggestions?: string[];
}

// Types pour l'anonymisation
export interface SanitizedData {
  sanitizedText: string;
  replacements: Record<string, string>;
}

// Types pour le chat
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  companyId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  suggestions?: string[];
}

// Types pour le dashboard
export interface DashboardData {
  revenue: number;
  expenses: number;
  vat: number;
  balance: number;
  recentDocuments: DocumentSummary[];
  monthlyData: MonthlyData[];
}

export interface DocumentSummary {
  id: string;
  filename: string;
  type: string;
  amount: number;
  date: string;
  analyzed: boolean;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

// Types pour l'upload
export interface UploadRequest {
  filename: string;
  fileType: string;
  fileSize: number;
  companyId: string;
}

export interface UploadResponse {
  uploadUrl: string;
  documentId: string;
}

// Types pour les modèles LLM
export type LLMProvider = 'openai' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Types d'erreur
export class KomptalError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'KomptalError';
  }
}

