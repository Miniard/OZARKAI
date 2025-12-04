'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PLAN_LIMITS } from '@/lib/subscription/plans';

export default function TarifsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // @ts-ignore - Custom session type
  const currentPlan = session?.user?.plan || 'STARTER';

  const handleUpgrade = async () => {
    if (!session) {
      router.push('/login?redirect=/tarifs');
      return;
    }

    // TODO: Intégrer Stripe
    alert('🚀 Intégration Stripe à venir ! Pour l\'instant, contactez-nous : contact@comptapilot.fr');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Tarifs Komptal
          </h1>
          <p className="text-xl text-gray-400">
            Choisissez le plan qui correspond à votre activité
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sans engagement • Annulation à tout moment
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* STARTER */}
          <Card className={`relative ${currentPlan === 'STARTER' ? 'border-primary-500 border-2' : ''}`}>
            {currentPlan === 'STARTER' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                Plan actuel
              </div>
            )}
            <CardHeader>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {PLAN_LIMITS.STARTER.name}
                </h2>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-primary-400">
                    {PLAN_LIMITS.STARTER.price}€
                  </span>
                  <span className="text-gray-400 ml-2">/ {PLAN_LIMITS.STARTER.interval}</span>
                </div>
                <p className="text-gray-400">
                  Pour les micro-entrepreneurs et auto-entrepreneurs
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {PLAN_LIMITS.STARTER.features.map((feature, idx) => {
                  const isAvailable = feature.startsWith('✅');
                  return (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 ${
                        isAvailable ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      <span className="mt-0.5">{feature.substring(0, 1)}</span>
                      <span>{feature.substring(2)}</span>
                    </li>
                  );
                })}
              </ul>
              <Button
                variant="outline"
                className="w-full"
                disabled={currentPlan === 'STARTER'}
                onClick={() => router.push('/register')}
              >
                {session ? 'Plan actuel' : 'Commencer gratuitement'}
              </Button>
            </CardContent>
          </Card>

          {/* PREMIUM */}
          <Card className={`relative border-2 ${
            currentPlan === 'PREMIUM' 
              ? 'border-yellow-500' 
              : 'border-primary-500 shadow-ozark-lg'
          }`}>
            {currentPlan === 'PREMIUM' ? (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                Plan actuel
              </div>
            ) : (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse">
                ⭐ Recommandé
              </div>
            )}
            <CardHeader className="bg-gradient-to-br from-primary-600/20 to-blue-600/20">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {PLAN_LIMITS.PREMIUM.name}
                </h2>
                <div className="mb-4">
                  <span className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {PLAN_LIMITS.PREMIUM.price}€
                  </span>
                  <span className="text-gray-400 ml-2">/ {PLAN_LIMITS.PREMIUM.interval}</span>
                </div>
                <p className="text-gray-300">
                  Pour les moyennes entreprises et cabinets comptables
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {PLAN_LIMITS.PREMIUM.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-300"
                  >
                    <span className="text-green-400 mt-0.5">✅</span>
                    <span>{feature.substring(2)}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="primary"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                disabled={currentPlan === 'PREMIUM'}
                onClick={handleUpgrade}
              >
                {currentPlan === 'PREMIUM' ? '✓ Abonné' : '🚀 Passer à Premium'}
              </Button>
              {currentPlan !== 'PREMIUM' && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  Essai gratuit de 14 jours • Sans engagement
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>💳 Quels sont les moyens de paiement acceptés ?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Nous acceptons toutes les cartes bancaires via Stripe (Visa, Mastercard, Amex).
                Le paiement est sécurisé et vos données ne sont jamais stockées chez nous.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔄 Puis-je changer de plan à tout moment ?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Oui ! Vous pouvez passer de Starter à Premium à tout moment. Si vous rétrogradez,
                le changement sera effectif à la fin de votre période de facturation.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Que se passe-t-il si j'atteins les limites du plan Starter ?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Vous recevrez une notification vous invitant à passer au plan Premium. Vos données
                restent accessibles en lecture seule jusqu'à ce que vous upgradiez votre plan.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔒 Mes données sont-elles sécurisées ?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Absolument ! Toutes vos données sont chiffrées (AES-256), les données sensibles
                sont anonymisées avant envoi à l'IA, et nous ne partageons jamais vos informations.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💬 Le support est-il inclus ?</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Le plan Starter inclut un support par email (réponse sous 48h). Le plan Premium
                bénéficie d'un support prioritaire avec réponse sous 24h maximum.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary-600/20 to-blue-600/20 border-primary-500">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-4 text-white">
                🚀 Prêt à simplifier votre comptabilité ?
              </h3>
              <p className="text-gray-300 mb-6">
                Rejoignez les centaines d'entrepreneurs qui font confiance à Komptal
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/register')}
                >
                  Commencer gratuitement
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpgrade}
                >
                  🔥 Essayer Premium (14j gratuits)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

