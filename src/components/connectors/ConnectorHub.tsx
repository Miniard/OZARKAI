/**
 * ConnectorHub - Hub de connexion des services email
 * Design style Receptor AI
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  Loader2, 
  Plus,
  ChevronDown,
  Trash2,
  Settings,
  Users,
  Globe,
  VolumeX,
  MoreVertical
} from 'lucide-react';

interface ConnectedAccount {
  id: string;
  type: 'gmail' | 'outlook';
  email: string;
  connected: boolean;
  enabled: boolean;
  lastSync?: string;
  documentsImported?: number;
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
        const gmailRes = await fetch('/api/gmail/status', {
          credentials: 'include',
          cache: 'no-store',
        });
        const gmailData = await gmailRes.json();
        console.log('📧 Gmail status response:', gmailData);
        if (gmailData.connected) {
          connectedAccounts.push({
            id: 'gmail-1',
            type: 'gmail',
            email: gmailData.email || 'Gmail connecté',
            connected: true,
            enabled: true,
            lastSync: gmailData.lastSync,
            documentsImported: gmailData.documentsImported || 0,
          });
        }
      } catch (e) {
        console.error('Erreur vérification Gmail:', e);
      }

      // Vérifier Outlook
      try {
        const outlookRes = await fetch('/api/outlook/status', {
          credentials: 'include',
          cache: 'no-store',
        });
        const outlookData = await outlookRes.json();
        console.log('📧 Outlook status response:', outlookData);
        if (outlookData.connected) {
          connectedAccounts.push({
            id: 'outlook-1',
            type: 'outlook',
            email: outlookData.email || 'Outlook connecté',
            connected: true,
            enabled: true,
            lastSync: outlookData.lastSync,
            documentsImported: outlookData.documentsImported || 0,
          });
        }
      } catch (e) {
        console.error('Erreur vérification Outlook:', e);
      }

      setAccounts(connectedAccounts);
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

  const toggleAccount = (accountId: string) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === accountId ? { ...acc, enabled: !acc.enabled } : acc
    ));
  };

  const formatLastSync = (date?: string) => {
    if (!date) return '—';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${diffMonths} months ago`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            <span className="font-normal text-slate-500">Email</span> accounts
          </h1>
          <p className="text-slate-500 mt-1">
            Connect your email accounts to OZARK AI.
          </p>
        </div>
        
        {/* Add Account Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            className="bg-primary-500 hover:bg-primary-600"
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

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-16 px-4 py-3"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Activity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Refresh</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Checking connections...</p>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">No email accounts connected yet</p>
                  <p className="text-slate-400 text-xs mt-1">Click &quot;Add an account&quot; to get started</p>
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Toggle */}
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleAccount(account.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        account.enabled ? 'bg-primary-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        account.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  
                  {/* Account */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {account.type === 'gmail' ? <GoogleIcon size={20} /> : <MicrosoftIcon size={20} />}
                      <div>
                        <p className="font-medium text-slate-800">{account.type === 'gmail' ? 'Google' : 'Microsoft'}</p>
                        <p className="text-sm text-slate-500">{account.email}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className="text-slate-400">—</span>
                  </td>
                  
                  {/* Last Activity */}
                  <td className="px-4 py-4">
                    <span className="text-slate-500 text-sm">{formatLastSync(account.lastSync)}</span>
                  </td>
                  
                  {/* Refresh */}
                  <td className="px-4 py-4">
                    <span className="text-slate-400">—</span>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={() => handleDisconnect(account)}
                        className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invitations Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Invitations to guests</h2>
            <p className="text-sm text-slate-500">
              Manage invitations to connect guest email accounts to your OZARK AI account.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Invite a guest
          </Button>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
