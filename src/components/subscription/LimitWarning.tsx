'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface LimitWarningProps {
  current: number;
  max: number;
  resource: string;
  unit?: string;
}

export function LimitWarning({ current, max, resource, unit = '' }: LimitWarningProps) {
  const router = useRouter();
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  if (!isNearLimit) return null;

  return (
    <div className={`rounded-lg p-4 mb-4 ${
      isAtLimit 
        ? 'bg-red-500/20 border border-red-500' 
        : 'bg-yellow-500/20 border border-yellow-500'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{isAtLimit ? '🚫' : '⚠️'}</span>
            <h4 className="font-bold text-white">
              {isAtLimit ? 'Limite atteinte' : 'Attention : limite bientôt atteinte'}
            </h4>
          </div>
          <p className="text-sm text-gray-300">
            Vous avez utilisé <span className="font-bold">{current}/{max}</span> {resource}{unit}
            {isAtLimit 
              ? '. Passez à Premium pour continuer.' 
              : '. Pensez à upgrader pour éviter les interruptions.'
            }
          </p>
          <div className="w-full bg-dark-700 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => router.push('/tarifs')}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex-shrink-0"
        >
          🚀 Upgrade
        </Button>
      </div>
    </div>
  );
}

