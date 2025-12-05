/**
 * Intelligence avancée pour calculs comptables détaillés
 */

interface CompanyFinancialData {
  companyType: string;
  vatRegime: string;
  revenue: number;
  expenses: number;
  documents: Array<{
    type: string;
    amount: number;
    date: Date;
  }>;
}

export function calculateTaxProvision(data: CompanyFinancialData): {
  estimatedTax: number;
  calculation: string;
  monthlyProvision: number;
  breakdown: Array<{ label: string; amount: number }>;
} {
  const { companyType, revenue, expenses } = data;
  const profit = revenue - expenses;

  let estimatedTax = 0;
  let calculation = '';
  const breakdown: Array<{ label: string; amount: number }> = [];

  if (companyType === 'MICRO_ENTREPRISE') {
    // Micro-entreprise : taxé sur le CA, pas le bénéfice
    const taxRate = 0.22; // 22% pour les prestations de services (forfait libératoire)
    estimatedTax = revenue * taxRate;
    
    calculation = `**Micro-entreprise - Forfait libératoire**

• Chiffre d'affaires : ${revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
• Taux forfaitaire : ${(taxRate * 100)}%
• **Impôt estimé : ${estimatedTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**

⚠️ En micro-entreprise, vous êtes taxé sur le CA brut, pas sur le bénéfice.
Vos charges ne sont pas déductibles.

💡 **Conseil :** Provisionnez ${(estimatedTax / 12).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/mois sur un compte épargne.`;

    breakdown.push({
      label: 'Impôt forfaitaire (22%)',
      amount: estimatedTax,
    });
  } else if (companyType === 'SARL' || companyType === 'EURL' || companyType === 'SAS' || companyType === 'SASU') {
    // Impôt sur les sociétés
    let isTax = 0;
    
    if (profit <= 42500) {
      // Taux réduit 15%
      isTax = profit * 0.15;
      calculation = `**Impôt sur les Sociétés (IS)**

• Bénéfice imposable : ${profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
• Votre bénéfice ≤ 42 500€ → **Taux réduit 15%**
• IS à payer : ${isTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}

**Calcul détaillé :**
${profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} × 15% = ${isTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`;
      
      breakdown.push({
        label: 'IS (15%)',
        amount: isTax,
      });
    } else {
      // IS mixte
      const lowRatePart = 42500 * 0.15;
      const highRatePart = (profit - 42500) * 0.25;
      isTax = lowRatePart + highRatePart;
      
      calculation = `**Impôt sur les Sociétés (IS) - Taux mixte**

• Bénéfice imposable : ${profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}

**Calcul détaillé :**
• 1ère tranche (0 - 42 500€) à 15% : ${lowRatePart.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
• 2ème tranche (${(profit - 42500).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) à 25% : ${highRatePart.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}

**Total IS : ${isTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**`;
      
      breakdown.push({
        label: 'IS tranche 15%',
        amount: lowRatePart,
      });
      breakdown.push({
        label: 'IS tranche 25%',
        amount: highRatePart,
      });
    }

    // Cotisations sociales pour le gérant
    const socialContributions = profit * 0.45; // Environ 45% pour un gérant majoritaire
    
    calculation += `

**Cotisations Sociales (gérant majoritaire)**
• Base : Rémunération (estimée à ${profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})
• Taux moyen : ~45%
• **Cotisations estimées : ${socialContributions.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**

**TOTAL à provisionner : ${(isTax + socialContributions).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**

💡 **Conseil :** Provisionnez ${((isTax + socialContributions) / 12).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/mois.`;

    breakdown.push({
      label: 'Cotisations sociales (~45%)',
      amount: socialContributions,
    });

    estimatedTax = isTax + socialContributions;
  }

  return {
    estimatedTax,
    calculation,
    monthlyProvision: estimatedTax / 12,
    breakdown,
  };
}

