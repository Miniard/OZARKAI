/**
 * ExtractionCenter - Centre d'extraction des factures avec plage de dates
 * Permet au client de choisir une période pour récupérer ses factures
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Calendar,
  Mail,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  Filter,
  Search,
  Sparkles,
  Clock
} from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  attachmentCount: number;
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
}

interface ExtractionCenterProps {
  companyId: string;
  onDocumentsImported?: () => void;
}

export function ExtractionCenter({ companyId, onDocumentsImported }: ExtractionCenterProps) {
  // États pour les connexions
  const [gmailConnected, setGmailConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [isCheckingConnections, setIsCheckingConnections] = useState(true);
  
  // États pour la plage de dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // États pour le scan
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  
  // États pour l'import
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);
  
  // Message d'erreur
  const [error, setError] = useState<string | null>(null);

  // Initialiser les dates par défaut (30 derniers jours)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  // Vérifier les connexions au chargement
  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    setIsCheckingConnections(true);
    try {
      const [gmailRes, outlookRes] = await Promise.all([
        fetch('/api/gmail/status').then(r => r.json()).catch(() => ({ connected: false })),
        fetch('/api/outlook/status').then(r => r.json()).catch(() => ({ connected: false })),
      ]);
      
      setGmailConnected(gmailRes.connected || false);
      setOutlookConnected(outlookRes.connected || false);
    } catch (e) {
      console.error('Error checking connections:', e);
    } finally {
      setIsCheckingConnections(false);
    }
  };

  const handleScan = async () => {
    if (!gmailConnected && !outlookConnected) {
      setError('Veuillez connecter au moins un compte email');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResults([]);
    setSelectedEmails(new Set());

    const allEmails: Email[] = [];

    try {
      // Scanner Gmail si connecté
      if (gmailConnected) {
        const gmailRes = await fetch('/api/gmail/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            startDate,
            endDate,
            maxResults: 100,
          }),
        });

        const gmailData = await gmailRes.json();
        
        if (gmailData.needsReconnect) {
          setGmailConnected(false);
          setError('Session Gmail expirée. Veuillez reconnecter votre compte.');
        } else if (gmailData.emails) {
          allEmails.push(...gmailData.emails.map((e: Email) => ({ ...e, source: 'gmail' })));
        }
      }

      // Scanner Outlook si connecté
      if (outlookConnected) {
        const outlookRes = await fetch('/api/outlook/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            startDate,
            endDate,
            maxResults: 100,
          }),
        });

        const outlookData = await outlookRes.json();
        
        if (outlookData.needsReconnect) {
          setOutlookConnected(false);
          setError('Session Outlook expirée. Veuillez reconnecter votre compte.');
        } else if (outlookData.emails) {
          allEmails.push(...outlookData.emails.map((e: Email) => ({ ...e, source: 'outlook' })));
        }
      }

      // Trier par date décroissante
      allEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setScanResults(allEmails);
      
      // Sélectionner tous par défaut
      setSelectedEmails(new Set(allEmails.map(e => e.id)));

    } catch (err) {
      console.error('Scan error:', err);
      setError('Erreur lors du scan des emails');
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = async () => {
    if (selectedEmails.size === 0) {
      setError('Veuillez sélectionner au moins un email');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportProgress({ current: 0, total: selectedEmails.size });
    setImportedCount(0);

    let totalImported = 0;
    let current = 0;

    try {
      for (const emailId of selectedEmails) {
        const email = scanResults.find(e => e.id === emailId);
        if (!email) continue;

        current++;
        setImportProgress({ current, total: selectedEmails.size });

        // Déterminer la source
        const source = (email as any).source || 'gmail';
        const importEndpoint = source === 'outlook' ? '/api/outlook/import' : '/api/gmail/import';

        const res = await fetch(importEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: email.id,
            companyId,
          }),
        });

        const data = await res.json();
        if (data.importedCount) {
          totalImported += data.importedCount;
        }
      }

      setImportedCount(totalImported);
      
      // Notifier le parent
      if (onDocumentsImported && totalImported > 0) {
        onDocumentsImported();
      }

      // Vider les résultats de scan
      setScanResults([]);
      setSelectedEmails(new Set());

    } catch (err) {
      console.error('Import error:', err);
      setError('Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(emailId)) {
      newSelection.delete(emailId);
    } else {
      newSelection.add(emailId);
    }
    setSelectedEmails(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === scanResults.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(scanResults.map(e => e.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Presets de dates
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="font-normal text-slate-500">Centre d'</span>Extraction
        </h1>
        <p className="text-slate-500 mt-1">
          Sélectionnez une période pour extraire automatiquement vos factures
        </p>
      </div>

      {/* Status des connexions */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
          gmailConnected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
        }`}>
          <GoogleIcon size={32} />
          <div className="flex-1">
            <p className="font-medium text-slate-900">Gmail</p>
            <p className="text-sm text-slate-500">
              {isCheckingConnections ? 'Vérification...' : gmailConnected ? 'Connecté' : 'Non connecté'}
            </p>
          </div>
          {gmailConnected && <CheckCircle className="w-5 h-5 text-emerald-500" />}
        </div>

        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
          outlookConnected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
        }`}>
          <MicrosoftIcon size={32} />
          <div className="flex-1">
            <p className="font-medium text-slate-900">Outlook</p>
            <p className="text-sm text-slate-500">
              {isCheckingConnections ? 'Vérification...' : outlookConnected ? 'Connecté' : 'Non connecté'}
            </p>
          </div>
          {outlookConnected && <CheckCircle className="w-5 h-5 text-emerald-500" />}
        </div>
      </div>

      {/* Sélection de dates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Plage de dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Presets */}
            <div className="flex gap-2">
              <button
                onClick={() => setPreset(7)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                7 jours
              </button>
              <button
                onClick={() => setPreset(30)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                30 jours
              </button>
              <button
                onClick={() => setPreset(90)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                3 mois
              </button>
              <button
                onClick={() => setPreset(365)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                1 an
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <Button
              onClick={handleScan}
              disabled={isScanning || (!gmailConnected && !outlookConnected)}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher les factures
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Résultats importés */}
      {importedCount > 0 && !isImporting && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-emerald-700">
            <strong>{importedCount}</strong> document{importedCount > 1 ? 's' : ''} importé{importedCount > 1 ? 's' : ''} et analysé{importedCount > 1 ? 's' : ''} avec succès !
          </p>
        </div>
      )}

      {/* Progression de l'import */}
      {isImporting && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">
                Import en cours... ({importProgress.current}/{importProgress.total})
              </p>
              <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats du scan */}
      {scanResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-500" />
                {scanResults.length} email{scanResults.length > 1 ? 's' : ''} trouvé{scanResults.length > 1 ? 's' : ''}
              </CardTitle>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {selectedEmails.size === scanResults.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || selectedEmails.size === 0}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Importer {selectedEmails.size} email{selectedEmails.size > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {scanResults.map((email) => (
                <div
                  key={email.id}
                  onClick={() => toggleEmailSelection(email.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedEmails.has(email.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEmails.has(email.id)}
                      onChange={() => toggleEmailSelection(email.id)}
                      className="mt-1 w-4 h-4 text-primary-500 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {(email as any).source === 'outlook' ? (
                          <MicrosoftIcon size={16} />
                        ) : (
                          <GoogleIcon size={16} />
                        )}
                        <span className="font-medium text-slate-900 truncate">
                          {email.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="truncate">{email.from}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(email.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {email.attachmentCount} pièce{email.attachmentCount > 1 ? 's' : ''} jointe{email.attachmentCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      {/* Liste des pièces jointes */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {email.attachments.map((att) => (
                          <span
                            key={att.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600"
                          >
                            <FileText className="w-3 h-3" />
                            {att.filename}
                            <span className="text-slate-400">({formatFileSize(att.size)})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* État vide après scan */}
      {!isScanning && scanResults.length === 0 && startDate && endDate && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            Prêt à extraire vos factures
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Sélectionnez une plage de dates et cliquez sur "Rechercher" pour scanner vos emails
          </p>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Analyse IA automatique</p>
            <p className="text-sm text-amber-700">
              Chaque document importé est automatiquement analysé par notre IA pour extraire le fournisseur, 
              le montant, la TVA, les lignes de facturation et toutes les informations importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Google Icon Component
function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// Microsoft Icon Component
function MicrosoftIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

