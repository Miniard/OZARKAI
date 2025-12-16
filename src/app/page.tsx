/**
 * Page d'accueil - Design Premium 2025
 */

import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">K</span>
              </div>
              <span className="text-base font-semibold">Komptal</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#pricing" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                Tarifs
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900 px-3 py-1.5 transition-colors">
                Connexion
              </Link>
              <Link href="/register" className="text-sm font-medium bg-zinc-900 text-white px-4 py-1.5 rounded-full hover:bg-zinc-700 transition-all">
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 mb-6 text-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-violet-700 font-medium">Nouveau</span>
            <span className="text-zinc-500">— Import Outlook disponible</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 mb-4 leading-tight">
            Vos factures, <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">automatisées</span>
          </h1>

          <p className="text-base text-zinc-500 mb-8 max-w-md mx-auto">
            Importez depuis Gmail & Outlook, extrayez les données automatiquement, exportez vers votre comptable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-zinc-700 transition-all group">
              Commencer gratuitement
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center text-sm text-zinc-600 px-5 py-2.5 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-all">
              Se connecter
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              14 jours gratuits
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Sans CB
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Annulation libre
            </span>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-200 via-indigo-200 to-purple-200 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            
            <div className="relative bg-zinc-900 rounded-xl p-1 shadow-2xl">
              <div className="bg-zinc-800 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  </div>
                </div>
                
                <div className="p-4 bg-zinc-50">
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <MiniStat label="Revenus" value="24 580 €" color="violet" />
                    <MiniStat label="Dépenses" value="8 420 €" color="rose" />
                    <MiniStat label="TVA" value="3 232 €" color="amber" />
                    <MiniStat label="Documents" value="47" color="emerald" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="flex items-end gap-1 h-24">
                        {[35, 55, 40, 70, 50, 85, 60, 75, 45, 90, 65, 80].map((h, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-gradient-to-t from-violet-500 to-indigo-400 rounded-sm opacity-80 hover:opacity-100 transition-opacity" 
                            style={{ height: `${h}%` }} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="space-y-2">
                        {[
                          { name: 'SaaS', pct: 42, color: 'bg-violet-500' },
                          { name: 'Services', pct: 28, color: 'bg-indigo-400' },
                          { name: 'Autres', pct: 30, color: 'bg-zinc-300' },
                        ].map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className="text-xs text-zinc-600 flex-1">{item.name}</span>
                            <span className="text-xs font-medium">{item.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Inline simple */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
            <FeatureSimple icon="📧" text="Import Gmail & Outlook" />
            <FeatureSimple icon="✨" text="Extraction automatique" />
            <FeatureSimple icon="📊" text="Tableau de bord" />
            <FeatureSimple icon="⚡" text="Export CSV & JSON" />
            <FeatureSimple icon="🔒" text="Sécurisé & RGPD" />
            <FeatureSimple icon="⏱️" text="4h gagnées/semaine" />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-2">
              Comment ça marche
            </h2>
            <p className="text-sm text-zinc-500">
              Prêt en 2 minutes.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-4">
            <Step num="1" title="Connectez" desc="Liez Gmail ou Outlook" />
            <div className="hidden md:block w-px bg-zinc-200 self-stretch" />
            <Step num="2" title="Importez" desc="Lancez l'extraction" />
            <div className="hidden md:block w-px bg-zinc-200 self-stretch" />
            <Step num="3" title="Exportez" desc="Vers votre comptable" />
          </div>
        </div>
      </section>

      {/* Stats - Plus subtil */}
      <section className="py-12 px-6 border-y border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
            <div>
              <span className="text-2xl font-semibold text-zinc-900">500+</span>
              <span className="text-sm text-zinc-400 ml-2">entreprises</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-zinc-200" />
            <div>
              <span className="text-2xl font-semibold text-zinc-900">50K</span>
              <span className="text-sm text-zinc-400 ml-2">documents traités</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-zinc-200" />
            <div>
              <span className="text-2xl font-semibold text-zinc-900">4h</span>
              <span className="text-sm text-zinc-400 ml-2">gagnées/semaine</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-3">
            Prêt à simplifier ?
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Rejoignez des centaines d'entreprises.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-all group">
            Démarrer gratuitement
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="text-xs text-zinc-400 mt-4">
            14 jours gratuits · Sans engagement
          </p>
        </div>
      </section>

      {/* Footer - Dark */}
      <footer className="py-12 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-zinc-900 font-bold text-sm">K</span>
              </div>
              <span className="text-base font-semibold text-white">Komptal</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-zinc-400">
              <Link href="#features" className="hover:text-white transition-colors">Fonctionnalités</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Tarifs</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/terms" className="hover:text-white transition-colors">CGU</Link>
            </div>

            <div className="text-sm text-zinc-500">
              © 2025 Komptal
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    violet: 'from-violet-500 to-violet-600',
    rose: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };
  
  return (
    <div className="bg-white rounded-lg p-3 border border-zinc-100">
      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colors[color]} mb-2`} />
      <p className="text-[10px] text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function FeatureSimple({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-zinc-600">{text}</span>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center mx-auto mb-3 text-sm">
        {num}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500">{desc}</p>
    </div>
  );
}
