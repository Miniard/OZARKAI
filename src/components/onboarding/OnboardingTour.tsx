/**
 * Tour d'Onboarding Interactif
 * Guide les nouveaux utilisateurs à travers l'application
 */

'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  action?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '👋 Bienvenue sur Komptal !',
    description: 'Nous allons vous faire découvrir les fonctionnalités principales en 5 étapes rapides.',
  },
  {
    id: 'company',
    title: '🏢 Votre Entreprise',
    description: 'Commencez par sélectionner votre entreprise dans le menu déroulant en haut à gauche.',
    targetElement: '#company-selector',
  },
  {
    id: 'upload',
    title: '📄 Upload de Factures',
    description: 'Cliquez sur "Uploader" pour ajouter vos premières factures. L\'IA les analysera automatiquement !',
    targetElement: '#sidebar-upload',
    action: 'upload',
  },
  {
    id: 'dashboard',
    title: '📊 Tableau de Bord',
    description: 'Suivez vos revenus, dépenses et TVA en temps réel sur le tableau de bord.',
    targetElement: '#sidebar-dashboard',
  },
  {
    id: 'chat',
    title: '💬 Assistant IA',
    description: 'Posez toutes vos questions comptables à l\'expert-comptable virtuel 24/7 !',
    targetElement: '#sidebar-chat',
  },
  {
    id: 'complete',
    title: '✅ C\'est parti !',
    description: 'Vous êtes prêt à utiliser Komptal. Explorez toutes les fonctionnalités à votre rythme.',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  useEffect(() => {
    // Highlight l'élément cible
    if (step.targetElement) {
      const element = document.querySelector(step.targetElement);
      if (element) {
        element.classList.add('onboarding-highlight');
        return () => {
          element.classList.remove('onboarding-highlight');
        };
      }
    }
  }, [step]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkipTour = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />

      {/* Modal Onboarding */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 pointer-events-auto animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Étape {currentStep + 1} sur {ONBOARDING_STEPS.length}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step.title}
              </h2>
            </div>
            <button
              onClick={handleSkipTour}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleSkipTour}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Passer le tour
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Précédent
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/30"
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  <>
                    <Check className="w-5 h-5" />
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary-500 w-6'
                    : index < currentStep
                    ? 'bg-primary-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Styles pour l'highlight */}
      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.4), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          border-radius: 12px;
          animation: pulse-ring 2s ease-out infinite;
        }

        @keyframes pulse-ring {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.4), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(52, 152, 219, 0.2), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </>
  );
}

