/**
 * ExtractionCenter - Centre d'extraction des factures email
 * Affiche les emails des connecteurs et permet d'importer les factures
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  FileText, 
  Download, 
  CheckCircle, 
  Loader2, 
  Search,
  Filter,
  RefreshCw,
  Paperclip,
  Calendar,
  User,
  AlertCircle,
  Sparkles,
  Check,
  X
} from 'lucide-react';

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  date: string;
  hasAttachments: boolean;
  attachmentCount?: number;
  source: 'gmail' | 'outlook';
  selected?: boolean;
  imported?: boolean;
}

interface ExtractionCenterProps {
  companyId: string;
  onImportComplete?: () => void;
  onNavigateToConnector: () => void;
}

export function ExtractionCenter({ companyId, onImportComplete, onNavigateToConnector }: ExtractionCenterProps) {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'gmail' | 'outlook'>('all');
  const [connections, setConnections] = useState({ gmail: false, outlook: false });
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    checkConnectionsAndScan();
  }, []);

  const checkConnectionsAndScan = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Vérifier les connexions
      const [gmailRes, outlookRes] = await Promise.all([
        fetch('/api/gmail/status'),
        fetch('/api/outlook/status'),
      ]);
      
      const gmailData = await gmailRes.json();
      const outlookData = await outlookRes.json();
      
      const gmailConnected = gmailData.connected || false;
      const outlookConnected = outlookData.connected || false;
      
      setConnections({ gmail: gmailConnected, outlook: outlookConnected });
      
      // Si au moins un est connecté, scanner les emails
      if (gmailConnected || outlookConnected) {
        await scanEmails(gmailConnected, outlookConnected);
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
      setError('Erreur lors de la vérification des connexions');
    } finally {
      setIsLoading(false);
    }
  };

  const scanEmails = async (gmail: boolean, outlook: boolean) => {
    setIsScanning(true);
    setError(null);
    const allEmails: EmailItem[] = [];

    try {
      // Scanner Gmail
      if (gmail) {
        try {
          const gmailRes = await fetch('/api/gmail?action=scan');
          if (gmailRes.ok) {
            const gmailData = await gmailRes.json();
            const gmailEmails = (gmailData.emails || []).map((e: any) => ({
              id: e.id,
              subject: e.subject || 'Sans objet',
              from: e.from || 'Inconnu',
              date: e.date || new Date().toISOString(),
              hasAttachments: e.hasAttachments || false,
              attachmentCount: e.attachmentCount || 0,
              source: 'gmail' as const,
            }));
            allEmails.push(...gmailEmails);
          }
        } catch (e) {
          console.error('Erreur scan Gmail:', e);
        }
      }

      // Scanner Outlook
      if (outlook) {
        try {
          const outlookRes = await fetch('/api/outlook?action=scan');
          if (outlookRes.ok) {
            const outlookData = await outlookRes.json();
            const outlookEmails = (outlookData.emails || []).map((e: any) => ({
              id: e.id,
              subject: e.subject || 'Sans objet',
              from: e.from?.emailAddress?.name || e.from?.emailAddress?.address || 'Inconnu',
              date: e.receivedDateTime || new Date().toISOString(),
              hasAttachments: e.hasAttachments || false,
              source: 'outlook' as const,
            }));
            allEmails.push(...outlookEmails);
          }
        } catch (e) {
          console.error('Erreur scan Outlook:', e);
        }
      }

      // Trier par date décroissante
      allEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEmails(allEmails);
    } catch (error) {
      console.error('Erreur scan:', error);
      setError('Erreur lors du scan des emails');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const filteredEmails = getFilteredEmails();
    const allSelected = filteredEmails.every(e => selectedEmails.has(e.id));
    
    if (allSelected) {
      // Tout désélectionner
      setSelectedEmails(new Set());
    } else {
      // Tout sélectionner
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedEmails.size === 0) return;
    
    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedEmails.size });
    
    try {
      const emailsToImport = emails.filter(e => selectedEmails.has(e.id));
      let importedCount = 0;
      
      for (const email of emailsToImport) {
        try {
          const endpoint = email.source === 'gmail' ? '/api/gmail/import' : '/api/outlook/import';
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              emailId: email.id,
              companyId 
            }),
          });
          
          if (response.ok) {
            importedCount++;
            // Marquer comme importé
            setEmails(prev => prev.map(e => 
              e.id === email.id ? { ...e, imported: true } : e
            ));
          }
        } catch (e) {
          console.error(`Erreur import email ${email.id}:`, e);
        }
        
        setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
      
      // Désélectionner les emails importés
      setSelectedEmails(new Set());
      
      if (onImportComplete) {
        onImportComplete();
      }
      
      alert(`✅ ${importedCount} facture(s) importée(s) avec succès !`);
    } catch (error) {
      console.error('Erreur import:', error);
      setError('Erreur lors de l\'import des factures');
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const getFilteredEmails = useCallback(() => {
    return emails.filter(email => {
      const matchesSearch = 
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = sourceFilter === 'all' || email.source === sourceFilter;
      return matchesSearch && matchesSource && !email.imported;
    });
  }, [emails, searchTerm, sourceFilter]);

  const filteredEmails = getFilteredEmails();
  const hasConnections = connections.gmail || connections.outlook;

  // Pas de connexion
  if (!isLoading && !hasConnections) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <Mail className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun connecteur actif</h3>
        <p className="text-slate-600 mb-6 text-center max-w-md">
          Connectez d&apos;abord Gmail ou Outlook dans l&apos;onglet Connecteurs pour pouvoir extraire vos factures.
        </p>
        <Button onClick={onNavigateToConnector}>
          Configurer les connecteurs
        </Button>
      </div>
    );
  }

  // Chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500">Chargement des emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Extraction des factures</h2>
          <p className="text-slate-600">
            {connections.gmail && connections.outlook 
              ? 'Gmail et Outlook connectés'
              : connections.gmail 
                ? 'Gmail connecté'
                : 'Outlook connecté'
            }
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => scanEmails(connections.gmail, connections.outlook)}
          isLoading={isScanning}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Actualiser
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par objet ou expéditeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm 
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Source Filter */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {['all', 'gmail', 'outlook'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSourceFilter(filter as any)}
                  disabled={
                    (filter === 'gmail' && !connections.gmail) ||
                    (filter === 'outlook' && !connections.outlook)
                  }
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    sourceFilter === filter
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {filter === 'all' ? 'Tous' : filter === 'gmail' ? 'Gmail' : 'Outlook'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredEmails.length === 0}
            >
              {filteredEmails.every(e => selectedEmails.has(e.id)) && filteredEmails.length > 0
                ? 'Tout désélectionner'
                : 'Tout sélectionner'
              }
            </Button>
            
            <Button
              onClick={handleImportSelected}
              disabled={selectedEmails.size === 0 || isImporting}
              isLoading={isImporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Importer ({selectedEmails.size})
            </Button>
          </div>
        </div>
      </Card>

      {/* Import Progress */}
      {isImporting && importProgress.total > 0 && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Sparkles className="w-6 h-6 text-primary-500 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-900">
                  Import en cours... {importProgress.current}/{importProgress.total}
                </p>
                <div className="mt-2 h-2 bg-primary-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun email trouvé</h3>
          <p className="text-slate-500">
            {searchTerm 
              ? 'Aucun email ne correspond à votre recherche.'
              : 'Aucun email avec pièce jointe détecté. Essayez d\'actualiser.'
            }
          </p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredEmails.map((email) => (
              <EmailRow
                key={`${email.source}-${email.id}`}
                email={email}
                selected={selectedEmails.has(email.id)}
                onSelect={() => handleSelectEmail(email.id)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="flex justify-center text-sm text-slate-500">
        {filteredEmails.length} email(s) avec factures potentielles
      </div>
    </div>
  );
}

// Composant EmailRow
function EmailRow({ 
  email, 
  selected, 
  onSelect 
}: { 
  email: EmailItem; 
  selected: boolean;
  onSelect: () => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div 
      className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
        selected ? 'bg-primary-50' : 'hover:bg-slate-50'
      }`}
      onClick={onSelect}
    >
      {/* Checkbox */}
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
        selected 
          ? 'bg-primary-500 border-primary-500' 
          : 'border-slate-300 hover:border-primary-400'
      }`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Source Badge */}
      <div className={`px-2 py-1 rounded text-xs font-medium ${
        email.source === 'gmail' 
          ? 'bg-red-50 text-red-600' 
          : 'bg-blue-50 text-blue-600'
      }`}>
        {email.source === 'gmail' ? 'Gmail' : 'Outlook'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{email.subject}</p>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {email.from}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(email.date)}
          </span>
          {email.hasAttachments && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-primary-600">
                <Paperclip className="w-3 h-3" />
                {email.attachmentCount || 1} pièce(s) jointe(s)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}




