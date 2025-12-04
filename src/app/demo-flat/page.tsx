/**
 * PAGE DE DÉMONSTRATION - Design Flat 2015
 * Compare l'ancien design avec le nouveau
 */

'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Users,
  CheckCircle2,
  AlertCircle,
  Info,
  Bell
} from 'lucide-react';
import Link from 'next/link';

export default function DemoFlatPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Import du CSS Flat */}
      <link rel="stylesheet" href="/globals-flat.css" />
      
      {/* Navbar */}
      <nav className="navbar-flat">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <LayoutDashboard className="w-6 h-6" style={{ color: 'var(--text-white)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Komptal - Design Flat 2015
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="btn-outline-flat"
            >
              {theme === 'light' ? '🌙 Mode Sombre' : '☀️ Mode Clair'}
            </button>
            
            <Link href="/" className="btn-ghost-flat">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </nav>

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            🎨 Nouveau Design Flat 2015
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Simple, clair et smooth - Compréhensible par tous
          </p>
        </div>

        {/* Comparaison */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Avant */}
          <div className="card-flat">
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-danger)' }}>
              ❌ Avant (2024)
            </h3>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>• Gradients complexes</li>
              <li>• Glassmorphism</li>
              <li>• Fond ultra-sombre</li>
              <li>• Effets 3D</li>
              <li>• backdrop-blur</li>
              <li>• Ombres ozark complexes</li>
            </ul>
          </div>

          {/* Après */}
          <div className="card-flat" style={{ borderLeft: '4px solid var(--color-success)' }}>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-success)' }}>
              ✅ Après (2015 Flat)
            </h3>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>• Couleurs plates</li>
              <li>• Design flat/minimaliste</li>
              <li>• Fond clair (#F5F7FA)</li>
              <li>• Ombres légères</li>
              <li>• Cards blanches simples</li>
              <li>• Transitions smooth gardées ✨</li>
            </ul>
          </div>
        </div>

        {/* KPIs Exemple */}
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          📊 Exemple de Dashboard
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Revenus */}
          <div className="card-flat hover-lift transition-smooth">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-success-light)' }}>
                <TrendingUp className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Revenus</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>15,000€</p>
              </div>
            </div>
            <div className="divider-flat"></div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              +12% vs mois dernier
            </p>
          </div>

          {/* Dépenses */}
          <div className="card-flat hover-lift transition-smooth">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-danger-light)' }}>
                <FileText className="w-6 h-6" style={{ color: 'var(--color-danger)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Dépenses</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>8,500€</p>
              </div>
            </div>
            <div className="divider-flat"></div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              -5% vs mois dernier
            </p>
          </div>

          {/* Clients */}
          <div className="card-flat hover-lift transition-smooth">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-info-light)' }}>
                <Users className="w-6 h-6" style={{ color: 'var(--color-info)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Clients</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-info)' }}>24</p>
              </div>
            </div>
            <div className="divider-flat"></div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              3 nouveaux ce mois
            </p>
          </div>
        </div>

        {/* Composants UI */}
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          🎨 Composants UI
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          
          {/* Boutons */}
          <div className="card-flat">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Boutons
            </h3>
            <div className="space-y-3">
              <button className="btn-primary-flat w-full">
                Bouton Primary
              </button>
              <button className="btn-success-flat w-full">
                Bouton Success
              </button>
              <button className="btn-danger-flat w-full">
                Bouton Danger
              </button>
              <button className="btn-outline-flat w-full">
                Bouton Outline
              </button>
              <button className="btn-ghost-flat w-full">
                Bouton Ghost
              </button>
            </div>
          </div>

          {/* Badges & Alerts */}
          <div className="card-flat">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Badges & Alerts
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="badge-primary">Primary</span>
              <span className="badge-success">Success</span>
              <span className="badge-danger">Danger</span>
              <span className="badge-warning">Warning</span>
            </div>

            <div className="space-y-3">
              <div className="alert-info">
                <Info className="w-5 h-5 flex-shrink-0" />
                <span>Ceci est une info importante</span>
              </div>
              
              <div className="alert-success">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Opération réussie !</span>
              </div>
              
              <div className="alert-danger">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Attention, erreur détectée</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          📝 Formulaire
        </h2>

        <div className="card-flat max-w-2xl mx-auto mb-12">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Nom de l'entreprise
              </label>
              <input 
                type="text" 
                placeholder="Ex: Ma Super Entreprise"
                className="input-flat"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Email
              </label>
              <input 
                type="email" 
                placeholder="contact@exemple.fr"
                className="input-flat"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Description
              </label>
              <textarea 
                rows={4}
                placeholder="Décrivez votre activité..."
                className="input-flat"
              />
            </div>

            <button type="submit" className="btn-primary-flat w-full">
              Enregistrer
            </button>
          </form>
        </div>

        {/* Liste de factures exemple */}
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          📄 Liste de Factures
        </h2>

        <div className="space-y-3 mb-12">
          {[
            { id: 1, name: 'Facture #001', amount: '1,250€', status: 'Payée', color: 'success' },
            { id: 2, name: 'Facture #002', amount: '850€', status: 'En attente', color: 'warning' },
            { id: 3, name: 'Facture #003', amount: '2,100€', status: 'Payée', color: 'success' },
            { id: 4, name: 'Facture #004', amount: '450€', status: 'Retard', color: 'danger' },
          ].map((facture) => (
            <div key={facture.id} className="card-flat hover-lift transition-smooth cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ 
                    backgroundColor: `var(--color-${facture.color}-light)` 
                  }}>
                    <FileText className="w-5 h-5" style={{ color: `var(--color-${facture.color})` }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {facture.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Émise le 12 Nov 2024
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {facture.amount}
                  </p>
                  <span className={`badge-${facture.color}`}>
                    {facture.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="card-flat" style={{ backgroundColor: 'var(--color-info-light)', borderLeft: '4px solid var(--color-info)' }}>
          <div className="flex items-start gap-4">
            <Bell className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--color-info)' }} />
            <div>
              <h3 className="font-bold mb-2" style={{ color: 'var(--color-info-hover)' }}>
                💡 Nouveau Design Flat 2015
              </h3>
              <p style={{ color: 'var(--color-info-hover)' }}>
                Ce design est inspiré du flat design de 2015 : couleurs plates, ombres légères, 
                fond clair, et surtout, des transitions smooth pour une expérience agréable. 
                Simple à comprendre pour tout le monde, mais toujours moderne et élégant.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

