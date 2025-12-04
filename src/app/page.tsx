/**
 * Page d'accueil - Design moderne et lumineux
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  ArrowRight,
  Mail,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Bot
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/logo-icon.svg" alt="Komptal" className="w-9 h-9" />
              <span className="text-xl font-bold text-slate-900">Komptal</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Comment ça marche
              </Link>
              <Link href="/tarifs" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Tarifs
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Démarrer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-6 animate-in">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700">IA Comptable Nouvelle Génération</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-6 animate-in-delay-1">
              La comptabilité
              <span className="block text-gradient-primary mt-2">simplifiée par l'IA</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in-delay-2">
              Importez vos factures automatiquement depuis Gmail, laissez l'IA les analyser, 
              et gérez votre comptabilité en quelques clics.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in-delay-3">
              <Link href="/register">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Commencer gratuitement
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg">
                  Voir la démo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-slate-500 animate-in-delay-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span>Essai gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                <span>100% sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning-500" />
                <span>Configuration en 2 min</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative animate-in-delay-3">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-xl overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-lg px-4 py-1.5 text-sm text-slate-500 border border-slate-200">
                    app.komptal.com/dashboard
                  </div>
                </div>
              </div>
              <div className="p-8 bg-gradient-subtle">
                {/* Mini dashboard preview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <MiniStatCard title="Revenus du mois" value="24,580 €" trend="+12%" positive />
                  <MiniStatCard title="Dépenses" value="8,420 €" trend="-5%" positive />
                  <MiniStatCard title="TVA à déclarer" value="3,232 €" />
                  <MiniStatCard title="Factures en attente" value="12" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-white rounded-xl p-4 border border-slate-100 h-48" />
                  <div className="bg-white rounded-xl p-4 border border-slate-100 h-48" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-slate-600">
              Une suite complète d'outils pour gérer votre comptabilité sans effort
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Mail className="w-6 h-6" />}
              iconColor="bg-primary-50 text-primary-500"
              title="Import Gmail automatique"
              description="Connectez votre Gmail et on récupère automatiquement toutes vos factures. Plus jamais de saisie manuelle."
              badge="Nouveau"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              iconColor="bg-purple-50 text-purple-500"
              title="Analyse IA instantanée"
              description="Notre IA extrait et catégorise automatiquement les informations de chaque facture en quelques secondes."
            />
            <FeatureCard
              icon={<Bot className="w-6 h-6" />}
              iconColor="bg-blue-50 text-blue-500"
              title="Chat expert-comptable"
              description="Posez vos questions en français simple. L'assistant IA vous répond comme un vrai comptable, 24/7."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              iconColor="bg-emerald-50 text-emerald-500"
              title="Dashboard en temps réel"
              description="Visualisez vos finances avec des graphiques clairs : revenus, dépenses, TVA, trésorerie."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              iconColor="bg-amber-50 text-amber-500"
              title="Prédictions financières"
              description="Anticipez votre trésorerie grâce au machine learning. Planifiez vos investissements sereinement."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              iconColor="bg-rose-50 text-rose-500"
              title="Sécurité maximale"
              description="Vos données sont chiffrées et anonymisées. Hébergement en France, conformité RGPD totale."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-slate-600">
              Trois étapes simples pour automatiser votre comptabilité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Connectez Gmail"
              description="Liez votre compte Gmail en un clic. On scanne votre boîte mail pour trouver toutes vos factures."
              icon={<Mail className="w-8 h-8" />}
            />
            <StepCard
              number="2"
              title="L'IA analyse tout"
              description="Notre intelligence artificielle extrait les données, catégorise et classe chaque document automatiquement."
              icon={<Sparkles className="w-8 h-8" />}
            />
            <StepCard
              number="3"
              title="Pilotez votre activité"
              description="Consultez vos indicateurs, exportez pour votre comptable, et posez vos questions à l'assistant IA."
              icon={<BarChart3 className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Ils nous font confiance
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
              {/* Placeholder logos */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-32 h-10 bg-slate-300 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-500 mb-2">500+</div>
              <div className="text-slate-600">TPE utilisent Komptal</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-500 mb-2">50,000+</div>
              <div className="text-slate-600">Factures analysées par mois</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-500 mb-2">4h/sem</div>
              <div className="text-slate-600">Gagnées en moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à simplifier votre comptabilité ?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Rejoignez les centaines de TPE qui gagnent du temps et de la sérénité avec Komptal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg" 
                variant="secondary"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="bg-white text-primary-600 hover:bg-primary-50"
              >
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/tarifs">
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Voir les tarifs
              </Button>
            </Link>
          </div>
          <p className="text-sm text-primary-200 mt-6">
            ✨ Essai gratuit 14 jours • Sans carte bancaire • Annulation à tout moment
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo-icon.svg" alt="Komptal" className="w-9 h-9" />
                <span className="text-xl font-bold text-white">Komptal</span>
              </div>
              <p className="text-sm leading-relaxed">
                L'IA comptable qui simplifie la vie des TPE et auto-entrepreneurs.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Produit</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/tarifs" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Entreprise</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Légal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">RGPD</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2024 Komptal. Tous droits réservés.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                🇫🇷 Made in France
              </span>
              <span className="text-slate-700">•</span>
              <span>Hébergé en Europe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===========================================
   SUB-COMPONENTS
   =========================================== */

function MiniStatCard({ 
  title, 
  value, 
  trend, 
  positive 
}: { 
  title: string; 
  value: string; 
  trend?: string; 
  positive?: boolean 
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold text-slate-900">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${positive ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  iconColor,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Card variant="interactive" className="p-6 group">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative group">
      {/* Connector line (hidden on last card) */}
      <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-slate-200 -z-10" />
      
      <Card className="p-8 text-center relative bg-white">
        {/* Number badge */}
        <div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-6 shadow-primary-glow">
          {number}
        </div>
        
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6 text-primary-500 group-hover:bg-primary-50 transition-colors">
          {icon}
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </Card>
    </div>
  );
}
