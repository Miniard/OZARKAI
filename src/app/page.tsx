/**
 * Landing Page - SaaS Pro Ready to Sell
 */

import Link from 'next/link';
import { Check, ArrowRight, Star, Zap, Shield, Clock, Mail, FileText, Download, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white antialiased">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-semibold text-gray-900">Komptal</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900">Fonctionnalités</Link>
              <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Tarifs</Link>
              <Link href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900">Témoignages</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">
                Connexion
              </Link>
              <Link href="/register" className="text-sm font-medium text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Plus de 500 entreprises nous font confiance
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Centralisez toutes vos factures
            <span className="block text-gray-400">en un seul endroit</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Importez automatiquement vos factures depuis Gmail et Outlook, 
            organisez-les et exportez-les vers votre comptable en quelques clics.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-black text-white font-medium px-6 py-3 rounded-lg hover:bg-gray-800 transition">
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#demo" className="inline-flex items-center justify-center gap-2 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              Voir une démo
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              14 jours d'essai gratuit
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              Annulation à tout moment
            </span>
          </div>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900 rounded-xl p-2 shadow-2xl">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-400">app.komptal.com</span>
                </div>
              </div>
              <div className="bg-gray-50 p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <DashboardCard label="Ce mois" value="24 580 €" change="+12.5%" positive />
                  <DashboardCard label="Factures" value="47" />
                  <DashboardCard label="À traiter" value="3" highlight />
                  <DashboardCard label="Exportées" value="44" />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-900">Documents récents</span>
                    <span className="text-sm text-gray-500">Voir tout →</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <TableRow vendor="Apple" amount="9,99 €" date="Aujourd'hui" type="Reçu" />
                    <TableRow vendor="Adobe Creative Cloud" amount="59,99 €" date="Hier" type="Facture" />
                    <TableRow vendor="Amazon Web Services" amount="142,50 €" date="10 déc." type="Facture" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-12 px-4 sm:px-6 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-gray-400 mb-8">Ils utilisent Komptal pour gérer leurs factures</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {['Startup', 'Agency', 'Freelance', 'E-commerce', 'SaaS'].map((name) => (
              <span key={name} className="text-xl font-semibold text-gray-300">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une solution complète pour gérer vos documents comptables sans effort.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Mail className="w-5 h-5" />}
              title="Import automatique"
              description="Connectez Gmail ou Outlook et importez automatiquement toutes vos factures."
            />
            <FeatureCard 
              icon={<Zap className="w-5 h-5" />}
              title="Extraction intelligente"
              description="Les données sont extraites automatiquement : montant, date, fournisseur, TVA."
            />
            <FeatureCard 
              icon={<FileText className="w-5 h-5" />}
              title="Organisation simple"
              description="Classez et retrouvez vos documents en quelques secondes."
            />
            <FeatureCard 
              icon={<Download className="w-5 h-5" />}
              title="Export comptable"
              description="Exportez en CSV ou JSON, compatible avec tous les logiciels comptables."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-5 h-5" />}
              title="Tableau de bord"
              description="Visualisez vos dépenses et suivez votre trésorerie en temps réel."
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5" />}
              title="100% sécurisé"
              description="Données chiffrées, hébergement en Europe, conformité RGPD."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche
            </h2>
            <p className="text-gray-600">
              Prêt en 3 étapes, moins de 5 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard number="1" title="Connectez vos emails" description="Liez votre compte Gmail ou Outlook en un clic sécurisé." />
            <StepCard number="2" title="Importez vos factures" description="Sélectionnez la période, nos algorithmes font le reste." />
            <StepCard number="3" title="Exportez et gérez" description="Consultez, organisez et exportez vers votre comptable." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-gray-600">
              Pas de frais cachés. Annulez à tout moment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
              name="Starter"
              price="0"
              description="Pour découvrir Komptal"
              features={['50 documents/mois', '1 compte email', 'Export CSV', 'Support email']}
            />
            <PricingCard 
              name="Pro"
              price="19"
              description="Pour les indépendants"
              features={['500 documents/mois', '3 comptes email', 'Export CSV & JSON', 'Support prioritaire', 'Tableau de bord avancé']}
              popular
            />
            <PricingCard 
              name="Business"
              price="49"
              description="Pour les équipes"
              features={['Documents illimités', 'Emails illimités', 'API access', 'Support dédié', 'Multi-utilisateurs', 'Intégrations']}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ce que nos clients disent
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Komptal m'a fait gagner 4 heures par semaine sur ma comptabilité. Je recommande !"
              author="Marie D."
              role="Freelance Designer"
            />
            <TestimonialCard 
              quote="Enfin un outil simple qui fait ce qu'il promet. L'import Gmail est magique."
              author="Thomas L."
              role="Fondateur, TechStartup"
            />
            <TestimonialCard 
              quote="Mon comptable adore les exports. Plus besoin de lui envoyer des factures une par une."
              author="Sophie M."
              role="E-commerce Manager"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à simplifier votre comptabilité ?
          </h2>
          <p className="text-gray-600 mb-8">
            Rejoignez plus de 500 entreprises qui gagnent du temps chaque semaine.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-black text-white font-medium px-8 py-4 rounded-lg hover:bg-gray-800 transition">
            Démarrer gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            14 jours gratuits · Sans engagement · Sans carte bancaire
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-sm">K</span>
                </div>
                <span className="font-semibold text-white">Komptal</span>
              </div>
              <p className="text-sm">
                La solution simple pour gérer vos factures et documents comptables.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white">Fonctionnalités</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Tarifs</Link></li>
                <li><Link href="#" className="hover:text-white">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-white">CGU</Link></li>
                <li><Link href="#" className="hover:text-white">RGPD</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2025 Komptal. Tous droits réservés.</p>
            <p className="text-sm">🇫🇷 Made in France · Hébergé en Europe</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Components

