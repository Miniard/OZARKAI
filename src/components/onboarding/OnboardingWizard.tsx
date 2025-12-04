/**
 * Wizard d'onboarding pour nouveaux utilisateurs
 * 5 étapes guidées pour démarrer rapidement
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, ArrowRight, ArrowLeft, Building2, Upload, Bot, TrendingUp, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (data: any) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    companyName: '',
    companyType: '',
    vatRegime: '',
    sector: '',
    hasDocuments: false,
    goals: [] as string[],
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(data);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return true; // Bienvenue, toujours valide
      case 2:
        return data.companyName && data.companyType && data.vatRegime;
      case 3:
        return data.sector;
      case 4:
        return true; // Optional
      case 5:
        return data.goals.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s < step
                      ? 'bg-green-500 text-white scale-110'
                      : s === step
                      ? 'bg-primary-500 text-white scale-125 animate-pulse'
                      : 'bg-dark-700 text-gray-500'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      s < step ? 'bg-green-500' : 'bg-dark-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400">
            Étape {step} sur {totalSteps}
          </p>
        </div>

        {/* Card principale */}
        <Card className="border-primary-500/30 shadow-ozark-lg">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              {step === 1 && '🎉 Bienvenue sur Komptal !'}
              {step === 2 && '🏢 Votre Entreprise'}
              {step === 3 && '🎯 Votre Secteur'}
              {step === 4 && '📄 Vos Documents'}
              {step === 5 && '🚀 Vos Objectifs'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Bienvenue */}
            {step === 1 && (
              <div className="text-center space-y-6 py-8">
                <div className="text-6xl mb-4 animate-bounce">✨</div>
                <h2 className="text-2xl font-bold text-white">
                  Votre comptabilité intelligente en 5 minutes !
                </h2>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                  Komptal utilise l'IA pour automatiser votre comptabilité, détecter les anomalies, et vous donner des conseils personnalisés.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <Bot className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                    <p className="text-sm text-white font-semibold">Analyse IA automatique</p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-white font-semibold">Prédictions de trésorerie</p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm text-white font-semibold">Optimisation fiscale</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Entreprise */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom de votre entreprise
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: MonEntreprise SARL"
                    value={data.companyName}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                    className="input-ozark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Type d'entreprise
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {['Micro-entreprise', 'EURL', 'SARL', 'SAS', 'SASU'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setData({ ...data, companyType: type })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          data.companyType === type
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-primary-500/50'
                        }`}
                      >
                        <span className="text-white font-medium">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Régime TVA
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'FRANCHISE_BASE', label: 'Franchise en base (pas de TVA)' },
                      { value: 'REEL_SIMPLIFIE', label: 'Réel simplifié' },
                      { value: 'REEL_NORMAL', label: 'Réel normal' },
                    ].map((regime) => (
                      <button
                        key={regime.value}
                        type="button"
                        onClick={() => setData({ ...data, vatRegime: regime.value })}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          data.vatRegime === regime.value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-primary-500/50'
                        }`}
                      >
                        <span className="text-white">{regime.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Secteur */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-gray-400 text-center">
                  Sélectionnez votre secteur pour obtenir des benchmarks personnalisés
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: 'consulting_it', label: '💻 Conseil IT' },
                    { value: 'ecommerce', label: '🛒 E-commerce' },
                    { value: 'restauration', label: '🍽️ Restauration' },
                    { value: 'services_pro', label: '💼 Services Pro' },
                    { value: 'artisanat', label: '🔨 Artisanat' },
                    { value: 'immobilier', label: '🏠 Immobilier' },
                    { value: 'sante', label: '⚕️ Santé' },
                    { value: 'marketing', label: '📢 Marketing' },
                    { value: 'formation', label: '📚 Formation' },
                    { value: 'other', label: '📦 Autre' },
                  ].map((sect) => (
                    <button
                      key={sect.value}
                      type="button"
                      onClick={() => setData({ ...data, sector: sect.value })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        data.sector === sect.value
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 hover:border-primary-500/50'
                      }`}
                    >
                      <span className="text-white text-lg">{sect.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div className="text-center space-y-6 py-8">
                <Upload className="w-16 h-16 text-primary-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">
                  Avez-vous des factures à uploader ?
                </h3>
                <p className="text-gray-400 max-w-lg mx-auto">
                  L'IA analysera automatiquement vos factures pour extraire les montants, dates, fournisseurs, et catégories comptables.
                </p>
                <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setData({ ...data, hasDocuments: true })}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      data.hasDocuments
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="text-4xl mb-2">✅</div>
                    <span className="text-white font-medium">Oui, j'ai des factures</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, hasDocuments: false })}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      !data.hasDocuments
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="text-4xl mb-2">⏳</div>
                    <span className="text-white font-medium">Plus tard</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Objectifs */}
            {step === 5 && (
              <div className="space-y-4">
                <p className="text-gray-400 text-center">
                  Que souhaitez-vous accomplir avec Komptal ? (plusieurs choix possibles)
                </p>
                <div className="space-y-3">
                  {[
                    { id: 'automate', label: '🤖 Automatiser ma comptabilité', desc: 'Moins de saisie manuelle' },
                    { id: 'monitor', label: '👀 Surveiller ma trésorerie', desc: 'Voir où va mon argent' },
                    { id: 'optimize', label: '💰 Optimiser mes impôts', desc: 'Payer moins légalement' },
                    { id: 'predict', label: '🔮 Prévoir mon avenir financier', desc: 'Anticiper les problèmes' },
                    { id: 'compare', label: '📊 Me comparer à mon secteur', desc: 'Savoir si je suis bon' },
                  ].map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => {
                        const goals = data.goals.includes(goal.id)
                          ? data.goals.filter((g) => g !== goal.id)
                          : [...data.goals, goal.id];
                        setData({ ...data, goals });
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        data.goals.includes(goal.id)
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 hover:border-primary-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-white mb-1">{goal.label}</div>
                          <div className="text-sm text-gray-400">{goal.desc}</div>
                        </div>
                        {data.goals.includes(goal.id) && (
                          <CheckCircle className="w-6 h-6 text-green-400 ml-3" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-dark-700">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={step === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>

              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="btn-ozark"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  🚀 C'est parti !
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

