/**
 * Définition des plans d'abonnement Komptal
 */

export const PLAN_LIMITS = {
  STARTER: {
    name: 'Starter',
    price: 0,
    currency: 'EUR',
    interval: 'gratuit',
    features: [
      '✅ 1 entreprise',
      '✅ Upload illimité de factures',
      '✅ Analyse IA basique',
      '✅ Chat comptable IA (10 messages/mois)',
      '✅ Dashboard simplifié',
      '✅ Catégorisation automatique',
      '❌ Bilan comptable détaillé',
      '❌ Optimisation fiscale avancée',
      '❌ Export comptable (FEC, PDF)',
      '❌ Multi-utilisateurs',
      '❌ Support prioritaire',
    ],
    limits: {
      maxCompanies: 1,
      maxDocumentsPerMonth: 50,
      maxChatMessages: 10,
      canExport: false,
      canAccessBilan: false,
      canAccessFiscalOptimization: false,
      canAddUsers: false,
    },
  },
  PREMIUM: {
    name: 'Premium',
    price: 29,
    currency: 'EUR',
    interval: 'mois',
    features: [
      '✅ Entreprises illimitées',
      '✅ Upload illimité de factures',
      '✅ Analyse IA avancée (OpenAI GPT-4)',
      '✅ Chat comptable IA illimité',
      '✅ Dashboard complet avec graphiques',
      '✅ Catégorisation automatique intelligente',
      '✅ Bilan comptable détaillé',
      '✅ Optimisation fiscale IA (holdings, structures)',
      '✅ Export comptable (FEC, Excel, PDF)',
      '✅ Multi-utilisateurs (5 max)',
      '✅ Historique illimité',
      '✅ Support prioritaire (24h)',
    ],
    limits: {
      maxCompanies: Infinity,
      maxDocumentsPerMonth: Infinity,
      maxChatMessages: Infinity,
      canExport: true,
      canAccessBilan: true,
      canAccessFiscalOptimization: true,
      canAddUsers: true,
      maxUsers: 5,
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof PLAN_LIMITS;

/**
 * Vérifie si un utilisateur peut accéder à une fonctionnalité
 */
export function canAccessFeature(
  userPlan: SubscriptionPlan,
  feature: keyof typeof PLAN_LIMITS.STARTER.limits
): boolean {
  return PLAN_LIMITS[userPlan].limits[feature] as boolean;
}

/**
 * Obtient la limite pour une fonctionnalité
 */
export function getLimit(
  userPlan: SubscriptionPlan,
  limit: keyof typeof PLAN_LIMITS.STARTER.limits
): number | boolean {
  return PLAN_LIMITS[userPlan].limits[limit];
}

/**
 * Vérifie si un utilisateur a atteint sa limite pour une ressource
 */
export function hasReachedLimit(
  userPlan: SubscriptionPlan,
  limitKey: 'maxCompanies' | 'maxDocumentsPerMonth' | 'maxChatMessages',
  currentCount: number
): boolean {
  const limit = PLAN_LIMITS[userPlan].limits[limitKey];
  if (limit === Infinity) return false;
  return currentCount >= (limit as number);
}

