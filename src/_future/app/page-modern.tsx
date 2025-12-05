'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiscalOptimizationWizard } from '@/components/fiscal/FiscalOptimizationWizard';
import { FiscalOptimizationResults } from '@/components/fiscal/FiscalOptimizationResults';

interface FiscalOptimization {
  currentSituation: {
    taxRate: number;
    estimatedTax: number;
    fiscalStatus: string;
  };
  optimizations: Array<{
    title: string;
    description: string;
    advantages: string[];
    requirements: string[];
    estimatedSavings: number;
    difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE';
    legalRisk: 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ';
    implementationTime: string;
    actionSteps?: string[];
    costs?: {
      setup: number;
      annual: number;
    };
    officialLinks?: string[];
    detailedCalculation?: string;
    pitfalls?: string[];
  }>;
  recommendedStructures: Array<{
    name: string;
    description: string;
    benefits: string[];
    drawbacks: string[];
    setup_cost: number;
    annual_savings: number;
    roi_years: number;
  }>;
  quickWins: Array<{
    action: string;
    howTo: string;
    link: string;
    savings: number;
  }> | string[];
  warnings: string[];
  nextSteps: Array<{
    step: string;
    deadline: string;
    howTo: string;
  }> | string[];
}

export default function OptimisationFiscaleModernPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<FiscalOptimization | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/fiscal-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse');
      }

      const result = await response.json();
      setOptimization(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOptimization(null);
    setError('');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-6 py-2 rounded-full bg-primary-500/20 border border-primary-400/30 backdrop-blur-sm">
            <span className="text-sm text-primary-300 font-medium">🤖 Intelligence Artificielle Fiscale</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Optimisation Fiscale IA
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Découvrez comment réduire légalement vos impôts grâce à l'analyse IA
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            ❌ {error}
          </div>
        )}

        {/* Content */}
        {!optimization ? (
          <FiscalOptimizationWizard onAnalysisComplete={handleSubmit} />
        ) : (
          <FiscalOptimizationResults results={optimization} onBack={handleReset} />
        )}
      </div>
    </div>
  );
}

