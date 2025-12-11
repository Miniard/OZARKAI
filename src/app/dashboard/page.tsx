/**
 * Dashboard Page - Design Style Receptor AI
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
  Download,
  Filter,
  LayoutGrid,
  List,
  Building2,
  Shield,
  CreditCard,
  HelpCircle,
  RefreshCcw,
  ChevronDown,
  Eye
} from 'lucide-react';

// Types pour les filtres
type DocumentFilter = 'all' | 'to_export' | 'exported' | 'to_review' | 'last_extracted';
type ViewMode = 'grid' | 'list';

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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
    last_extracted: documents.filter(d => {
      const date = new Date(d.createdAt);
      const now = new Date();
      return (now.getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
    }).length,
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Page titles
  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your activity' },
    upload: { title: 'Quick Upload', subtitle: 'Drag and drop your invoices' },
    connectors: { title: 'Email Accounts', subtitle: 'Connect your email to auto-import' },
    extraction: { title: 'Retroactive Extraction', subtitle: 'Extract invoices by date range' },
    documents: { title: 'Accounting documents', subtitle: 'All receipts and invoices (paid and unpaid) ready for reconciliation' },
    teams: { title: 'Integrations', subtitle: 'Connect your tools' },
    settings: { title: 'Settings', subtitle: 'Manage your preferences' },
    billing: { title: 'Exports History', subtitle: 'View your export history' },
    help: { title: 'Help & Support', subtitle: 'Get help' },
    analytics: { title: 'Analytics', subtitle: 'Track your financial metrics' },
    bills: { title: 'Bills to Pay', subtitle: 'Upcoming payments' },
    recurring: { title: 'Recurring', subtitle: 'Recurring invoices' },
    vendors: { title: 'Vendors', subtitle: 'Manage your vendors' },
  };

  const currentPage = pageTitles[activeTab] || { title: '', subtitle: '' };

  // Filter tabs config
  const filterTabs: { id: DocumentFilter; label: string; icon?: any }[] = [
    { id: 'all', label: 'All' },
    { id: 'to_export', label: 'To Export' },
    { id: 'exported', label: 'Exported' },
    { id: 'to_review', label: 'To Review' },
    { id: 'last_extracted', label: 'Last Extracted' },
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
            if (confirm('Delete this document?')) {
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
      <div className="ml-64 transition-all duration-300">
        {/* Top Banner - Subscription Warning (like Receptor) */}
        <div className="bg-rose-500 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs">!</span>
            <span>
              You don&apos;t have an active subscription. You can run{' '}
              <button onClick={() => setActiveTab('extraction')} className="underline font-medium">
                Retroactive Extractions
              </button>
              , but you&apos;ll need to subscribe to monitor email accounts or upload documents.
            </span>
          </div>
          <button className="px-4 py-1.5 bg-white text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors">
            Start free trial
          </button>
        </div>

        {/* Page Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{currentPage.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{currentPage.subtitle}</p>
            </div>

            {/* Export Button (only on documents view) */}
            {activeTab === 'documents' && (
              <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export All
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>

          {/* Filter Tabs (only on documents view) */}
          {activeTab === 'documents' && (
            <div className="mt-6 flex items-center justify-between">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                      ${activeFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded text-xs
                      ${activeFilter === tab.id
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-200/50 text-slate-500'
                      }`}>
                      {filterCounts[tab.id]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm 
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 
                             placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* View Buttons */}
                <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Eye className="w-4 h-4" />
                  Load View
                </button>

                <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Actions
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto animate-in">
            
            {/* LOADING STATE */}
            {loadingState === 'loading' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                  <p className="text-slate-500">Loading...</p>
                </div>
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
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Welcome to Komptal!</h3>
                    <p className="text-slate-600 mb-6">
                      Get started by connecting your first email account or uploading documents.
                    </p>
                  </Card>
                )}

                {selectedCompanyId && (() => {
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
                  
                  const tva = thisMonth.reduce((sum, d) => sum + (d.vat || 0), 0);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <StatCard 
                        title="Revenue" 
                        value={`€${revenus.toLocaleString('fr-FR')}`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        iconColor="text-primary-500"
                      />
                      <StatCard 
                        title="Expenses" 
                        value={`€${depenses.toLocaleString('fr-FR')}`}
                        icon={<TrendingDown className="w-6 h-6" />}
                        iconColor="text-rose-500"
                      />
                      <StatCard 
                        title="VAT Collected" 
                        value={`€${tva.toLocaleString('fr-FR')}`}
                        icon={<Receipt className="w-6 h-6" />}
                        iconColor="text-amber-500"
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
                  /* Empty State - Style Receptor */
                  <div className="bg-white rounded-xl border border-slate-200 border-dashed">
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No documents found</h3>
                      <p className="text-slate-500 text-center mb-6">
                        Start by extracting documents<br />
                        from your inbox, chats, or uploads.
                      </p>
                      <button 
                        onClick={() => setActiveTab('extraction')}
                        className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Start a Retroactive Extraction
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-2'
                  }>
                    {documents
                      .filter(doc => {
                        const matchesSearch = (doc.filename + doc.supplier).toLowerCase().includes(searchTerm.toLowerCase());
                        
                        // Apply filters
                        let matchesFilter = true;
                        if (activeFilter === 'to_export') matchesFilter = !doc.exported;
                        if (activeFilter === 'exported') matchesFilter = doc.exported;
                        if (activeFilter === 'to_review') matchesFilter = !doc.analyzed;
                        if (activeFilter === 'last_extracted') {
                          const date = new Date(doc.createdAt);
                          const now = new Date();
                          matchesFilter = (now.getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
                        }
                        
                        return matchesSearch && matchesFilter;
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
            {activeTab === 'teams' && <TeamsPage />}

            {/* SETTINGS VIEW */}
            {activeTab === 'settings' && <SettingsPage />}

            {/* ANALYTICS VIEW */}
            {activeTab === 'analytics' && selectedCompanyId && (
              <Dashboard key={refreshKey} companyId={selectedCompanyId} />
            )}

            {/* SECURITY VIEW */}
            {activeTab === 'security' && (
              <Card padding="lg" className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Security</h3>
                    <p className="text-slate-500">Manage your account security</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-medium text-slate-900 mb-1">Two-factor authentication</h4>
                    <p className="text-sm text-slate-600 mb-3">Add an extra layer of security</p>
                    <Button variant="outline" size="sm">Configure</Button>
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
                    <h3 className="text-xl font-semibold text-slate-900">Exports History</h3>
                    <p className="text-slate-500">View your previous exports</p>
                  </div>
                </div>
                <div className="text-center py-10 text-slate-500">
                  No exports yet
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
                    <h3 className="text-xl font-semibold text-slate-900">Help & Support</h3>
                    <p className="text-slate-500">How can we help you?</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <h4 className="font-medium text-slate-900 mb-1">📚 Documentation</h4>
                    <p className="text-sm text-slate-600">Read our detailed guides</p>
                  </a>
                  <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <h4 className="font-medium text-slate-900 mb-1">💬 Live Chat</h4>
                    <p className="text-sm text-slate-600">Talk to our team</p>
                  </a>
                  <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <h4 className="font-medium text-slate-900 mb-1">📧 Email</h4>
                    <p className="text-sm text-slate-600">support@komptal.com</p>
                  </a>
                  <a href="#" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <h4 className="font-medium text-slate-900 mb-1">🐛 Report a bug</h4>
                    <p className="text-sm text-slate-600">Help us improve</p>
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
