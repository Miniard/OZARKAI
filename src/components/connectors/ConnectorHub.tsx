/**
 * ConnectorHub - Hub de connexion des services email
 * Fusionne Gmail et Outlook en un seul onglet
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Link2, 
  Unlink,
  RefreshCw,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ConnectorStatus {
  gmail: {
    connected: boolean;
    email?: string;
    lastSync?: string;
  };
  outlook: {
    connected: boolean;
    email?: string;
    lastSync?: string;
  };
}

interface ConnectorHubProps {
  onNavigateToExtraction: () => void;
}

export function ConnectorHub({ onNavigateToExtraction }: ConnectorHubProps) {
  const [status, setStatus] = useState<ConnectorStatus>({
    gmail: { connected: false },
    outlook: { connected: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [connectingService, setConnectingService] = useState<string | null>(null);

  useEffect(() => {
    checkAllConnections();
  }, []);

  const checkAllConnections = async () => {
    setIsLoading(true);
    try {
      // Vérifier Gmail
      const gmailRes = await fetch('/api/gmail/status');
      const gmailData = await gmailRes.json();
      
      // Vérifier Outlook
      const outlookRes = await fetch('/api/outlook/status');
      const outlookData = await outlookRes.json();

      setStatus({
        gmail: {
          connected: gmailData.connected || false,
          email: gmailData.email,
          lastSync: gmailData.lastSync,
        },
        outlook: {
          connected: outlookData.connected || false,
          email: outlookData.email,
          lastSync: outlookData.lastSync,
        },
      });
    } catch (error) {
      console.error('Erreur vérification connexions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setConnectingService('gmail');
    try {
      const response = await fetch('/api/gmail/authorize');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Erreur connexion Gmail:', error);
    } finally {
      setConnectingService(null);
    }
  };

  const handleConnectOutlook = async () => {
    setConnectingService('outlook');
    try {
      const response = await fetch('/api/outlook/authorize');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Erreur connexion Outlook:', error);
    } finally {
      setConnectingService(null);
    }
  };

  const handleDisconnect = async (service: 'gmail' | 'outlook') => {
    if (!confirm(`Voulez-vous déconnecter ${service === 'gmail' ? 'Gmail' : 'Outlook'} ?`)) return;
    
    try {
      await fetch(`/api/${service}/disconnect`, { method: 'POST' });
      checkAllConnections();
    } catch (error) {
      console.error(`Erreur déconnexion ${service}:`, error);
    }
  };

  const hasAnyConnection = status.gmail.connected || status.outlook.connected;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500">Vérification des connexions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Link2 className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connecteurs Email</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Connectez vos boîtes mail pour importer automatiquement vos factures et reçus
        </p>
      </div>

      {/* Connectors Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gmail Connector */}
        <Card className={`overflow-hidden transition-all ${status.gmail.connected ? 'ring-2 ring-green-500/20' : ''}`}>
          <div className={`h-2 ${status.gmail.connected ? 'bg-green-500' : 'bg-slate-200'}`} />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Gmail Logo */}
              <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M22 6l-10 7L2 6V4l10 7 10-7z"/>
                  <path fill="#4285F4" d="M2 6v12h6V10l4 3 4-3v8h6V6l-10 7z"/>
                </svg>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">Gmail</h3>
                  {status.gmail.connected ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Connecté
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Non connecté
                    </span>
                  )}
                </div>
                
                {status.gmail.connected && status.gmail.email && (
                  <p className="text-sm text-slate-500 mb-3">{status.gmail.email}</p>
                )}
                
                <p className="text-sm text-slate-600 mb-4">
                  {status.gmail.connected 
                    ? 'Votre compte Gmail est connecté. Vous pouvez extraire vos factures.'
                    : 'Connectez votre compte Google pour importer vos factures reçues par email.'
                  }
                </p>
                
                {status.gmail.connected ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('gmail')}
                      leftIcon={<Unlink className="w-4 h-4" />}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Déconnecter
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnectGmail}
                    isLoading={connectingService === 'gmail'}
                    leftIcon={<Link2 className="w-4 h-4" />}
                  >
                    Connecter Gmail
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outlook Connector */}
        <Card className={`overflow-hidden transition-all ${status.outlook.connected ? 'ring-2 ring-green-500/20' : ''}`}>
          <div className={`h-2 ${status.outlook.connected ? 'bg-green-500' : 'bg-slate-200'}`} />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Outlook Logo */}
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                </svg>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">Outlook / Office 365</h3>
                  {status.outlook.connected ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Connecté
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Non connecté
                    </span>
                  )}
                </div>
                
                {status.outlook.connected && status.outlook.email && (
                  <p className="text-sm text-slate-500 mb-3">{status.outlook.email}</p>
                )}
                
                <p className="text-sm text-slate-600 mb-4">
                  {status.outlook.connected 
                    ? 'Votre compte Outlook est connecté. Vous pouvez extraire vos factures.'
                    : 'Connectez votre compte Microsoft pour importer vos factures depuis Outlook.'
                  }
                </p>
                
                {status.outlook.connected ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('outlook')}
                      leftIcon={<Unlink className="w-4 h-4" />}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Déconnecter
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnectOutlook}
                    isLoading={connectingService === 'outlook'}
                    leftIcon={<Link2 className="w-4 h-4" />}
                  >
                    Connecter Outlook
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action - Extraction */}
      {hasAnyConnection && (
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-900">Prêt à extraire vos factures ?</h3>
                  <p className="text-sm text-primary-700">
                    {status.gmail.connected && status.outlook.connected 
                      ? 'Gmail et Outlook sont connectés !'
                      : status.gmail.connected 
                        ? 'Gmail est connecté !'
                        : 'Outlook est connecté !'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={onNavigateToExtraction}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Extraire les factures
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-slate-900 mb-3">💡 Comment ça marche ?</h4>
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Connectez vos comptes email (Gmail et/ou Outlook)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>Allez dans l&apos;onglet &quot;Extraction&quot; pour voir vos emails avec factures</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>Sélectionnez les factures à importer et notre IA les analyse automatiquement</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={checkAllConnections}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Actualiser les connexions
        </Button>
      </div>
    </div>
  );
}

