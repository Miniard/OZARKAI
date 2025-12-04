/**
 * Règles comptables selon le type d'entreprise
 */

export type CompanyType =
  | 'MICRO_ENTREPRISE'
  | 'EURL'
  | 'SARL'
  | 'SAS'
  | 'SASU'
  | 'SA'
  | 'SNC'
  | 'ASSOCIATION'
  | 'PROFESSION_LIBERALE';

export type VATRegime = 'FRANCHISE_BASE' | 'REEL_SIMPLIFIE' | 'REEL_NORMAL' | 'MINI_REEL';

export interface AccountingRules {
  // TVA
  canRecoverVAT: boolean;
  vatRates: number[];
  vatDeclarationFrequency: 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE' | 'AUCUNE';

  // Seuils
  thresholds: {
    microEnterprise?: { services: number; goods: number };
    vatFranchise?: { services: number; goods: number };
  };

  // Comptabilité
  accountingType: 'SIMPLIFIEE' | 'ENGAGEMENTS' | 'TRESORERIE';
  requiredBooks: string[];

  // Déductions
  deductibleExpenses: {
    meals: number; // Pourcentage déductible
    vehicle: boolean;
    homeOffice: boolean;
  };

  // Messages informatifs
  warnings: string[];
  tips: string[];
}

/**
 * Récupère les règles comptables selon le type d'entreprise et régime TVA
 */
export function getAccountingRules(
  companyType: CompanyType,
  vatRegime: VATRegime
): AccountingRules {
  const baseRules: AccountingRules = {
    canRecoverVAT: false,
    vatRates: [20, 10, 5.5, 2.1],
    vatDeclarationFrequency: 'AUCUNE',
    thresholds: {},
    accountingType: 'TRESORERIE',
    requiredBooks: [],
    deductibleExpenses: {
      meals: 70,
      vehicle: false,
      homeOffice: false,
    },
    warnings: [],
    tips: [],
  };

  // Règles spécifiques selon le type d'entreprise
  switch (companyType) {
    case 'MICRO_ENTREPRISE':
      return {
        ...baseRules,
        canRecoverVAT: false,
        vatDeclarationFrequency: 'AUCUNE',
        thresholds: {
          microEnterprise: {
            services: 77_700, // Seuils 2024
            goods: 188_700,
          },
          vatFranchise: {
            services: 36_800,
            goods: 91_900,
          },
        },
        accountingType: 'TRESORERIE',
        requiredBooks: ['Livre des recettes'],
        deductibleExpenses: {
          meals: 0, // Pas de déduction en micro
          vehicle: false,
          homeOffice: false,
        },
        warnings: [
          '⚠️ Vous ne pouvez PAS récupérer la TVA en micro-entreprise',
          '⚠️ Vos achats TTC ne sont pas déductibles',
          '⚠️ Respectez les seuils de CA pour rester en micro',
        ],
        tips: [
          '💡 Si vous dépassez les seuils, passez au régime réel pour récupérer la TVA',
          '💡 Tenez un livre des recettes à jour',
          '💡 Conservez toutes vos factures (obligation légale)',
        ],
      };

    case 'EURL':
    case 'SARL':
    case 'SAS':
    case 'SASU':
      const isVATExempt = vatRegime === 'FRANCHISE_BASE';
      const declarationFreq =
        vatRegime === 'REEL_NORMAL' ? 'MENSUELLE' : vatRegime === 'REEL_SIMPLIFIE' ? 'ANNUELLE' : 'AUCUNE';

      return {
        ...baseRules,
        canRecoverVAT: !isVATExempt,
        vatDeclarationFrequency: declarationFreq,
        accountingType: 'ENGAGEMENTS',
        requiredBooks: ['Grand livre', 'Journal', 'Balance', 'Bilan annuel', 'Compte de résultat'],
        deductibleExpenses: {
          meals: 70, // 70% déductibles
          vehicle: true, // VU et électriques uniquement
          homeOffice: true,
        },
        warnings: isVATExempt
          ? [
              '⚠️ Vous êtes en franchise de TVA, vous ne récupérez pas la TVA',
              '⚠️ Vous ne facturez pas de TVA (mention obligatoire sur factures)',
            ]
          : [
              '✅ Vous pouvez récupérer la TVA sur vos achats professionnels',
              `⏰ Déclaration de TVA ${declarationFreq.toLowerCase()}`,
            ],
        tips: [
          '💡 Conservez toutes vos factures (obligation 10 ans)',
          '💡 Utilisez un compte bancaire professionnel',
          '💡 Faites appel à un expert-comptable pour la certification des comptes',
          canRecoverVAT
            ? '💡 Pensez à récupérer la TVA sur tous vos achats pros'
            : '💡 Optez pour le régime réel si vous avez beaucoup d\'achats',
        ],
      };

    case 'PROFESSION_LIBERALE':
      return {
        ...baseRules,
        canRecoverVAT: vatRegime !== 'FRANCHISE_BASE',
        vatDeclarationFrequency: vatRegime === 'REEL_NORMAL' ? 'MENSUELLE' : 'ANNUELLE',
        accountingType: 'TRESORERIE',
        requiredBooks: ['Livre-journal des recettes et dépenses', 'Registre des immobilisations'],
        deductibleExpenses: {
          meals: 70,
          vehicle: true,
          homeOffice: true,
        },
        warnings: [
          '⚠️ Déclarez vos revenus en BNC (Bénéfices Non Commerciaux)',
          vatRegime === 'FRANCHISE_BASE'
            ? '⚠️ Franchise de TVA : pas de récupération'
            : '✅ Régime réel : récupération de TVA possible',
        ],
        tips: [
          '💡 Adhérez à une AGA (Association de Gestion Agréée) pour éviter la majoration',
          '💡 Déduisez vos frais de formation professionnelle',
          '💡 Les cotisations sociales sont déductibles',
        ],
      };

    case 'ASSOCIATION':
      return {
        ...baseRules,
        canRecoverVAT: false,
        vatDeclarationFrequency: 'AUCUNE',
        accountingType: 'TRESORERIE',
        requiredBooks: ['Livre des recettes et dépenses', 'Bilan annuel (si subventions)'],
        deductibleExpenses: {
          meals: 0,
          vehicle: false,
          homeOffice: false,
        },
        warnings: [
          '⚠️ Les associations ne récupèrent généralement pas la TVA',
          '⚠️ Sauf si activité commerciale soumise à TVA',
        ],
        tips: [
          '💡 Tenez une comptabilité rigoureuse pour vos adhérents',
          '💡 Conservez les justificatifs de subventions',
          '💡 Faites certifier vos comptes si > 153 000 € de subventions',
        ],
      };

    default:
      return baseRules;
  }
}

