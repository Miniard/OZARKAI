'use client';

import { useState, useEffect } from 'react';
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
  Shield,
  Zap,
  Clock,
  Inbox,
  Sparkles,
  Calendar
} from 'lucide-react';

interface OutlookImportProps {
  companyId: string;
  onImportComplete?: () => void;
}

interface EmailWithInvoice {
  id: string;
  subject: string;
  from: string;
  date: string;
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
  isSelected: boolean;
  status: 'pending' | 'importing' | 'imported' | 'error';
}

export function OutlookImport({ companyId, onImportComplete }: OutlookImportProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [emails, setEmails] = useState<EmailWithInvoice[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Vérifier seulement le status (pas les emails)
  const checkConnectionStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/outlook?action=status');
      const data = await response.json();
      setIsConnected(data.connected);
      
      // Si connecté, scanner automatiquement les emails
      if (data.connected) {
        await scanEmails();
      }
    } catch (error) {
      console.error('Erreur vérification connexion:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Scanner les emails (séparé du check status)
  const scanEmails = async () => {
    try {
      const response = await fetch('/api/outlook');
      const data = await response.json();
      
      if (!data.connected) {
        setIsConnected(false);
        return;
      }
      
      if (data.emails) {
        setEmails(data.emails.map((e: any) => ({ ...e, isSelected: false, status: 'pending' })));
      }
    } catch (error) {
      console.error('Erreur scan emails:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/outlook/authorize');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError('Erreur de configuration Outlook');
      }
    } catch (error) {
      setError('Erreur lors de la connexion à Outlook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/outlook');
      const data = await response.json();
      
      if (!data.connected) {
        setIsConnected(false);
        setEmails([]);
        return;
      }
      
      if (data.emails) {
        setEmails(data.emails.map((e: any) => ({ ...e, isSelected: false, status: 'pending' })));
      }
    } catch (error) {
      setError('Erreur lors du scan des emails');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelect = (emailId: string) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, isSelected: !e.isSelected } : e
    ));
  };

  const selectAll = () => {
    const allSelected = emails.every(e => e.isSelected);
    setEmails(prev => prev.map(e => ({ ...e, isSelected: !allSelected })));
  };

  const handleImport = async () => {
    const selectedEmails = emails.filter(e => e.isSelected && e.status === 'pending');
    if (selectedEmails.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Marquer comme "importing"
      setEmails(prev => prev.map(e => 
        e.isSelected ? { ...e, status: 'importing' } : e
      ));

      const response = await fetch('/api/outlook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          emails: selectedEmails,
        }),
      });

      const result = await response.json();

      // Marquer comme importé
      setEmails(prev => prev.map(e => 
        e.isSelected ? { ...e, status: 'imported', isSelected: false } : e
      ));

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setError('Erreur lors de l\'import');
      setEmails(prev => prev.map(e => 
        e.status === 'importing' ? { ...e, status: 'error' } : e
      ));
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = emails.filter(e => e.isSelected).length;
  const importedCount = emails.filter(e => e.status === 'imported').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Non connecté
  if (!isConnected) {
    return (
      <Card padding="lg" className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
          <svg className="w-12 h-12" viewBox="0 0 24 24">
            <path fill="#0078D4" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h14.9q.44 0 .75.3.3.3.3.75V12zm-6-8.25v3h3v-3h-3zm0 4.5v3h3v-3h-3zm0 4.5v1.83l3.05-1.83H18zm-5.25-9v3h3.75v-3h-3.75zm0 4.5v3h3.75v-3h-3.75zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73h-3.75zM9 3.75V6h2l.13.01.12.04v-2.3H9zM3.13 21h11.12v-2.56l-2.8-1.69H6v1.89H3.13V21zm3-4.5h1.56l.02-2.5h1.54v2.5h1.02l-.01-2.5H12V7.13H6.13V16.5zm-3 1.88V10H3V8H1v9.38h2.13z"/>
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Connecter Outlook
        </h3>
        <p className="text-slate-500 mb-6">
          Importez automatiquement vos factures depuis votre boîte mail Outlook/Office 365
        </p>

        {error && (
          <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
            {error}
          </div>
        )}

        <Button onClick={handleConnect} disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connexion...
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 mr-2" />
              Se connecter avec Microsoft
            </>
          )}
        </Button>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-xl">
            <Shield className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Sécurisé OAuth 2.0</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Import automatique</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Gain de temps</p>
          </div>
        </div>
      </Card>
    );
  }

  // Connecté - Interface d'import
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md" className="bg-emerald-50 border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-800">Outlook connecté</p>
              <p className="text-sm text-emerald-600">{emails.length} email(s) avec factures trouvé(s)</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleScan} disabled={isScanning}>
            {isScanning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Filtres */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
            <span className="text-slate-400">à</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleScan}>
            Filtrer
          </Button>
        </div>
      </Card>

      {/* Liste des emails */}
      {emails.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Aucun email avec facture trouvé</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={emails.every(e => e.isSelected)}
                onChange={selectAll}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-600">
                {selectedCount > 0 ? `${selectedCount} sélectionné(s)` : 'Tout sélectionner'}
              </span>
            </div>
            {selectedCount > 0 && (
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Importer ({selectedCount})
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {emails.map((email) => (
              <div 
                key={email.id}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors ${
                  email.status === 'imported' ? 'bg-emerald-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={email.isSelected}
                  onChange={() => toggleSelect(email.id)}
                  disabled={email.status !== 'pending'}
                  className="w-4 h-4 rounded border-slate-300"
                />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{email.subject}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{email.from}</span>
                    <span>•</span>
                    <span>{new Date(email.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {email.attachments.map((att, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 bg-slate-100 rounded-lg flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      {att.filename.length > 15 ? att.filename.slice(0, 15) + '...' : att.filename}
                    </span>
                  ))}
                </div>

                {email.status === 'imported' && (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
                {email.status === 'importing' && (
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                )}
                {email.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-danger-500" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Résumé */}
      {importedCount > 0 && (
        <Card padding="md" className="bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-800">
              <strong>{importedCount}</strong> facture(s) importée(s) avec succès !
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}


