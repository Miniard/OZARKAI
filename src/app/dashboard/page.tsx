/**
 * Dashboard Page - Design Pro Style
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { UploadDocumentModern } from '@/components/UploadDocumentModern';
import { DocumentDetail } from '@/components/DocumentDetail';
import { DocumentsTable } from '@/components/documents/DocumentsTable';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { ConnectorHub } from '@/components/connectors/ConnectorHub';
import { ExtractionCenter } from '@/components/connectors/ExtractionCenter';
import { WhatsAppSetup } from '@/components/whatsapp/WhatsAppSetup';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Search, 
  FileText,
  RefreshCw,
  Building2,
  Shield,
  Download,
  CreditCard,
  HelpCircle
} from 'lucide-react';

// Types pour les filtres
type DocumentFilter = 'all' | 'to_export' | 'exported' | 'to_review' | 'recent';

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
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>('all');
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Export functions
  const handleExport = async (format: 'csv' | 'json') => {
    if (!selectedCompanyId) return;
    setIsExporting(true);
    try {
      const response = await fetch(`/api/documents/export?companyId=${selectedCompanyId}&format=${format}`);
      if (!response.ok) throw new Error('Erreur export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `factures-${format === 'csv' ? 'export' : 'data'}.${format}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} document(s) sélectionné(s) ?`)) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/documents/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      fetchDocuments();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Single Document Delete
  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    
    try {
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchDocuments();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Bulk Export
  const handleBulkExport = async (format: 'csv' | 'json') => {
    if (selectedIds.size === 0) return;
    setIsExporting(true);
    try {
      const response = await fetch('/api/documents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: Array.from(selectedIds),
          format,
        }),
      });
      
      if (!response.ok) throw new Error('Erreur export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `factures-selection.${format}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Bulk export error:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

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

  // Filter counts
  const filterCounts = {
    all: documents.length,
    to_export: documents.filter(d => !d.exported).length,
    exported: documents.filter(d => d.exported).length,
    to_review: documents.filter(d => !d.analyzed).length,
    recent: documents.filter(d => {
      const date = new Date(d.createdAt);
      const now = new Date();
      return (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 jours
    }).length,
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Page titles
  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de votre activité' },
    upload: { title: 'Importer', subtitle: 'Importez vos factures et reçus' },
    connectors: { title: 'Connexions', subtitle: 'Connectez vos comptes email' },
    extraction: { title: 'Extraction', subtitle: 'Extrayez vos factures automatiquement' },
    documents: { title: 'Documents', subtitle: 'Factures et reçus importés' },
    settings: { title: 'Paramètres', subtitle: 'Configuration du compte' },
    billing: { title: 'Facturation', subtitle: 'Abonnement et paiements' },
    help: { title: 'Aide', subtitle: 'Support et documentation' },
    security: { title: 'Sécurité', subtitle: 'Paramètres de sécurité' },
  };

  const currentPage = pageTitles[activeTab] || { title: '', subtitle: '' };

  // Filter tabs
  const filterTabs: { id: DocumentFilter; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'to_export', label: 'À exporter' },
    { id: 'exported', label: 'Exportés' },
    { id: 'to_review', label: 'À vérifier' },
    { id: 'recent', label: 'Récents' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Document ouvert en plein écran */}
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
      <div className="ml-16 lg:ml-60 transition-all duration-200 bg-slate-50 min-h-screen">
        {/* Page Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{currentPage.title}</h1>
                <p className="text-sm text-slate-500">{currentPage.subtitle}</p>
              </div>

              {/* Actions Header */}
              <div className="flex items-center gap-2">
                {activeTab === 'dashboard' && (
                  <button 
                    onClick={() => setRefreshKey(p => p + 1)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualiser
                  </button>
                )}
              </div>
            </div>

            {/* Filter Bar - Style Receptor AI (only on documents view) */}
            {activeTab === 'documents' && (
              <div className="mt-4 flex items-center justify-between">
                {/* Left: Filter Tabs */}
                <div className="flex items-center gap-4">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`flex items-center gap-2 text-sm font-medium transition-all pb-2 border-b-2
                        ${activeFilter === tab.id
                          ? 'text-slate-900 border-slate-900'
                          : 'text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                    >
                      {tab.label}
                      <span className={`px-1.5 py-0.5 rounded text-xs
                        ${activeFilter === tab.id
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-500'
                        }`}>
                        {filterCounts[tab.id]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm 
                               focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white
                               placeholder:text-slate-400 transition-all"
                    />
                  </div>

                  {/* Export Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Exporter
                    </button>

                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        <button
                          onClick={() => handleExport('csv')}
                          disabled={isExporting}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={() => handleExport('json')}
                          disabled={isExporting}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Export JSON
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-in">
            
            {/* LOADING STATE */}
            {loadingState === 'loading' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              </div>
            )}

            {/* DASHBOARD VIEW */}
            {activeTab === 'dashboard' && loadingState === 'ready' && (
              <>
                {!selectedCompanyId && (
                  <Card padding="lg" className="text-center py-16">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Bienvenue sur Komptal !</h3>
                    <p className="text-slate-600 mb-6">
                      Commencez par connecter votre email ou importer des documents.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => setActiveTab('connectors')}>
                        Connecter Email
                      </Button>
                      <Button onClick={() => setActiveTab('upload')}>
                        Importer
                      </Button>
                    </div>
                  </Card>
                )}

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

            {/* DOCUMENTS VIEW */}
            {activeTab === 'documents' && loadingState === 'ready' && (
              <div className="space-y-6">
                {documents.length === 0 ? (
                  /* Empty State Pro */
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun document trouvé</h3>
                      <p className="text-slate-500 text-center mb-6 max-w-sm">
                        Commencez par extraire des documents depuis votre email ou importez-les manuellement.
                      </p>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setActiveTab('extraction')}>
                          Extraction rétroactive
                        </Button>
                        <Button onClick={() => setActiveTab('upload')}>
                          Importer
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Vue Tableau */}
                    <DocumentsTable
                      documents={documents.filter(doc => {
                        const matchesSearch = (doc.filename + (doc.supplier || '')).toLowerCase().includes(searchTerm.toLowerCase());
                        let matchesFilter = true;
                        if (activeFilter === 'to_export') matchesFilter = !doc.exported;
                        if (activeFilter === 'exported') matchesFilter = doc.exported === true;
                        if (activeFilter === 'to_review') matchesFilter = !doc.analyzed;
                        if (activeFilter === 'recent') {
                          const date = new Date(doc.createdAt);
                          const now = new Date();
                          matchesFilter = (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
                        }
                        return matchesSearch && matchesFilter;
                      })}
                      onDocumentClick={(doc) => setSelectedDocument(doc)}
                      selectedIds={selectedIds}
                      onSelectionChange={setSelectedIds}
                      onDeleteSelected={handleBulkDelete}
                      onExportSelected={(format) => handleBulkExport(format)}
                      onDeleteDocument={handleDeleteDocument}
                    />
                  </>
                )}
              </div>
            )}

            {/* SETTINGS VIEW */}
            {activeTab === 'settings' && <SettingsPage />}

            {/* SECURITY VIEW */}
            {activeTab === 'security' && (
              <Card padding="lg" className="max-w-3xl mx-auto">
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
                    <p className="text-sm text-slate-600 mb-3">Gérez les appareils connectés</p>
                    <Button variant="outline" size="sm">Voir les sessions</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* BILLING VIEW */}
            {activeTab === 'billing' && (
              <Card padding="lg" className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Facturation</h3>
                    <p className="text-slate-500">Gérez votre abonnement</p>
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
                </div>
              </Card>
            )}

            {/* HELP VIEW */}
            {activeTab === 'help' && (
              <Card padding="lg" className="max-w-3xl mx-auto">
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
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