function DashboardCard({ label, value, change, positive, highlight }: { 
  label: string; 
  value: string; 
  change?: string; 
  positive?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-200'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <span className={`text-xl font-semibold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</span>
        {change && (
          <span className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-gray-500'}`}>{change}</span>
        )}
      </div>
    </div>
  );
}

function TableRow({ vendor, amount, date, type }: { vendor: string; amount: string; date: string; type: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">{vendor.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{vendor}</p>
          <p className="text-xs text-gray-500">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{amount}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-gray-700">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
        {number}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, description, features, popular }: { 
  name: string; 
  price: string; 
  description: string; 
  features: string[]; 
  popular?: boolean;
}) {
  return (
    <div className={`rounded-xl p-6 ${popular ? 'bg-black text-white ring-2 ring-black' : 'bg-white border border-gray-200'}`}>
      {popular && (
        <span className="inline-block bg-white text-black text-xs font-medium px-2 py-1 rounded mb-4">
          Le plus populaire
        </span>
      )}
      <h3 className={`text-lg font-semibold mb-1 ${popular ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
      <p className={`text-sm mb-4 ${popular ? 'text-gray-300' : 'text-gray-500'}`}>{description}</p>
      <div className="mb-6">
        <span className={`text-4xl font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>{price}€</span>
        <span className={`text-sm ${popular ? 'text-gray-300' : 'text-gray-500'}`}>/mois</span>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, i) => (
          <li key={i} className={`flex items-center gap-2 text-sm ${popular ? 'text-gray-200' : 'text-gray-600'}`}>
            <Check className={`w-4 h-4 ${popular ? 'text-green-400' : 'text-green-500'}`} />
            {feature}
          </li>
        ))}
      </ul>
      <Link 
        href="/register" 
        className={`block text-center font-medium py-2.5 rounded-lg transition ${
          popular 
            ? 'bg-white text-black hover:bg-gray-100' 
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        Commencer
      </Link>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex gap-1 mb-4">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-gray-700 mb-4">"{quote}"</p>
      <div>
        <p className="font-medium text-gray-900">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  );
}
