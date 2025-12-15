/**
 * Composant GmailImport - Import automatique des factures depuis Gmail
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  FileText,
  Download,
  ExternalLink,
  Shield,
  Zap,
  Clock,
  Search,
  Settings,
  Inbox,
  Sparkles,
  LogOut
} from 'lucide-react';

interface GmailImportProps {
  companyId: string;
  onImportComplete?: () => void;
}

interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface EmailWithInvoice {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  attachments: EmailAttachment[];
  isSelected: boolean;
  status: 'pending' | 'importing' | 'imported' | 'error';
  invoiceType?: 'pdf' | 'image' | 'html';
  hasHtmlContent?: boolean;
}

export function GmailImport({ companyId, onImportComplete }: GmailImportProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [emails, setEmails] = useState<EmailWithInvoice[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'images' | 'html'>('all');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Vérifier la connexion Gmail au chargement
  const checkGmailConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gmail/status');
      const data = await response.json();
      
      setIsConnected(data.connected);
      setUserEmail(data.email);
      
      // Si connecté, scanner les emails automatiquement
      if (data.connected) {
        await scanEmails();
      }
    } catch (err) {
      console.error('Error checking Gmail status:', err);
      setError('Erreur lors de la vérification de la connexion Gmail');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkGmailConnection();
  }, [checkGmailConnection]);

  // Vérifier le retour OAuth (paramètres URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gmailStatus = urlParams.get('gmail');
    
    if (gmailStatus === 'success') {
      setIsConnected(true);
      scanEmails();
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (gmailStatus === 'error') {
      setError('Erreur lors de la connexion à Gmail');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnectGmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gmail/authorize');
      const data = await response.json();
      
      if (data.authUrl) {
        // Rediriger vers Google OAuth
        window.location.href = data.authUrl;
      } else {
        setError('Impossible de démarrer la connexion Gmail');
      }
    } catch (err) {
      console.error('Error connecting Gmail:', err);
      setError('Erreur lors de la connexion à Gmail');
      setIsLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await fetch('/api/gmail/status', { method: 'DELETE' });
      setIsConnected(false);
      setEmails([]);
      setUserEmail(null);
    } catch (err) {
      console.error('Error disconnecting Gmail:', err);
      setError('Erreur lors de la déconnexion');
    }
  };

  const scanEmails = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/gmail');
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          // Token expiré, besoin de reconnecter
          setIsConnected(false);
          setError('Session expirée, veuillez reconnecter Gmail');
          return;
        }
        throw new Error(data.error || 'Erreur lors du scan');
      }
      
      const data = await response.json();
      
      const emailsWithSelection: EmailWithInvoice[] = (data.emails || []).map((email: Omit<EmailWithInvoice, 'isSelected' | 'status'>) => ({
        ...email,
        isSelected: true,
        status: 'pending' as const,
      }));
      
      setEmails(emailsWithSelection);
      setSelectedCount(emailsWithSelection.length);
      setLastSync(new Date());
    } catch (err) {
      console.error('Error scanning emails:', err);
      setError('Erreur lors du scan des emails');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    setEmails(prev => {
      const updated = prev.map(e => 
        e.id === emailId ? { ...e, isSelected: !e.isSelected } : e
      );
      setSelectedCount(updated.filter(e => e.isSelected).length);
      return updated;
    });
  };

  const selectAll = () => {
    setEmails(prev => {
      const allSelected = prev.every(e => e.isSelected);
      const updated = prev.map(e => ({ ...e, isSelected: !allSelected }));
      setSelectedCount(!allSelected ? updated.length : 0);
      return updated;
    });
  };

  const handleImport = async () => {
    const selectedEmails = emails.filter(e => e.isSelected && e.status === 'pending');
    if (selectedEmails.length === 0) return;

    setImportProgress(0);
    let importedCount = 0;
    
    for (const email of selectedEmails) {
      // Mettre à jour le statut
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, status: 'importing' } : e
      ));

      try {
        // Utiliser /api/gmail/import qui gère TOUT (PJ + HTML)
        const response = await fetch('/api/gmail/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: email.id,
            companyId,
          }),
        });

        if (!response.ok) {
          throw new Error('Import failed');
        }
        
        const result = await response.json();
        console.log(`✅ Importé: ${result.importedCount} document(s)`);
        
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, status: 'imported' } : e
        ));
      } catch (err) {
        console.error('Error importing email:', email.id, err);
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, status: 'error' } : e
        ));
      }

      importedCount++;
      setImportProgress(Math.round((importedCount / selectedEmails.length) * 100));
    }

    onImportComplete?.();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Loading initial
  if (isLoading && !isConnected) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-slate-600">Vérification de la connexion Gmail...</span>
        </div>
      </Card>
    );
  }

  // Vue non connectée
  if (!isConnected) {
    return (
      <div className="space-y-6">
        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Connectez votre Gmail</h2>
                <p className="text-red-100">Importez automatiquement toutes vos factures</p>
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-3 bg-white/20 rounded-lg flex items-center gap-2 text-white">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-sm">Import automatique</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                <Shield className="w-5 h-5 text-green-300" />
                <span className="text-sm">100% sécurisé</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                <Clock className="w-5 h-5 text-blue-300" />
                <span className="text-sm">Sync automatique</span>
              </div>
            </div>

            <Button 
              onClick={handleConnectGmail}
              isLoading={isLoading}
              size="lg"
              className="bg-white text-primary-600 hover:bg-primary-50"
              leftIcon={<Mail className="w-5 h-5" />}
            >
              Connecter mon compte Gmail
            </Button>
          </div>
        </Card>

        {/* How it works */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Comment ça marche ?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <StepItem 
              number={1}
              title="Connexion sécurisée"
              description="Autorisez Komptal à lire vos emails (lecture seule)"
              icon={<Shield className="w-5 h-5" />}
            />
            <StepItem 
              number={2}
              title="Scan intelligent"
              description="Notre IA détecte automatiquement les factures et reçus"
              icon={<Sparkles className="w-5 h-5" />}
            />
            <StepItem 
              number={3}
              title="Import en un clic"
              description="Sélectionnez et importez les documents souhaités"
              icon={<Download className="w-5 h-5" />}
            />
          </div>
        </Card>

        {/* Security notice */}
        <Card padding="md" className="bg-slate-50 border-slate-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">Vos données sont protégées</h4>
              <p className="text-sm text-slate-600">
                Komptal utilise OAuth 2.0 et n'a accès qu'en lecture seule à vos emails. 
                Nous ne stockons jamais vos identifiants. Vous pouvez révoquer l'accès à tout moment.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Vue connectée
  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Gmail connecté</h3>
              <p className="text-sm text-slate-500">
                {userEmail || (lastSync ? `Dernière sync: ${lastSync.toLocaleString('fr-FR')}` : 'Synchronisation...')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={scanEmails}
              isLoading={isScanning}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Actualiser
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDisconnectGmail}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Déconnecter
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card padding="md" className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Search & Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher dans les emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm 
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterButton 
              active={filterType === 'all'} 
              onClick={() => setFilterType('all')}
            >
              Tous
            </FilterButton>
            <FilterButton 
              active={filterType === 'pdf'} 
              onClick={() => setFilterType('pdf')}
            >
              PDF
            </FilterButton>
            <FilterButton 
              active={filterType === 'images'} 
              onClick={() => setFilterType('images')}
            >
              Images
            </FilterButton>
            <FilterButton 
              active={filterType === 'html'} 
              onClick={() => setFilterType('html')}
            >
              HTML
            </FilterButton>
          </div>
        </div>
      </Card>

      {/* Emails List */}
      <Card padding="none">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                emails.length > 0 && emails.every(e => e.isSelected) ? 'bg-primary-500 border-primary-500' : 'border-slate-300'
              }`}>
                {emails.length > 0 && emails.every(e => e.isSelected) && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              Tout sélectionner
            </button>
            <span className="text-sm text-slate-400">
              {selectedCount} sur {emails.length} sélectionné(s)
            </span>
          </div>
          {selectedCount > 0 && (
            <Button 
              onClick={handleImport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Importer ({selectedCount})
            </Button>
          )}
        </div>

        {isScanning ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Scan de vos emails en cours...</p>
            <p className="text-sm text-slate-400 mt-1">Recherche des factures et reçus</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucune facture trouvée</p>
            <p className="text-sm text-slate-400 mt-1">Essayez d'actualiser ou vérifiez vos filtres</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {emails
              .filter(email => {
                // Filtre par recherche
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  if (!email.subject.toLowerCase().includes(query) && 
                      !email.from.toLowerCase().includes(query)) {
                    return false;
                  }
                }
                // Filtre par type
                if (filterType !== 'all') {
                  if (filterType === 'pdf' && email.invoiceType !== 'pdf') return false;
                  if (filterType === 'images' && email.invoiceType !== 'image') return false;
                  if (filterType === 'html' && email.invoiceType !== 'html') return false;
                }
                return true;
              })
              .map((email) => (
                <EmailRow 
                  key={email.id}
                  email={email}
                  onToggle={() => toggleEmailSelection(email.id)}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              ))}
          </div>
        )}
      </Card>

      {/* Import Progress */}
      {importProgress > 0 && importProgress < 100 && (
        <Card padding="md" className="bg-primary-50 border-primary-100">
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-primary-700 font-medium">Import en cours...</span>
                <span className="text-primary-600">{importProgress}%</span>
              </div>
              <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ===========================================
   SUB-COMPONENTS
   =========================================== */

function StepItem({ number, title, description }: { 
  number: number; 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-medium text-slate-900 mb-1">{title}</h4>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-primary-100 text-primary-700' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function EmailRow({ email, onToggle, formatFileSize, formatDate }: {
  email: EmailWithInvoice;
  onToggle: () => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: string) => string;
}) {
  const statusStyles = {
    pending: '',
    importing: 'bg-primary-50',
    imported: 'bg-green-50',
    error: 'bg-red-50',
  };

  const statusIcons = {
    pending: null,
    importing: <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />,
    imported: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
  };

  return (
    <div className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${statusStyles[email.status]}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={email.status !== 'pending'}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          email.isSelected 
            ? 'bg-primary-500 border-primary-500' 
            : 'border-slate-300 hover:border-slate-400'
        } ${email.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {email.isSelected && <CheckCircle className="w-3 h-3 text-white" />}
      </button>

      {/* Email icon */}
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Mail className="w-5 h-5 text-slate-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-slate-900 truncate">{email.subject}</p>
          {statusIcons[email.status]}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="truncate">{email.from}</span>
          <span className="text-slate-300">•</span>
          <span>{formatDate(email.date)}</span>
        </div>
      </div>

      {/* Type de facture + Attachments */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Badge du type */}
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          email.invoiceType === 'pdf' ? 'bg-red-100 text-red-700' :
          email.invoiceType === 'image' ? 'bg-blue-100 text-blue-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {email.invoiceType === 'pdf' ? 'PDF' :
           email.invoiceType === 'image' ? 'Image' : 'HTML'}
        </span>
        
        {/* Attachments si présents */}
        {email.attachments.length > 0 ? (
          email.attachments.map(att => (
            <div 
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 max-w-32 truncate">{att.filename}</span>
              <span className="text-slate-400 text-xs">{formatFileSize(att.size)}</span>
            </div>
          ))
        ) : (
          <span className="text-xs text-slate-400 italic">Dans le corps de l'email</span>
        )}
      </div>

      {/* Actions */}
      <button className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}

