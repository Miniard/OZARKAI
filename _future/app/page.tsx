'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiscalOptimizationWizard } from '../components/fiscal/FiscalOptimizationWizard';
import { FiscalOptimizationResults } from '../components/fiscal/FiscalOptimizationResults';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, LogOut, Calculator } from 'lucide-react';

interface FiscalOptimization {
  currentSituation: {
    taxRate: number;
    estimatedTax: number;
    fiscalStatus: string;
    country?: string;
  };
  optimizations: Array<{
    title: string;
    description: string;
    advantages: string[];
    estimatedSavings: number;
    difficulty: 'FACILE' | 'MOYEN' | 'COMPLEXE';
    legalRisk: 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ';
    implementationTime?: string;
  }>;
  quickWins: Array<{
    action: string;
    howTo: string;
    savings: number;
  }>;
  warnings: string[];
  nextSteps: Array<{
    step: string;
    deadline: string;
    howTo: string;
  }>;
}

export default function OptimisationFiscalePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [optimization, setOptimization] = useState<FiscalOptimization | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-slate-400 animate-pulse" />
          <span className="text-slate-500">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-6">
        {!optimization ? (
          <FiscalOptimizationWizard 
            onAnalysisComplete={(data) => setOptimization(data)} 
          />
        ) : (
          <FiscalOptimizationResults 
            results={optimization} 
            onBack={() => setOptimization(null)} 
          />
        )}
      </main>
    </div>
  );
}
