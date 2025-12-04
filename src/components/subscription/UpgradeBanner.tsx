'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface UpgradeBannerProps {
  feature: string;
  description?: string;
}

export function UpgradeBanner({ feature, description }: UpgradeBannerProps) {
  const router = useRouter();

  return (
    <Card className="border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
      <CardContent className="py-8 text-center">
        <div className="mb-4">
          <span className="text-5xl">🔒</span>
        </div>
        <h3 className="text-2xl font-bold mb-2 text-white">
          {feature}
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {description || `Cette fonctionnalité est réservée aux utilisateurs Premium`}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/tarifs')}
          >
            Voir les plans
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push('/tarifs')}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            🚀 Passer à Premium
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          ✓ Essai gratuit de 14 jours • Sans engagement
        </p>
      </CardContent>
    </Card>
  );
}

