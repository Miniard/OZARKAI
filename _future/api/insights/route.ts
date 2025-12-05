/**
 * API Route pour générer des insights comptables intelligents
 * Analyse les factures et détecte les anomalies comme Marty Byrde
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

interface Insight {
  type: 'warning' | 'success' | 'info' | 'tip' | 'suspect';
  title: string;
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  amount?: number;
  suggestion?: string;
  documents?: string[];
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur a accès à cette entreprise
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer tous les documents
    const documents = await prisma.document.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
    });

    if (documents.length === 0) {
      return NextResponse.json({ insights: [] });
    }

    const insights: Insight[] = [];

    // Séparer revenus et dépenses
    const revenues = documents.filter(d => d.docType === 'FACTURE_VENTE');
    const expenses = documents.filter(d => d.docType === 'FACTURE_ACHAT' || d.docType === 'NOTE_FRAIS');

    const totalRevenue = revenues.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalTVA = documents.reduce((sum, d) => sum + (d.vat || 0), 0);

    // ==========================================
    // 1. ANALYSE DES MONTANTS SUSPECTS
    // ==========================================
    
    // Calculer la moyenne et l'écart-type des revenus
    if (revenues.length > 0) {
      const avgRevenue = totalRevenue / revenues.length;
      const revenueStdDev = Math.sqrt(
        revenues.reduce((sum, d) => sum + Math.pow((d.amount || 0) - avgRevenue, 2), 0) / revenues.length
      );

      // Détecter les revenus anormalement élevés (> 2.5 écarts-types)
      const suspiciousRevenues = revenues.filter(d => d.amount && d.amount > avgRevenue + 2.5 * revenueStdDev);
      
      if (suspiciousRevenues.length > 0) {
        suspiciousRevenues.forEach(doc => {
          if (!doc.amount) return;
          const percentAboveAvg = ((doc.amount - avgRevenue) / avgRevenue * 100).toFixed(0);
          insights.push({
            type: 'suspect',
            severity: doc.amount > avgRevenue + 3 * revenueStdDev ? 'critical' : 'high',
            title: `💰 Revenu inhabituel détecté`,
            message: `La facture "${doc.supplier || 'Sans nom'}" (${doc.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) est ${percentAboveAvg}% au-dessus de votre moyenne. Cela mérite une vérification.`,
            amount: doc.amount,
            suggestion: `Vérifiez que cette facture correspond bien à une prestation réelle. Si c'est un gros contrat ponctuel, c'est normal. Sinon, assurez-vous qu'il n'y a pas d'erreur de saisie.`,
            documents: [doc.id],
          });
        });
      }
    }

    // Analyser les dépenses
    if (expenses.length > 0) {
      const avgExpense = totalExpenses / expenses.length;
      const expenseStdDev = Math.sqrt(
        expenses.reduce((sum, d) => sum + Math.pow((d.amount || 0) - avgExpense, 2), 0) / expenses.length
      );

      const suspiciousExpenses = expenses.filter(d => d.amount && d.amount > avgExpense + 2.5 * expenseStdDev);
      
      if (suspiciousExpenses.length > 0) {
        suspiciousExpenses.forEach(doc => {
          if (!doc.amount) return;
          const percentAboveAvg = ((doc.amount - avgExpense) / avgExpense * 100).toFixed(0);
          insights.push({
            type: 'warning',
            severity: doc.amount > avgExpense + 3 * expenseStdDev ? 'high' : 'medium',
            title: `🔍 Dépense importante détectée`,
            message: `La dépense "${doc.supplier || 'Sans nom'}" (${doc.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) est ${percentAboveAvg}% au-dessus de votre moyenne habituelle.`,
            amount: doc.amount,
            suggestion: `Vérifiez que cette dépense est justifiée et correctement catégorisée. Conservez bien le justificatif en cas de contrôle.`,
            documents: [doc.id],
          });
        });
      }
    }

    // ==========================================
    // 2. DÉTECTION DE DOUBLONS POTENTIELS
    // ==========================================
    
    const duplicateGroups = new Map<string, typeof documents>();
    
    documents.forEach(doc => {
      // Créer une clé basée sur montant + date + fournisseur
      // Vérifier que les données existent avant de les utiliser
      if (doc.amount && doc.date) {
        const key = `${doc.amount}_${doc.date.toISOString().split('T')[0]}_${doc.supplier || 'unknown'}`;
        const existing = duplicateGroups.get(key) || [];
        duplicateGroups.set(key, [...existing, doc]);
      }
    });

    duplicateGroups.forEach(group => {
      if (group.length > 1 && group[0].date && group[0].amount) {
        insights.push({
          type: 'suspect',
          severity: 'critical',
          title: `⚠️ Possible doublon détecté`,
          message: `${group.length} factures identiques trouvées : ${group[0].supplier || 'Sans nom'} - ${group[0].amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} le ${group[0].date.toLocaleDateString('fr-FR')}`,
          amount: group[0].amount * group.length,
          suggestion: `Vérifiez immédiatement ces documents. Si ce sont des doublons, supprimez-les pour éviter de fausser votre comptabilité. Utilisez le bouton "🧹 Nettoyer" dans l'onglet factures.`,
          documents: group.map(d => d.id),
        });
      }
    });

    // ==========================================
    // 3. ANALYSE DES RATIOS
    // ==========================================
    
    if (totalRevenue > 0 && totalExpenses > 0) {
      const expenseRatio = (totalExpenses / totalRevenue) * 100;

      if (expenseRatio > 90) {
        insights.push({
          type: 'warning',
          severity: 'high',
          title: `📊 Taux de dépenses très élevé`,
          message: `Vos dépenses représentent ${expenseRatio.toFixed(1)}% de vos revenus. Votre marge est très faible (${(100 - expenseRatio).toFixed(1)}%).`,
          suggestion: `Analysez vos charges et identifiez où vous pouvez réduire les coûts. Un ratio sain se situe généralement entre 60-70% selon votre secteur.`,
        });
      } else if (expenseRatio > 75) {
        insights.push({
          type: 'warning',
          severity: 'medium',
          title: `💸 Attention à vos dépenses`,
          message: `Vos dépenses représentent ${expenseRatio.toFixed(1)}% de vos revenus. Votre marge est de ${(100 - expenseRatio).toFixed(1)}%.`,
          suggestion: `Surveillez vos charges, surtout si vous êtes en croissance. Essayez de négocier avec vos fournisseurs pour améliorer votre marge.`,
        });
      } else if (expenseRatio < 30) {
        insights.push({
          type: 'info',
          title: `🎯 Excellente rentabilité`,
          message: `Vos dépenses ne représentent que ${expenseRatio.toFixed(1)}% de vos revenus. Votre marge est excellente (${(100 - expenseRatio).toFixed(1)}%).`,
        });
      } else if (expenseRatio >= 30 && expenseRatio <= 60) {
        insights.push({
          type: 'success',
          title: `✅ Ratio dépenses/revenus sain`,
          message: `Vos dépenses représentent ${expenseRatio.toFixed(1)}% de vos revenus. Votre marge de ${(100 - expenseRatio).toFixed(1)}% est dans la norme pour une entreprise saine.`,
        });
      }
    }

    // ==========================================
    // 4. ANALYSE DE LA TVA
    // ==========================================
    
    if (company.vatRegime === 'REEL_NORMAL' || company.vatRegime === 'REEL_SIMPLIFIE') {
      const tvaCollectee = revenues.reduce((sum, d) => sum + (d.vat || 0), 0);
      const tvaDeductible = expenses.reduce((sum, d) => sum + (d.vat || 0), 0);
      const tvaDue = tvaCollectee - tvaDeductible;

      if (tvaDue > 0) {
        insights.push({
          type: 'info',
          title: `🏛️ TVA à reverser`,
          message: `Vous devez reverser ${tvaDue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de TVA (collectée: ${tvaCollectee.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}, déductible: ${tvaDeductible.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}).`,
          amount: tvaDue,
        });
      } else if (tvaDue < 0) {
        insights.push({
          type: 'tip',
          title: `💡 Crédit de TVA`,
          message: `Vous avez un crédit de TVA de ${Math.abs(tvaDue).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}. Vous pouvez demander un remboursement.`,
          amount: Math.abs(tvaDue),
          suggestion: `Faites une demande de remboursement de crédit de TVA auprès de l'administration fiscale via votre déclaration.`,
        });
      }
    }

    // ==========================================
    // 5. ANALYSE TEMPORELLE
    // ==========================================
    
    // Vérifier les factures récentes
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentDocs = documents.filter(d => d.date && d.date >= last30Days);

    if (recentDocs.length === 0 && documents.length > 0) {
      insights.push({
        type: 'warning',
        severity: 'medium',
        title: `⏰ Aucune activité récente`,
        message: `Aucun document n'a été enregistré ces 30 derniers jours. Pensez à mettre à jour votre comptabilité régulièrement.`,
        suggestion: `Une comptabilité à jour facilite le suivi de votre trésorerie et évite les mauvaises surprises. Uploadez vos factures dès réception.`,
      });
    }

    // ==========================================
    // 6. VALIDATION GÉNÉRALE
    // ==========================================
    
    if (documents.length >= 5 && insights.filter(i => i.type === 'suspect' || i.severity === 'critical').length === 0) {
      insights.push({
        type: 'success',
        title: `✅ Comptabilité régulière`,
        message: `Aucune anomalie majeure détectée sur ${documents.length} documents analysés. Votre comptabilité semble bien tenue.`,
      });
    }

    // ==========================================
    // 7. CONSEILS CONTEXTUELS
    // ==========================================
    
    if (company.companyType === 'MICRO_ENTREPRISE') {
      const currentYear = new Date().getFullYear();
      const currentYearRevenue = revenues
        .filter(d => d.date && d.date.getFullYear() === currentYear)
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      // Seuils micro-entreprise (prestations de services)
      const threshold = 77700; // Seuil 2024 pour prestations

      if (currentYearRevenue > threshold * 0.8) {
        insights.push({
          type: 'warning',
          severity: 'high',
          title: `⚠️ Attention aux plafonds`,
          message: `Vous avez déjà atteint ${((currentYearRevenue / threshold) * 100).toFixed(0)}% du plafond de la micro-entreprise (${threshold.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}).`,
          amount: currentYearRevenue,
          suggestion: `Si vous dépassez ${threshold.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}, vous basculerez au régime réel. Anticipez ce changement en consultant un comptable.`,
        });
      } else if (currentYearRevenue > threshold * 0.6) {
        insights.push({
          type: 'tip',
          title: `📈 Surveillez votre CA`,
          message: `Vous êtes à ${((currentYearRevenue / threshold) * 100).toFixed(0)}% du plafond micro-entreprise. Tout va bien mais restez vigilant.`,
        });
      }
    }

    // Conseil pour l'optimisation fiscale
    if (totalRevenue > 50000 && company.companyType === 'MICRO_ENTREPRISE') {
      insights.push({
        type: 'tip',
        title: `💡 Optimisation fiscale possible`,
        message: `Avec ${totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de CA, vous pourriez économiser des impôts en changeant de structure juridique.`,
        suggestion: `Consultez notre outil "Optimisation Fiscale" pour découvrir les structures les plus avantageuses pour votre situation.`,
      });
    }

    // ==========================================
    // 8. DOCUMENTS NON ANALYSÉS
    // ==========================================
    
    const unanalyzed = documents.filter(d => !d.analyzed);
    if (unanalyzed.length > 0) {
      insights.push({
        type: 'warning',
        severity: 'low',
        title: `📋 Documents non analysés`,
        message: `${unanalyzed.length} document${unanalyzed.length > 1 ? 's' : ''} n'${unanalyzed.length > 1 ? 'ont' : 'a'} pas encore été analysé${unanalyzed.length > 1 ? 's' : ''} par l'IA.`,
        suggestion: `Utilisez le bouton "🔄 Re-analyser" pour analyser automatiquement ces documents et extraire les informations comptables.`,
        documents: unanalyzed.map(d => d.id),
      });
    }

    // Trier les insights par priorité (suspects et critiques d'abord)
    insights.sort((a, b) => {
      const priorityOrder = { 'suspect': 0, 'warning': 1, 'tip': 2, 'info': 3, 'success': 4 };
      const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      
      const aPriority = priorityOrder[a.type] * 10 + (severityOrder[a.severity || 'low'] || 3);
      const bPriority = priorityOrder[b.type] * 10 + (severityOrder[b.severity || 'low'] || 3);
      
      return aPriority - bPriority;
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des insights' },
      { status: 500 }
    );
  }
}

