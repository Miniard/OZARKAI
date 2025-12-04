'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PLAN_LIMITS } from '@/lib/subscription/plans';

interface PlanBadgeProps {
  plan: 'STARTER' | 'PREMIUM';
  showUpgrade?: boolean;
}

export function PlanBadge({ plan, showUpgrade = true }: PlanBadgeProps) {
  const router = useRouter();

  const isStarter = plan === 'STARTER';

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg ${
      isStarter 
        ? 'bg-gray-700/50 border border-gray-600' 
        : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50'
    }`}>
      <div>
        <span className={`text-xs font-semibold ${
          isStarter ? 'text-gray-400' : 'text-yellow-400'
        }`}>
          {isStarter ? '⚡' : '⭐'} PLAN {PLAN_LIMITS[plan].name.toUpperCase()}
        </span>
        {!isStarter && (
          <p className="text-xs text-gray-400 mt-0.5">
            {PLAN_LIMITS[plan].price}€/mois
          </p>
        )}
      </div>
      
      {showUpgrade && isStarter && (
        <Button
          size="sm"
          variant="primary"
          onClick={() => router.push('/tarifs')}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-xs"
        >
          🚀 Upgrade
        </Button>
      )}
    </div>
  );
}