export function analyzeCashflow(data: CompanyFinancialData): {
  currentCashflow: number;
  trend: 'positive' | 'negative' | 'stable';
  recommendation: string;
  details: string;
} {
  const { revenue, expenses } = data;
  const cashflow = revenue - expenses;
  const margin = revenue > 0 ? (cashflow / revenue) * 100 : 0;

  let trend: 'positive' | 'negative' | 'stable' = 'stable';
  let recommendation = '';
  let details = '';

  if (margin > 40) {
    trend = 'positive';
    recommendation = '✅ **Excellente santé financière !** Profitez-en pour investir dans la croissance ou constituer une réserve de sécurité.';
    details = `Votre marge nette est de ${margin.toFixed(1)}%, ce qui est excellent. Vous générez ${cashflow.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de trésorerie.`;
  } else if (margin > 20) {
    trend = 'positive';
    recommendation = '👍 **Bonne santé financière.** Continuez sur cette lancée et surveillez vos charges.';
    details = `Votre marge nette est de ${margin.toFixed(1)}%, ce qui est sain. Vous générez ${cashflow.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de trésorerie.`;
  } else if (margin > 10) {
    trend = 'stable';
    recommendation = '⚠️ **Marge correcte mais attention.** Cherchez des moyens d\'augmenter vos revenus ou de réduire vos charges.';
    details = `Votre marge nette est de ${margin.toFixed(1)}%. Vous générez ${cashflow.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}, mais c'est juste. Améliorez votre rentabilité.`;
  } else if (margin > 0) {
    trend = 'negative';
    recommendation = '🚨 **Marge faible - Action requise !** Augmentez vos prix, réduisez vos coûts, ou optimisez votre mix produits/services.';
    details = `Votre marge nette n'est que de ${margin.toFixed(1)}%. Vous générez seulement ${cashflow.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de trésorerie. C'est trop faible pour être viable.`;
  } else {
    trend = 'negative';
    recommendation = `🚨 **ALERTE : Trésorerie négative !** Vos dépenses dépassent vos revenus de ${Math.abs(cashflow).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}. Agissez IMMÉDIATEMENT.`;
    details = `Vous êtes en déficit de ${Math.abs(cashflow).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}. Réduisez drastiquement vos charges ou augmentez rapidement vos revenus.`;
  }

  return {
    currentCashflow: cashflow,
    trend,
    recommendation,
    details,
  };
}

export function calculateVATDeclaration(data: CompanyFinancialData): {
  vatCollected: number;
  vatDeductible: number;
  vatDue: number;
  explanation: string;
  dueDate: string;
} {
  const { vatRegime, documents } = data;

  if (vatRegime === 'FRANCHISE_BASE') {
    return {
      vatCollected: 0,
      vatDeductible: 0,
      vatDue: 0,
      explanation: '✅ Vous êtes en **franchise en base de TVA**. Vous ne collectez pas de TVA et ne pouvez pas la déduire. Aucune déclaration de TVA à faire.',
      dueDate: 'N/A',
    };
  }

  // Calculer TVA collectée et déductible
  let vatCollected = 0;
  let vatDeductible = 0;

  documents.forEach(doc => {
    const vatAmount = doc.amount * 0.2; // Simplifié : 20% de TVA
    
    if (doc.type === 'FACTURE_VENTE') {
      vatCollected += vatAmount;
    } else if (doc.type === 'FACTURE_ACHAT' || doc.type === 'NOTE_FRAIS') {
      vatDeductible += vatAmount;
    }
  });

  const vatDue = vatCollected - vatDeductible;

  const now = new Date();
  let dueDate = '';
  
  if (vatRegime === 'REEL_NORMAL') {
    // Déclaration mensuelle
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 19);
    dueDate = nextMonth.toLocaleDateString('fr-FR');
  } else if (vatRegime === 'REEL_SIMPLIFIE') {
    // Déclaration annuelle
    const nextYear = new Date(now.getFullYear() + 1, 4, 2); // 2 mai
    dueDate = nextYear.toLocaleDateString('fr-FR');
  }

  const explanation = `**Déclaration de TVA - ${vatRegime === 'REEL_NORMAL' ? 'Régime Réel Normal' : 'Régime Réel Simplifié'}**

**TVA Collectée :** ${vatCollected.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
(TVA facturée à vos clients)

**TVA Déductible :** ${vatDeductible.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
(TVA payée sur vos achats professionnels)

**TVA à payer :** ${vatDue > 0 ? vatDue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0€'}
${vatDue < 0 ? `\n**Crédit de TVA :** ${Math.abs(vatDue).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} (remboursable)` : ''}

📅 **Échéance :** ${dueDate}

💡 ${vatDue > 0 ? 'Provisionnez cette somme pour le paiement.' : 'Vous pouvez demander un remboursement de votre crédit de TVA.'}`;

  return {
    vatCollected,
    vatDeductible,
    vatDue,
    explanation,
    dueDate,
  };
}

export function generateAdvancedContext(data: CompanyFinancialData): string {
  const taxProvision = calculateTaxProvision(data);
  const cashflow = analyzeCashflow(data);
  const vat = calculateVATDeclaration(data);

  return `**CONTEXTE FINANCIER DÉTAILLÉ**

**Type d'entreprise :** ${data.companyType}
**Régime TVA :** ${data.vatRegime}

**Chiffres clés :**
• CA : ${data.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
• Charges : ${data.expenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
• Trésorerie : ${cashflow.currentCashflow.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}

**Provisions fiscales recommandées :**
• Impôts/cotisations estimés : ${taxProvision.estimatedTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
• À provisionner par mois : ${taxProvision.monthlyProvision.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}

**TVA :**
• TVA à reverser : ${vat.vatDue > 0 ? vat.vatDue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0€'}
${vat.vatDue < 0 ? `• Crédit de TVA : ${Math.abs(vat.vatDue).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : ''}

Utilise ces informations pour répondre de manière précise et détaillée aux questions comptables.`;
}

