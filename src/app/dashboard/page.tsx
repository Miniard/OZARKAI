/**
 * Dashboard Page - Design lumineux et moderne
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { UploadDocumentModern } from '@/components/UploadDocumentModern';
import { DocumentDetail } from '@/components/DocumentDetail';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { TeamsPage } from '@/components/teams/TeamsPage';
import { ConnectorHub } from '@/components/connectors/ConnectorHub';
import { ExtractionCenter } from '@/components/connectors/ExtractionCenter';
import { WhatsAppSetup } from '@/components/whatsapp/WhatsAppSetup';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { 
  Plus, 
  Search, 
  FileText,
  TrendingUp,
  TrendingDown,
  Receipt,
  Bell,
  HelpCircle,
  Building2,
  Shield,
  CreditCard,
  MessageCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Data States
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [generatingTestData, setGeneratingTestData] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading');

  // Auth Check
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Load Companies
  useEffect(() => {
    if (session?.user?.id) fetchCompanies();
  }, [session]);

  // Load Data when Company Changes
  useEffect(() => {
    if (selectedCompanyId) {
      fetchDocuments();
    }
  }, [selectedCompanyId, refreshKey]);

  const fetchCompanies = async () => {
    try {
      setLoadingState('loading');
      const response = await fetch('/api/companies');
      
      if (response.ok) {
        let data = await response.json();
        
        // Si pas d'entreprise, en créer une automatiquement
        if (data.length === 0 && session?.user?.name) {
          const createResponse = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Entreprise de ${session.user.name}`,
              companyType: 'MICRO_ENTREPRISE',
              vatRegime: 'FRANCHISE_BASE',
            }),
          });
          
          if (createResponse.ok) {
            const newCompany = await createResponse.json();
            data = [newCompany];
          }
        }
        
        setCompanies(data);
        if (data.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(data[0].id);
        }
      }
      setLoadingState('ready');
    } catch (error) {
      console.error('Error fetching companies:', error);
      setLoadingState('ready');
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?companyId=${selectedCompanyId}`);
      if (response.ok) setDocuments(await response.json());
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleGenerateTestData = async () => {
    if (!selectedCompanyId) return;
    if (!confirm('🧪 Générer des données de test ? (DEV ONLY)')) return;
    
    setGeneratingTestData(true);
    try {
      await fetch(`/api/dev/generate-test-data?companyId=${selectedCompanyId}`, { method: 'POST' });
      setRefreshKey(p => p + 1);
      alert('✅ Données générées !');
    } catch (e) {
      alert('Erreur');
    } finally {
      setGeneratingTestData(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Page title based on active tab
  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Tableau de Bord', subtitle: 'Vue d\'ensemble de votre activité' },
    upload: { title: 'Importer des Documents', subtitle: 'Glissez-déposez vos factures' },
    connectors: { title: 'Email Import', subtitle: 'Connectez vos boîtes mail pour importer automatiquement' },
    extraction: { title: 'Extraction', subtitle: 'Extrayez vos factures par plage de dates' },
    whatsapp: { title: 'WhatsApp Business', subtitle: 'Envoyez vos factures par WhatsApp' },
    documents: { title: 'Mes Factures', subtitle: 'Gérez tous vos documents' },
    teams: { title: 'Équipes', subtitle: 'Collaborez avec vos collègues' },
    settings: { title: 'Paramètres', subtitle: 'Gérez votre compte et vos préférences' },
    security: { title: 'Sécurité', subtitle: 'Gérez la sécurité de votre compte' },
    billing: { title: 'Facturation', subtitle: 'Gérez votre abonnement' },
    help: { title: 'Aide & Support', subtitle: 'Obtenez de l\'aide' },
  };

  const currentPage = pageTitles[activeTab] || { title: '', subtitle: '' };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Document ouvert en plein écran - AU DESSUS DE TOUT */}
      {selectedDocument && (
        <DocumentDetail 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)}
          onAnalyzed={() => {
            setRefreshKey(p => p + 1);
            fetchDocuments();
          }}
          onDelete={async () => {
            if (confirm('Supprimer ce document ?')) {
              await fetch(`/api/documents/${selectedDocument.id}`, { method: 'DELETE' });
              setSelectedDocument(null);
              fetchDocuments();
            }
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        userEmail={session.user?.email}
        userName={session.user?.name}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        setSelectedCompanyId={setSelectedCompanyId}
      />

      {/* Main Content Area */}
      <div className="ml-20 lg:ml-72 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="flex justify-between items-center px-6 lg:px-8 h-16">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{currentPage.title}</h1>
              <p className="text-sm text-slate-500">{currentPage.subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Rechercher... (Ctrl+K)"
                  className="w-64 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 
                           placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
              </button>

              {/* Help */}
              <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Dev Tools */}
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleGenerateTestData}
                disabled={generatingTestData}
                className="hidden lg:flex text-purple-600 hover:bg-purple-50"
              >
                {generatingTestData ? '⏳...' : '🧪 Test Data'}
              </Button>

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in">
            
            {/* LOADING STATE */}
            {loadingState === 'loading' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                  <p className="text-slate-500">Chargement...</p>
                </div>
              </div>
            )}

            {/* DASHBOARD VIEW */}
            {activeTab === 'dashboard' && loadingState === 'ready' && (
              <>
                {/* Message si pas d'entreprise */}
                {!selectedCompanyId && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Bienvenue sur Komptal !</h3>
                    <p className="text-slate-600 mb-6">
                      Pour commencer, créez votre première entreprise en cliquant sur le sélecteur d&apos;entreprise en haut à gauche.
                    </p>
                  </div>
                )}

                {/* Quick Stats - Calculés depuis les vrais documents */}
                {selectedCompanyId && (() => {
                  // Calcul des vraies stats depuis les documents
                  const now = new Date();
                  const thisMonth = documents.filter(d => {
                    const docDate = d.date ? new Date(d.date) : new Date(d.createdAt);
                    return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
                  });
                  
                  const revenus = thisMonth
                    .filter(d => d.docType === 'FACTURE_VENTE')
                    .reduce((sum, d) => sum + (d.amount || 0), 0);
                  
                  const depenses = thisMonth
                    .filter(d => d.docType === 'FACTURE_ACHAT' || d.docType === 'NOTE_FRAIS' || d.docType === 'RECU')
                    .reduce((sum, d) => sum + (d.amount || 0), 0);
                  
                  const tva = thisMonth
                    .reduce((sum, d) => sum + (d.vat || 0), 0);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard 
                        title="Revenus du mois" 
                        value={`${revenus.toLocaleString('fr-FR')} €`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        iconColor="text-success-500"
                      />
                      <StatCard 
                        title="Dépenses" 
                        value={`${depenses.toLocaleString('fr-FR')} €`}
                        icon={<TrendingDown className="w-6 h-6" />}
                        iconColor="text-danger-500"
                      />
                      <StatCard 
                        title="TVA collectée" 
                        value={`${tva.toLocaleString('fr-FR')} €`}
                        icon={<Receipt className="w-6 h-6" />}
                        iconColor="text-warning-500"
                      />
                      <StatCard 
                        title="Documents" 
                        value={documents.length.toString()}
                        icon={<FileText className="w-6 h-6" />}
                        iconColor="text-primary-500"
                      />
                    </div>
                  );
                })()}

                {/* Main Charts & KPIs - seulement si une entreprise est sélectionnée */}
                {selectedCompanyId && (
                  <Dashboard key={refreshKey} companyId={selectedCompanyId} />
                )}
              </>
            )}

            {/* UPLOAD VIEW */}
            {activeTab === 'upload' && loadingState === 'ready' && (
              <div className="max-w-3xl mx-auto">
                <UploadDocumentModern
                  companyId={selectedCompanyId || ''}
                  onUploadComplete={() => {
                    setRefreshKey(p => p + 1);
                    setActiveTab('documents');
                  }}
                />
              </div>
            )}

            {/* CONNECTORS VIEW */}
            {activeTab === 'connectors' && (
              <ConnectorHub 
                companyId={selectedCompanyId || ''}
                onDocumentsImported={() => {
                  setRefreshKey(p => p + 1);
                  fetchDocuments();
                }}
              />
            )}

            {/* EXTRACTION VIEW */}
            {activeTab === 'extraction' && (
              <ExtractionCenter 
                companyId={selectedCompanyId || ''}
                onDocumentsImported={() => {
                  setRefreshKey(p => p + 1);
                  fetchDocuments();
                }}
              />
            )}

            {/* WHATSAPP VIEW */}
            {activeTab === 'whatsapp' && (
              <div className="max-w-3xl mx-auto">
                <WhatsAppSetup />
              </div>
            )}

            {/* DOCUMENTS VIEW */}
            {activeTab === 'documents' && loadingState === 'ready' && (
              <div className="space-y-6">
                {/* Controls */}
                <Card padding="md" className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-30">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Rechercher une facture..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm 
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <DocumentFilters
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      selectedType={selectedType}
                      onTypeChange={setSelectedType}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                    />
                    <Button onClick={() => setActiveTab('upload')} leftIcon={<Plus className="w-4 h-4" />}>
                      Nouveau
                    </Button>
                  </div>
                </Card>

                {/* Liste des documents */}
                {documents.length === 0 ? (
                  <Card padding="lg" className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun document</h3>
                    <p className="text-slate-500 mb-6">Commencez par importer vos factures.</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setActiveTab('upload')} variant="outline">
                        Importer manuellement
                      </Button>
                      <Button onClick={() => setActiveTab('connectors')}>
                        Connecter Email
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {documents
                      .filter(doc => {
                        const matchesSearch = (doc.filename + doc.supplier).toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesType = selectedType === 'ALL' || doc.docType === selectedType;
                        return matchesSearch && matchesType;
                      })
                      .map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          onClick={() => setSelectedDocument(doc)}
                          selected={false}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TEAMS VIEW */}
            {activeTab === 'teams' && (
              <TeamsPage />
            )}

            {/* SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <SettingsPage />
            )}

            {/* SECURITY VIEW */}
            {activeTab === 'security' && (
              <div className="max-w-3xl mx-auto">
                <Card padding="lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Sécurité du compte</h3>
                      <p className="text-slate-500">Gérez les paramètres de sécurité</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-medium text-slate-900 mb-1">Authentification à deux facteurs</h4>
                      <p className="text-sm text-slate-600 mb-3">Ajoutez une couche de sécurité supplémentaire</p>
                      <Button variant="outline" size="sm">Configurer</Button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-medium text-slate-900 mb-1">Sessions actives</h4>
                      <p className="text-sm text-slate-600 mb-3">Gérez les appareils connectés à votre compte</p>
                      <Button variant="outline" size="sm">Voir les sessions</Button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-medium text-slate-900 mb-1">Changer le mot de passe</h4>
                      <p className="text-sm text-slate-600 mb-3">Mettez à jour votre mot de passe régulièrement</p>
                      <Button variant="outline" size="sm">Modifier</Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* BILLING VIEW */}
            {activeTab === 'billing' && (
              <div className="max-w-3xl mx-auto">
                <Card padding="lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Facturation</h3>
                      <p className="text-slate-500">Gérez votre abonnement et vos paiements</p>
                    </div>
                  </div>

                  {/* Plan actuel */}
                  <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-primary-600 font-medium">Plan actuel</p>
                        <h4 className="text-2xl font-bold text-primary-900">Gratuit</h4>
                        <p className="text-sm text-primary-700">Jusqu&apos;à 50 documents/mois</p>
                      </div>
                      <Button>Passer à Pro</Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-medium text-slate-900 mb-1">Historique des paiements</h4>
                      <p className="text-sm text-slate-500">Aucun paiement effectué</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-medium text-slate-900 mb-1">Moyen de paiement</h4>
                      <p className="text-sm text-slate-600 mb-3">Aucune carte enregistrée</p>
                      <Button variant="outline" size="sm">Ajouter une carte</Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* HELP VIEW */}
            {activeTab === 'help' && (
              <div className="max-w-3xl mx-auto">
                <Card padding="lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Aide & Support</h3>
                      <p className="text-slate-500">Comment pouvons-nous vous aider ?</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <h4 className="font-medium text-slate-900 mb-1">📚 Documentation</h4>
                      <p className="text-sm text-slate-600">Consultez nos guides détaillés</p>
                    </a>

                    <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <h4 className="font-medium text-slate-900 mb-1">💬 Chat en direct</h4>
                      <p className="text-sm text-slate-600">Discutez avec notre équipe</p>
                    </a>

                    <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <h4 className="font-medium text-slate-900 mb-1">📧 Email</h4>
                      <p className="text-sm text-slate-600">support@komptal.com</p>
                    </a>

                    <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <h4 className="font-medium text-slate-900 mb-1">🐛 Signaler un bug</h4>
                      <p className="text-sm text-slate-600">Aidez-nous à améliorer Komptal</p>
                    </a>
                  </div>
                </Card>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
