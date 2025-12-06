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
import { GmailImport } from '@/components/gmail/GmailImport';
import { DocumentDetail } from '@/components/DocumentDetail';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { TeamsPage } from '@/components/teams/TeamsPage';
import { OutlookImport } from '@/components/outlook/OutlookImport';
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
  HelpCircle
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
  const [companyCreationAttempted, setCompanyCreationAttempted] = useState(false);

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
      const response = await fetch('/api/companies');
      if (response.ok) {
        let data = await response.json();
        
        // Si aucune entreprise, en créer une automatiquement (une seule fois)
        if (data.length === 0 && session?.user?.email && !companyCreationAttempted) {
          setCompanyCreationAttempted(true);
          const userName = session.user.name || session.user.email.split('@')[0];
          const createResponse = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Entreprise de ${userName}`,
            }),
          });
          if (createResponse.ok) {
            const newCompany = await createResponse.json();
            data = [newCompany];
          }
        }
        
        setCompanies(data);
        if (data.length > 0 && !selectedCompanyId) setSelectedCompanyId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
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
    gmail: { title: 'Import Gmail', subtitle: 'Récupérez automatiquement vos factures' },
    outlook: { title: 'Import Outlook', subtitle: 'Importez depuis Office 365' },
    documents: { title: 'Mes Factures', subtitle: 'Gérez tous vos documents' },
    teams: { title: 'Équipes', subtitle: 'Collaborez avec vos collègues' },
    settings: { title: 'Paramètres', subtitle: 'Gérez votre compte et vos préférences' },
  };

  const currentPage = pageTitles[activeTab] || { title: '', subtitle: '' };

  return (
    <div className="min-h-screen bg-slate-50">
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
            
            {/* NO COMPANY - AUTO CREATING */}
            {companies.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                  <p className="text-slate-500">Configuration de votre espace...</p>
                </div>
              </div>
            )}

            {/* DASHBOARD VIEW */}
            {activeTab === 'dashboard' && selectedCompanyId && (
              <>
                {/* Quick Stats - Calculés depuis les vrais documents */}
                {(() => {
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
                  
                  const facturesEnAttente = documents.filter(d => !d.analyzed).length;

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

                {/* Main Charts & KPIs */}
                <Dashboard key={refreshKey} companyId={selectedCompanyId} />
              </>
            )}

            {/* UPLOAD VIEW */}
            {activeTab === 'upload' && selectedCompanyId && (
              <div className="max-w-3xl mx-auto">
                <UploadDocumentModern
                  companyId={selectedCompanyId}
                  onUploadComplete={() => {
                    setRefreshKey(p => p + 1);
                    setActiveTab('documents');
                  }}
                />
              </div>
            )}

            {/* GMAIL IMPORT VIEW */}
            {activeTab === 'gmail' && selectedCompanyId && (
              <div className="max-w-4xl mx-auto">
                <GmailImport 
                  companyId={selectedCompanyId}
                  onImportComplete={() => {
                    setRefreshKey(p => p + 1);
                  }}
                />
              </div>
            )}

            {/* OUTLOOK IMPORT VIEW */}
            {activeTab === 'outlook' && selectedCompanyId && (
              <div className="max-w-4xl mx-auto">
                <OutlookImport 
                  companyId={selectedCompanyId}
                  onImportComplete={() => {
                    setRefreshKey(p => p + 1);
                  }}
                />
              </div>
            )}

            {/* DOCUMENTS VIEW */}
            {activeTab === 'documents' && selectedCompanyId && (
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

                {/* Documents Grid */}
                {documents.length === 0 ? (
                  <Card padding="lg" className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun document</h3>
                    <p className="text-slate-500 mb-6">Commencez par importer vos factures pour activer l'IA.</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setActiveTab('upload')} variant="outline">
                        Importer manuellement
                      </Button>
                      <Button onClick={() => setActiveTab('gmail')}>
                        Connecter Gmail
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-250px)]">
                    {/* List */}
                    <div className="overflow-y-auto space-y-3 custom-scrollbar">
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
                            selected={selectedDocument?.id === doc.id}
                          />
                        ))}
                    </div>

                    {/* Detail Preview */}
                    <Card padding="lg" className="hidden lg:block sticky top-32 h-fit">
                      {selectedDocument ? (
                        <DocumentDetail 
                          document={selectedDocument} 
                          onAnalyzed={() => {
                            setRefreshKey(p => p + 1);
                            fetchDocuments();
                          }}
                        />
                      ) : (
                        <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                          <Search className="w-12 h-12 mb-4 opacity-50" />
                          <p>Sélectionnez un document pour voir les détails</p>
                        </div>
                      )}
                    </Card>
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

          </div>
        </main>
      </div>
    </div>
  );
}
