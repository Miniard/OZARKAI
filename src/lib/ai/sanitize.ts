/**
 * Module d'anonymisation des données sensibles
 * Remplace les informations personnelles avant envoi à l'IA
 */

import type { SanitizedData } from '@/types';

interface SanitizationPattern {
  name: string;
  regex: RegExp;
  prefix: string;
}

// Patterns de détection des données sensibles
const PATTERNS: SanitizationPattern[] = [
  // SIRET (14 chiffres)
  {
    name: 'SIRET',
    regex: /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/g,
    prefix: 'SIRET_',
  },
  // SIREN (9 chiffres)
  {
    name: 'SIREN',
    regex: /\b\d{3}\s?\d{3}\s?\d{3}\b/g,
    prefix: 'SIREN_',
  },
  // IBAN français (FRxx xxxx xxxx xxxx xxxx xxxx xxx)
  {
    name: 'IBAN',
    regex: /\bFR\d{2}\s?(?:\d{4}\s?){5}\d{3}\b/gi,
    prefix: 'IBAN_',
  },
  // BIC/SWIFT
  {
    name: 'BIC',
    regex: /\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
    prefix: 'BIC_',
  },
  // Numéro de TVA intracommunautaire français
  {
    name: 'TVA',
    regex: /\bFR\s?\d{2}\s?\d{9}\b/gi,
    prefix: 'TVA_',
  },
  // Adresses postales françaises (approximatif)
  {
    name: 'ADDRESS',
    regex: /\b\d{1,4}\s+(?:rue|avenue|boulevard|place|allée|impasse|chemin)\s+[a-zàâäéèêëïîôöùûüÿœæç\s\-']+,?\s+\d{5}\s+[a-zàâäéèêëïîôöùûüÿœæç\s\-']+\b/gi,
    prefix: 'ADDR_',
  },
  // Code postal
  {
    name: 'POSTAL_CODE',
    regex: /\b\d{5}\b/g,
    prefix: 'CP_',
  },
  // Numéro de téléphone français
  {
    name: 'PHONE',
    regex: /\b(?:(?:\+33|0033|0)\s?[1-9](?:\s?\d{2}){4})\b/g,
    prefix: 'TEL_',
  },
  // Email
  {
    name: 'EMAIL',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    prefix: 'EMAIL_',
  },
  // Noms propres (heuristique simple : mots commençant par majuscule, 2+ lettres)
  // Attention : peut capturer des faux positifs
  {
    name: 'NAME',
    regex: /\b[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸŒÆÇ][a-zàâäéèêëïîôöùûüÿœæç]{2,}(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸŒÆÇ][a-zàâäéèêëïîôöùûüÿœæç]{2,})+\b/g,
    prefix: 'NOM_',
  },
];

// Mots-clés à ne PAS anonymiser (noms de mois, etc.)
const WHITELIST = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  'Monsieur', 'Madame', 'Mademoiselle',
  'France', 'Paris', 'Lyon', 'Marseille',
  'Facture', 'Total', 'HT', 'TTC', 'TVA',
];

/**
 * Anonymise un texte en remplaçant les données sensibles
 * @param rawText - Texte brut extrait du document
 * @returns Texte anonymisé + mapping des remplacements
 */
export function sanitizeForLLM(rawText: string): SanitizedData {
  let sanitizedText = rawText;
  const replacements: Record<string, string> = {};
  let counter = 0;

  // Appliquer chaque pattern
  for (const pattern of PATTERNS) {
    const matches = sanitizedText.match(pattern.regex);
    
    if (matches) {
      // Filtrer les whitelist
      const filteredMatches = matches.filter(
        (match) => !WHITELIST.some((word) => match.includes(word))
      );

      // Remplacer chaque occurrence unique
      const uniqueMatches = Array.from(new Set(filteredMatches));
      
      for (const match of uniqueMatches) {
        const placeholder = `${pattern.prefix}${counter.toString().padStart(3, '0')}`;
        replacements[placeholder] = match;
        
        // Remplacer toutes les occurrences de ce match
        sanitizedText = sanitizedText.replace(new RegExp(escapeRegExp(match), 'g'), placeholder);
        counter++;
      }
    }
  }

  return {
    sanitizedText,
    replacements,
  };
}

/**
 * Restaure les données anonymisées dans une réponse
 * @param text - Texte avec placeholders
 * @param replacements - Mapping des remplacements
 * @returns Texte avec données originales restaurées
 */
export function unsanitize(text: string, replacements: Record<string, string>): string {
  let result = text;
  
  for (const [placeholder, original] of Object.entries(replacements)) {
    result = result.replace(new RegExp(escapeRegExp(placeholder), 'g'), original);
  }
  
  return result;
}

/**
 * Échappe les caractères spéciaux pour regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Vérifie si un texte contient des données sensibles non anonymisées
 * @param text - Texte à vérifier
 * @returns true si des données sensibles sont détectées
 */
export function containsSensitiveData(text: string): boolean {
  for (const pattern of PATTERNS) {
    if (pattern.regex.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Anonymise spécifiquement les données structurées (JSON)
 * @param data - Objet à anonymiser
 * @returns Objet anonymisé + mapping
 */
export function sanitizeStructuredData(data: any): { sanitizedData: any; replacements: Record<string, string> } {
  const jsonString = JSON.stringify(data, null, 2);
  const { sanitizedText, replacements } = sanitizeForLLM(jsonString);
  
  try {
    const sanitizedData = JSON.parse(sanitizedText);
    return { sanitizedData, replacements };
  } catch (error) {
    // Fallback si le JSON est cassé après anonymisation
    return { sanitizedData: data, replacements };
  }
}

