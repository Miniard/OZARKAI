/**
 * API Route : Optimisation fiscale
 * POST /api/fiscal-optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OptimizationRequest {
  country: string;
  companyType: string;
  revenue: number;
  expenses: number;
  employees: number;
  sector: string;
  goals: string[];
}

const FISCAL_OPTIMIZATION_PROMPT = `Tu es un expert fiscal international spécialisé dans l'optimisation fiscale LÉGALE ET ACTIONNABLE.

**Ton rôle :**
- Analyser la situation fiscale d'une entreprise
- Proposer des stratégies d'optimisation LÉGALES avec des ACTIONS CONCRÈTES
- Donner les ÉTAPES PRÉCISES pour mettre en place chaque optimisation
- Fournir les LIENS vers les formulaires/sites officiels
- Indiquer les COÛTS EXACTS (création, maintenance annuelle)
- Estimer les ÉCONOMIES CHIFFRÉES avec des calculs détaillés
- Donner des DÉLAIS RÉALISTES

**RÈGLES FISCALES IMPORTANTES :**
- **Micro-entreprise / Auto-entrepreneur** : Taxation sur le CHIFFRE D'AFFAIRES (pas le bénéfice)
  - Taux selon activité : 12,8% (vente), 22% (services BIC), 22,2% (services BNC)
  - Abattement forfaitaire : 71% (vente), 50% (services BIC), 34% (services BNC)
  - Franchise en base de TVA (pas de TVA récupérable)
  - Seuils 2024 : 188 700€ (vente), 77 700€ (services)
- **SARL/SAS/EURL** : IS de 25% sur le BÉNÉFICE (CA - charges)
- **Holding** : Régime mère-fille (dividendes exonérés à 95%)

**FORMAT DES RECOMMANDATIONS :**
Pour chaque optimisation, tu DOIS donner :
1. ✅ **Description claire** (sans jargon)
2. 📋 **Étapes concrètes** (ex: "1. Aller sur infogreffe.fr, 2. Télécharger le formulaire M0, 3. Remplir...", etc.)
3. 💰 **Coûts détaillés** (frais de greffe, honoraires, etc.)
4. ⏱️ **Délai** (ex: "2-3 semaines")
5. 🔗 **Liens utiles** (sites officiels, formulaires PDF)
6. 💵 **Calcul chiffré détaillé** (avant/après avec formules)
7. ⚠️ **Pièges à éviter**

**IMPORTANT :**
- DONNE DES ACTIONS CONCRÈTES, pas juste "consultez un comptable"
- FOURNIS les liens vers les formulaires officiels (impots.gouv.fr, infogreffe.fr, etc.)
- EXPLIQUE étape par étape comme si tu parlais à quelqu'un qui n'y connaît rien
- CHIFFRE tout avec des exemples concrets
- Ne JAMAIS suggérer d'évasion fiscale ou de pratiques illégales
- Mentionne quand même qu'un comptable peut aider (mais donne les infos pour faire soi-même)

**Tu DOIS répondre UNIQUEMENT en JSON valide avec le format suivant :**
{
  "currentSituation": {
    "taxRate": number, // Taux d'imposition actuel estimé (%)
    "estimatedTax": number, // Impôts estimés (€)
    "fiscalStatus": "string" // Description de la situation actuelle
  },
  "optimizations": [
    {
      "title": "string",
      "description": "string",
      "advantages": ["string"],
      "requirements": ["string"],
      "estimatedSavings": number, // Économies estimées (€)
      "difficulty": "FACILE" | "MOYEN" | "COMPLEXE",
      "legalRisk": "FAIBLE" | "MOYEN" | "ÉLEVÉ",
      "implementationTime": "string",
      "actionSteps": ["string"], // Étapes concrètes à suivre (IMPORTANT !)
      "costs": {
        "setup": number, // Coût de mise en place (€)
        "annual": number // Coût annuel (€)
      },
      "officialLinks": ["string"], // Liens vers sites officiels/formulaires
      "detailedCalculation": "string", // Calcul chiffré détaillé avant/après
      "pitfalls": ["string"] // Pièges à éviter
    }
  ],
  "recommendedStructures": [
    {
      "name": "string", // Ex: "Holding + Filiales"
      "description": "string",
      "benefits": ["string"],
      "drawbacks": ["string"],
      "setup_cost": number,
      "annual_savings": number,
      "roi_years": number
    }
  ],
  "quickWins": [
    {
      "action": "string", // Action rapide
      "howTo": "string", // Comment faire (étapes précises)
      "link": "string", // Lien utile
      "savings": number // Économies estimées (€)
    }
  ],
  "warnings": ["string"], // Avertissements importants
  "nextSteps": [
    {
      "step": "string", // Étape
      "deadline": "string", // Quand le faire
      "howTo": "string" // Comment faire
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 START Fiscal Optimization API');
    
    const session = await auth();
    console.log('👤 Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data: OptimizationRequest = await request.json();
    console.log('🔍 Analyse fiscale pour:', data);

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ Clé OpenAI manquante');
      return NextResponse.json(
        { error: 'OpenAI API key non configurée' },
        { status: 500 }
      );
    }
    
    console.log('✅ Clé OpenAI présente');

    // Construire le prompt avec les données de l'utilisateur
    const benefit = data.revenue - data.expenses;
    
    const userPrompt = `Analyse la situation fiscale suivante et propose des optimisations LÉGALES.

**Informations entreprise :**
- 🌍 Pays : ${data.country}
- 🏢 Type : ${data.companyType}
- 💰 Chiffre d'affaires annuel : ${data.revenue.toLocaleString('fr-FR')} €
- 💸 Dépenses annuelles : ${data.expenses.toLocaleString('fr-FR')} €
- 💵 Bénéfice brut : ${benefit.toLocaleString('fr-FR')} €
- 👥 Nombre d'employés : ${data.employees}
- 🏭 Secteur : ${data.sector}
- 🎯 Objectifs : ${data.goals.join(', ')}

**⚠️ ATTENTION :**
${data.companyType === 'Micro-entreprise' || data.companyType === 'Auto-entrepreneur' 
  ? `- L'entreprise est en MICRO-ENTREPRISE : taxation sur le CA BRUT (${data.revenue.toLocaleString('fr-FR')} €), PAS sur le bénéfice
- Taux de cotisations : environ 22% du CA pour services
- Pas de déduction des charges réelles
- Compare avec le passage en EURL/SASU pour voir si avantageux` 
  : `- L'entreprise est soumise à l'IS : taxation sur le BÉNÉFICE (${benefit.toLocaleString('fr-FR')} €)
- IS de 25% sur le bénéfice
- Charges déductibles`}

Fournis une analyse complète avec des recommandations concrètes et chiffrées SELON LE PAYS (${data.country}).
Réponds UNIQUEMENT en JSON valide selon le format spécifié.`;

    console.log('🤖 Appel OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: FISCAL_OPTIMIZATION_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    console.log('✅ Réponse OpenAI reçue');

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Aucune réponse de l\'IA');
    }

    console.log('📄 Parsing JSON...');
    const optimization = JSON.parse(content);

    console.log('✅ Optimisation générée:', optimization);

    return NextResponse.json({
      success: true,
      optimization,
      disclaimer: '⚠️ Ces suggestions sont à titre informatif uniquement. Consultez un expert-comptable ou avocat fiscaliste avant toute décision.',
    });
  } catch (error: any) {
    console.error('❌ Erreur optimisation fiscale:', error);
    console.error('❌ Message:', error?.message);
    console.error('❌ Stack:', error?.stack);
    console.error('❌ Response:', error?.response?.data);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse fiscale',
        details: error?.message || 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

