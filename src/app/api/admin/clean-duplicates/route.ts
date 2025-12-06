/**
 * API Route : Nettoyage des doublons
 * POST /api/admin/clean-duplicates
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('🧹 Début du nettoyage des doublons...');

    // Récupérer toutes les entreprises de l'utilisateur
    const companies = await prisma.company.findMany({
      where: {
        userId: session.user.id,
      },
    });

    let totalDeleted = 0;

    for (const company of companies) {
      console.log(`\n📁 Entreprise: ${company.name}`);

      // Récupérer tous les documents de l'entreprise
      const documents = await prisma.document.findMany({
        where: {
          companyId: company.id,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      console.log(`📄 ${documents.length} documents trouvés`);

      // Grouper par nom de fichier
      const byFilename: Record<string, typeof documents> = {};

      documents.forEach((doc) => {
        if (!byFilename[doc.filename]) {
          byFilename[doc.filename] = [];
        }
        byFilename[doc.filename].push(doc);
      });

      // Pour chaque groupe, garder le premier (le plus ancien), supprimer les autres
      for (const [filename, docs] of Object.entries(byFilename)) {
        if (docs.length > 1) {
          console.log(`\n🔍 Doublons détectés pour: ${filename} (${docs.length} copies)`);

          // Garder le document analysé si possible, sinon le plus ancien
          const toKeep = docs.find((d) => d.analyzed) || docs[0];
          const toDelete = docs.filter((d) => d.id !== toKeep.id);

          console.log(`✅ Conserver: ${toKeep.id} (${toKeep.analyzed ? 'analysé' : 'non analysé'})`);
          console.log(`🗑️  Supprimer: ${toDelete.map((d) => d.id).join(', ')}`);

          // Supprimer les doublons
          for (const doc of toDelete) {
            await prisma.document.delete({
              where: { id: doc.id },
            });
            totalDeleted++;
          }
        }
      }
    }

    console.log(`\n✅ Nettoyage terminé ! ${totalDeleted} doublons supprimés`);

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      message: `${totalDeleted} document(s) dupliqué(s) supprimé(s)`,
    });
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage' },
      { status: 500 }
    );
  }
}

