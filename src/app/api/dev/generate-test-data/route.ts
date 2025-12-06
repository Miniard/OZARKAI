/**
 * API pour générer des données de test réalistes
 * UNIQUEMENT EN DEV - À supprimer en production
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
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

    // Générer 12 mois de données
    const documents = [];
    const entries = [];
    const today = new Date();

    // Catégories pour les ventes
    const salesCategories = [
      { category: '706 - Prestations de services', rate: 0.6 },
      { category: '707 - Ventes de marchandises', rate: 0.4 },
    ];

    // Catégories pour les achats
    const purchaseCategories = [
      { category: '6064 - Fournitures administratives', supplier: 'Bureau Vallée', rate: 0.15 },
      { category: '613 - Locations', supplier: 'Immobilière des Bureaux', rate: 0.3 },
      { category: '625 - Déplacements, missions', supplier: 'SNCF', rate: 0.1 },
      { category: '626 - Frais postaux', supplier: 'La Poste', rate: 0.05 },
      { category: '6063 - Fournitures entretien', supplier: 'Castorama', rate: 0.1 },
      { category: '606 - Achats non stockés', supplier: 'Amazon Business', rate: 0.3 },
    ];

    for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - monthOffset);
      date.setDate(15); // Milieu du mois

      // Variation saisonnière (été plus calme, décembre/janvier actif)
      const month = date.getMonth();
      let seasonalFactor = 1.0;
      if (month === 6 || month === 7) seasonalFactor = 0.7; // Juillet/Août
      if (month === 11 || month === 0) seasonalFactor = 1.3; // Décembre/Janvier

      // Tendance croissante (simulation de croissance)
      const growthFactor = 1 + ((11 - monthOffset) * 0.05); // +5% par mois

      // GÉNÉRER 3-5 FACTURES DE VENTE PAR MOIS
      const numSales = Math.floor(Math.random() * 3) + 3; // 3 à 5 factures
      
      for (let i = 0; i < numSales; i++) {
        const saleDate = new Date(date);
        saleDate.setDate(Math.floor(Math.random() * 28) + 1); // Jour aléatoire du mois

        const baseAmount = 1000 + Math.random() * 3000; // 1000€ à 4000€
        const amountHT = Math.round(baseAmount * seasonalFactor * growthFactor * 100) / 100;
        const tva = Math.round(amountHT * 0.2 * 100) / 100;
        const amountTTC = Math.round((amountHT + tva) * 100) / 100;

        const category = salesCategories[Math.floor(Math.random() * salesCategories.length)];
        const clientNames = ['Société ABC SARL', 'Entreprise XYZ SAS', 'Client Premium Ltd', 'Business Corp'];
        const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];

        const doc = await prisma.document.create({
          data: {
            filename: `facture-vente-${saleDate.toISOString().split('T')[0]}-${i + 1}.pdf`,
            fileUrl: `/test/facture-vente-${monthOffset}-${i}.pdf`,
            fileType: 'application/pdf',
            fileSize: 150000,
            companyId,
            analyzed: true,
            analysisData: {
              type: 'FACTURE_VENTE',
              amount: amountHT,
              vat: tva,
              total: amountTTC,
              supplier: clientName,
              category: category.category,
            },
            docType: 'FACTURE_VENTE',
            amount: amountHT,
            vat: tva,
            date: saleDate,
            supplier: clientName,
          },
        });

        documents.push(doc);

        // Créer l'écriture comptable
        await prisma.entry.create({
          data: {
            companyId,
            documentId: doc.id,
            date: saleDate,
            description: `FACTURE_VENTE - ${clientName}`,
            category: category.category,
            debit: 0,
            credit: amountHT,
            validated: true,
          },
        });
      }

      // GÉNÉRER 4-8 FACTURES D'ACHAT PAR MOIS
      const numPurchases = Math.floor(Math.random() * 5) + 4; // 4 à 8 factures
      
      for (let i = 0; i < numPurchases; i++) {
        const purchaseDate = new Date(date);
        purchaseDate.setDate(Math.floor(Math.random() * 28) + 1);

        const category = purchaseCategories[Math.floor(Math.random() * purchaseCategories.length)];
        
        let baseAmount;
        if (category.category.includes('Location')) {
          baseAmount = 800 + Math.random() * 400; // Loyer : 800-1200€
        } else if (category.category.includes('Fournitures')) {
          baseAmount = 50 + Math.random() * 200; // Fournitures : 50-250€
        } else {
          baseAmount = 100 + Math.random() * 400; // Autres : 100-500€
        }

        const amountHT = Math.round(baseAmount * 100) / 100;
        const tva = Math.round(amountHT * 0.2 * 100) / 100;
        const amountTTC = Math.round((amountHT + tva) * 100) / 100;

        const doc = await prisma.document.create({
          data: {
            filename: `facture-achat-${purchaseDate.toISOString().split('T')[0]}-${i + 1}.pdf`,
            fileUrl: `/test/facture-achat-${monthOffset}-${i}.pdf`,
            fileType: 'application/pdf',
            fileSize: 120000,
            companyId,
            analyzed: true,
            analysisData: {
              type: 'FACTURE_ACHAT',
              amount: amountHT,
              vat: tva,
              total: amountTTC,
              supplier: category.supplier,
              category: category.category,
            },
            docType: 'FACTURE_ACHAT',
            amount: amountHT,
            vat: tva,
            date: purchaseDate,
            supplier: category.supplier,
          },
        });

        documents.push(doc);

        // Créer l'écriture comptable
        await prisma.entry.create({
          data: {
            companyId,
            documentId: doc.id,
            date: purchaseDate,
            description: `FACTURE_ACHAT - ${category.supplier}`,
            category: category.category,
            debit: amountHT,
            credit: 0,
            validated: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${documents.length} factures de test générées sur 12 mois !`,
      stats: {
        totalDocuments: documents.length,
        months: 12,
        avgPerMonth: Math.round(documents.length / 12),
      },
    });
  } catch (error) {
    console.error('Error generating test data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des données de test' },
      { status: 500 }
    );
  }
}