/**
 * Calcule la TVA récupérable selon les règles de l'entreprise
 */
export function calculateRecoverableVAT(
  amount: number,
  vatAmount: number,
  category: string,
  companyType: CompanyType,
  vatRegime: VATRegime
): number {
  const rules = getAccountingRules(companyType, vatRegime);

  if (!rules.canRecoverVAT) {
    return 0; // Pas de récupération de TVA
  }

  // Cas particuliers
  if (category.includes('6257') || category.toLowerCase().includes('restaurant')) {
    // Restaurants : 70% récupérable
    return vatAmount * 0.7;
  }

  if (category.includes('6061') && category.toLowerCase().includes('gazole')) {
    // Gazole : 80% récupérable
    return vatAmount * 0.8;
  }

  if (category.includes('6061') && category.toLowerCase().includes('essence')) {
    // Essence : 0% récupérable
    return 0;
  }

  // Par défaut : 100% récupérable
  return vatAmount;
}

/**
 * Vérifie si un type de dépense est déductible
 */
export function isExpenseDeductible(
  category: string,
  companyType: CompanyType,
  vatRegime: VATRegime
): { deductible: boolean; percentage: number; explanation: string } {
  const rules = getAccountingRules(companyType, vatRegime);

  // Repas
  if (category.includes('6257') || category.toLowerCase().includes('restaurant')) {
    return {
      deductible: rules.deductibleExpenses.meals > 0,
      percentage: rules.deductibleExpenses.meals,
      explanation: `Les frais de repas sont déductibles à ${rules.deductibleExpenses.meals}%`,
    };
  }

  // Véhicule
  if (category.includes('6181') || category.toLowerCase().includes('véhicule')) {
    return {
      deductible: rules.deductibleExpenses.vehicle,
      percentage: rules.deductibleExpenses.vehicle ? 100 : 0,
      explanation: rules.deductibleExpenses.vehicle
        ? 'Déductible si véhicule utilitaire ou électrique'
        : 'Non déductible (véhicule de tourisme)',
    };
  }

  // Par défaut : déductible à 100%
  return {
    deductible: true,
    percentage: 100,
    explanation: 'Dépense professionnelle déductible',
  };
}

