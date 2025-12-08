/**
 * ConnectorHub - Hub de connexion des services email
 * Extraction automatique des factures après connexion
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  CheckCircle, 
  Loader2, 
  Plus,
  ChevronDown,
  Trash2,
  RefreshCw,
  Users,
  MoreHorizontal,
  Globe,
  FileText,
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ConnectedAccount {
  id: string;
  type: 'gmail' | 'outlook';
  email: string;
  connected: boolean;
  lastSync?: string;
  documentsImported?: number;
}

interface SyncStatus {
  isScanning: boolean;
  isSyncing: boolean;
  currentStep: string;
  progress: number;
  emailsFound: number;
  documentsImported: number;
}

interface ConnectorHubProps {
  companyId: string;
  onDocumentsImported?: () => void;
}

export function ConnectorHub({ companyId, onDocumentsImported }: ConnectorHubProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [connectingService, setConnectingService] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isScanning: false,
    isSyncing: false,
    currentStep: '',
    progress: 0,
    emailsFound: 0,
    documentsImported: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAllConnections();
  }, []);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAllConnections = async () => {
    setIsLoading(true);
    try {
      const connectedAccounts: ConnectedAccount[] = [];

      // Vérifier Gmail
      try {
        const gmailRes = await fetch('/api/gmail/status');
        const gmailData = await gmailRes.json();
        if (gmailData.connected) {
          connectedAccounts.push({
            id: 'gmail-1',
            type: 'gmail',
            email: gmailData.email || 'Gmail connecté',
            connected: true,
            lastSync: gmailData.lastSync,
            documentsImported: gmailData.documentsImported || 0,
          });
        }
      } catch (e) {
        console.error('Erreur vérification Gmail:', e);
      }

      // Vérifier Outlook
      try {
        const outlookRes = await fetch('/api/outlook/status');
        const outlookData = await outlookRes.json();
        if (outlookData.connected) {
          connectedAccounts.push({
            id: 'outlook-1',
            type: 'outlook',
            email: outlookData.email || 'Outlook connecté',
            connected: true,
            lastSync: outlookData.lastSync,
            documentsImported: outlookData.documentsImported || 0,
          });
        }
      } catch (e) {
        console.error('Erreur vérification Outlook:', e);
      }

      setAccounts(connectedAccounts);

      // Si des comptes sont connectés, vérifier s'il faut lancer une sync
      if (connectedAccounts.length > 0) {
        // Vérifier la dernière sync
        const needsSync = connectedAccounts.some(acc => {
          if (!acc.lastSync) return true;
          const lastSyncDate = new Date(acc.lastSync);
          const hoursSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
          return hoursSinceSync > 1; // Re-sync si plus d'1h
        });
        
        if (needsSync) {
          // Auto-sync au chargement
          // startAutoSync(connectedAccounts);
        }
      }
    } catch (error) {
      console.error('Erreur vérification connexions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (service: 'gmail' | 'outlook') => {
    setConnectingService(service);
    setShowAddDropdown(false);
    try {
      const endpoint = service === 'gmail' ? '/api/gmail/authorize' : '/api/outlook/authorize';
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error(`Erreur connexion ${service}:`, error);
    } finally {
      setConnectingService(null);
    }
  };

  const handleDisconnect = async (account: ConnectedAccount) => {
    if (!confirm(`Voulez-vous déconnecter ${account.email} ?`)) return;
    
    try {
      const endpoint = account.type === 'gmail' ? '/api/gmail/disconnect' : '/api/outlook/disconnect';
      await fetch(endpoint, { method: 'POST' });
      checkAllConnections();
    } catch (error) {
      console.error(`Erreur déconnexion:`, error);
    }
  };

  const handleSyncNow = async () => {
    if (syncStatus.isSyncing) return;
    
    setSyncStatus({
      isScanning: true,
      isSyncing: true,
      currentStep: 'Scanning emails...',
      progress: 0,
      emailsFound: 0,
      documentsImported: 0,
    });

    try {
      // Pour chaque compte connecté
      for (const account of accounts) {
        setSyncStatus(prev => ({
          ...prev,
          currentStep: `Scanning ${account.type === 'gmail' ? 'Gmail' : 'Outlook'}...`,
        }));

        // Scanner les emails
        const scanEndpoint = account.type === 'gmail' 
          ? '/api/gmail/scan' 
          : '/api/outlook/scan';
        
        const scanRes = await fetch(scanEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId }),
        });
        
        const scanData = await scanRes.json();
        
        if (scanData.emails && scanData.emails.length > 0) {
          setSyncStatus(prev => ({
            ...prev,
            currentStep: `Found ${scanData.emails.length} emails with attachments`,
            emailsFound: prev.emailsFound + scanData.emails.length,
            progress: 30,
          }));

          // Importer les pièces jointes
          setSyncStatus(prev => ({
            ...prev,
            currentStep: 'Importing documents...',
            progress: 50,
          }));

          const importEndpoint = account.type === 'gmail'
            ? '/api/gmail/import'
            : '/api/outlook/import';

          const importRes = await fetch(importEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              companyId,
              emails: scanData.emails,
              autoAnalyze: true, // Analyser automatiquement avec l'IA
            }),
          });

          const importData = await importRes.json();
          
          setSyncStatus(prev => ({
            ...prev,
            currentStep: 'Analyzing with AI...',
            progress: 80,
            documentsImported: prev.documentsImported + (importData.imported || 0),
          }));
        }
      }

      // Terminé
      setSyncStatus(prev => ({
        ...prev,
        isScanning: false,
        isSyncing: false,
        currentStep: 'Sync complete!',
        progress: 100,
      }));

      // Notifier le parent
      if (onDocumentsImported) {
        onDocumentsImported();
      }

      // Refresh les connexions
      checkAllConnections();

    } catch (error) {
      console.error('Erreur sync:', error);
      setSyncStatus(prev => ({
        ...prev,
        isScanning: false,
        isSyncing: false,
        currentStep: 'Error during sync',
      }));
    }
  };

  const formatLastSync = (date?: string) => {
    if (!date) return 'Never synced';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const totalDocuments = accounts.reduce((sum, acc) => sum + (acc.documentsImported || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            <span className="font-normal text-slate-500">Email</span> accounts
          </h1>
          <p className="text-slate-500 mt-1">
            Connect your email accounts to automatically import invoices.
          </p>
        </div>
        
        {/* Add Account Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add an account
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} />
          </Button>
          
          {showAddDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <button
                onClick={() => handleConnect('gmail')}
                disabled={connectingService === 'gmail'}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <GoogleIcon />
                <span className="text-slate-700">Sign in with Google</span>
                {connectingService === 'gmail' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
              </button>
              
              <button
                onClick={() => handleConnect('outlook')}
                disabled={connectingService === 'outlook'}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <MicrosoftIcon />
                <span className="text-slate-700">Sign in with Microsoft</span>
                {connectingService === 'outlook' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
              </button>
              
              <button
                disabled
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left opacity-50 cursor-not-allowed"
              >
                <div className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <span className="text-slate-700">Any other account</span>
                  <span className="text-xs text-slate-400 block">(IMAP) - Coming soon</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus.isSyncing && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">{syncStatus.currentStep}</span>
                <span className="text-sm text-blue-600">{syncStatus.progress}%</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${syncStatus.progress}%` }}
                />
              </div>
              {syncStatus.documentsImported > 0 && (
                <p className="text-sm text-blue-700 mt-2">
                  {syncStatus.documentsImported} documents imported so far
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Connected Accounts */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 mb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-slate-300 animate-spin mb-4" />
            <p className="text-slate-500">Checking connections...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No email accounts connected yet
            </h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              Connect your email accounts to<br />
              automatically extract receipts and invoices.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleConnect('gmail')} variant="outline">
                <GoogleIcon />
                <span className="ml-2">Connect Gmail</span>
              </Button>
              <Button onClick={() => handleConnect('outlook')} variant="outline">
                <MicrosoftIcon />
                <span className="ml-2">Connect Outlook</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div 
                key={account.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {account.type === 'gmail' ? <GoogleIcon size={32} /> : <MicrosoftIcon size={32} />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{account.email}</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastSync(account.lastSync)}
                      </span>
                      {account.documentsImported && account.documentsImported > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {account.documentsImported} documents
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDisconnect(account)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Button & Stats */}
      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900">
                  {totalDocuments > 0 
                    ? `${totalDocuments} invoices imported` 
                    : 'Ready to import invoices'
                  }
                </h3>
                <p className="text-sm text-emerald-700">
                  {accounts.length} account{accounts.length > 1 ? 's' : ''} connected • 
                  Auto-analysis enabled
                </p>
              </div>
            </div>
            <Button
              onClick={handleSyncNow}
              disabled={syncStatus.isSyncing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {syncStatus.isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 rounded-xl p-6 mb-6">
        <h4 className="font-semibold text-slate-900 mb-4">💡 How it works</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-medium text-slate-800">Connect</p>
              <p className="text-sm text-slate-500">Link your Gmail or Outlook account</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-medium text-slate-800">Auto-Import</p>
              <p className="text-sm text-slate-500">We scan and import all invoices</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-medium text-slate-800">AI Analysis</p>
              <p className="text-sm text-slate-500">Every document is analyzed automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invitations Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Invitations to guests</h2>
            <p className="text-sm text-slate-500">
              Invite team members to connect their email accounts.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Invite a guest
          </Button>
        </div>
        
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Accounts</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No guests invited yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Link */}
      <div className="flex justify-center">
        <button
          onClick={checkAllConnections}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh connections
        </button>
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
