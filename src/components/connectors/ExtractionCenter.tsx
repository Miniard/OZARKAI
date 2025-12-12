/**
 * ExtractionCenter - Style Receptor AI
 * Extraction rétroactive avec sélection de comptes et plages de dates
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Mail,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  ArrowRight,
  Clock
} from 'lucide-react';

interface Extraction {
  id: string;
  dateRange: string;
  email: string;
  status: 'completed' | 'pending' | 'failed';
  documentCount: number;
  createdAt: string;
}

interface ExtractionCenterProps {
  companyId: string;
  onDocumentsImported?: () => void;
}

export function ExtractionCenter({ companyId, onDocumentsImported }: ExtractionCenterProps) {
  // États connexions
  const [connectedEmails, setConnectedEmails] = useState<{email: string; source: 'gmail' | 'outlook'}[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isCheckingConnections, setIsCheckingConnections] = useState(true);
  
  // État extraction
  const [dateRange, setDateRange] = useState('12months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // États process
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0 });
  
  // Historique extractions
  const [recentExtractions, setRecentExtractions] = useState<Extraction[]>([]);
  
  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vérifier les connexions
  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    setIsCheckingConnections(true);
    const emails: {email: string; source: 'gmail' | 'outlook'}[] = [];
    
    try {
      const [gmailRes, outlookRes] = await Promise.all([
        fetch('/api/gmail/status').then(r => r.json()).catch(() => ({ connected: false })),
        fetch('/api/outlook/status').then(r => r.json()).catch(() => ({ connected: false })),
      ]);
      
      if (gmailRes.connected && gmailRes.email) {
        emails.push({ email: gmailRes.email, source: 'gmail' });
      }
      if (outlookRes.connected && outlookRes.email) {
        emails.push({ email: outlookRes.email, source: 'outlook' });
      }
      
      setConnectedEmails(emails);
      if (emails.length > 0 && !selectedEmail) {
        setSelectedEmail(emails[0].email);
      }
    } catch (e) {
      console.error('Error checking connections:', e);
    } finally {
      setIsCheckingConnections(false);
    }
  };

  // Calculer les dates selon la plage sélectionnée
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '7days': start.setDate(start.getDate() - 7); break;
      case '30days': start.setDate(start.getDate() - 30); break;
      case '3months': start.setMonth(start.getMonth() - 3); break;
      case '6months': start.setMonth(start.getMonth() - 6); break;
      case '12months': start.setMonth(start.getMonth() - 12); break;
      case 'custom':
        return { start: customStartDate, end: customEndDate };
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const handleExtract = async () => {
    if (!selectedEmail) {
      setError('Veuillez sélectionner un compte email');
      return;
    }

    const emailAccount = connectedEmails.find(e => e.email === selectedEmail);
    if (!emailAccount) return;

    setIsExtracting(true);
    setError(null);
    setSuccess(null);
    setExtractionProgress({ current: 0, total: 0 });

    const { start, end } = getDateRange();

    try {
      // 1. Scanner les emails
      const scanEndpoint = emailAccount.source === 'outlook' ? '/api/outlook/scan' : '/api/gmail/scan';
      const scanRes = await fetch(scanEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          startDate: start,
          endDate: end,
          maxResults: 200,
        }),
      });

      const scanData = await scanRes.json();
      
      if (scanData.needsReconnect) {
        setError('Session expirée. Veuillez reconnecter votre compte.');
        setIsExtracting(false);
        return;
      }

      const emails = scanData.emails || [];
      if (emails.length === 0) {
        setSuccess('Aucun email avec pièce jointe trouvé pour cette période.');
        setIsExtracting(false);
        return;
      }

      setExtractionProgress({ current: 0, total: emails.length });

      // 2. Importer chaque email
      const importEndpoint = emailAccount.source === 'outlook' ? '/api/outlook/import' : '/api/gmail/import';
      let totalImported = 0;

      for (let i = 0; i < emails.length; i++) {
        setExtractionProgress({ current: i + 1, total: emails.length });
        
        const res = await fetch(importEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: emails[i].id,
            companyId,
          }),
        });

        const data = await res.json();
        if (data.importedCount) {
          totalImported += data.importedCount;
        }
      }

      // 3. Ajouter à l'historique
      const newExtraction: Extraction = {
        id: Date.now().toString(),
        dateRange: `${new Date(start).toLocaleDateString('fr-FR')} - ${new Date(end).toLocaleDateString('fr-FR')}`,
        email: selectedEmail,
        status: 'completed',
        documentCount: totalImported,
        createdAt: new Date().toISOString(),
      };
      setRecentExtractions(prev => [newExtraction, ...prev]);

      setSuccess(`${totalImported} document${totalImported > 1 ? 's' : ''} importé${totalImported > 1 ? 's' : ''} avec succès !`);
      
      if (onDocumentsImported && totalImported > 0) {
        onDocumentsImported();
      }

    } catch (err) {
      console.error('Extraction error:', err);
      setError('Erreur lors de l\'extraction');
    } finally {
      setIsExtracting(false);
    }
  };

  const dateRangeOptions = [
    { value: '7days', label: 'Les 7 derniers jours' },
    { value: '30days', label: 'Les 30 derniers jours' },
    { value: '3months', label: 'Les 3 derniers mois' },
    { value: '6months', label: 'Les 6 derniers mois' },
    { value: '12months', label: 'Les 12 derniers mois' },
    { value: 'custom', label: 'Période personnalisée' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            <span className="font-normal text-slate-500">Extractions rétroactives </span>
            d'emails antérieurs
          </h1>
        </div>
        <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center text-[10px]">▶</span>
          Voir la démo
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* === COLONNE GAUCHE - Nouvelle extraction === */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Nouvelle extraction</h2>

            {/* Sélection compte email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Compte de messagerie
              </label>
              
              {isCheckingConnections ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification des connexions...
                </div>
              ) : connectedEmails.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-3">Aucun compte email connecté</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard?tab=connectors'}>
                    <Plus className="w-4 h-4 mr-2" />
                    Connecter un compte
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {connectedEmails.map((account) => (
                    <label
                      key={account.email}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedEmail === account.email
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="email"
                        checked={selectedEmail === account.email}
                        onChange={() => setSelectedEmail(account.email)}
                        className="w-4 h-4 text-primary-600"
                      />
                      {account.source === 'gmail' ? <GoogleIcon size={20} /> : <MicrosoftIcon size={20} />}
                      <span className="text-sm text-slate-700">{account.email}</span>
                    </label>
                  ))}
                  <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mt-2">
                    <Plus className="w-4 h-4" />
                    Ajouter un compte
                  </button>
                </div>
              )}
            </div>

            {/* Sélection plage de dates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Sélectionnez une plage de dates
              </label>
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-3 pr-10 text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {dateRangeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
              
              {/* Custom dates */}
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date de début</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Options avancées */}
            <div className="mb-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <Settings className="w-4 h-4" />
                Afficher les options avancées
              </button>
              
              {showAdvanced && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-primary-600" />
                    <span className="text-sm text-slate-700">Inclure les pièces jointes PDF</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-primary-600" />
                    <span className="text-sm text-slate-700">Inclure les images (JPG, PNG)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-primary-600" />
                    <span className="text-sm text-slate-700">Exclure les newsletters</span>
                  </label>
                </div>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-2 text-sm text-primary-700">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Progress */}
            {isExtracting && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">
                    Extraction en cours... ({extractionProgress.current}/{extractionProgress.total})
                  </span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${extractionProgress.total ? (extractionProgress.current / extractionProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Bouton action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button className="text-sm text-slate-500 hover:text-slate-700">
                Annuler
              </button>
              <Button
                onClick={handleExtract}
                disabled={isExtracting || !selectedEmail}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {isExtracting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Lancer l'extraction
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* === COLONNE DROITE - Extractions récentes === */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Extractions récentes</h2>
            
            {recentExtractions.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune extraction récente</p>
            ) : (
              <div className="space-y-3">
                {recentExtractions.slice(0, 5).map((extraction) => (
                  <div key={extraction.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">{extraction.dateRange}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        extraction.status === 'completed' 
                          ? 'bg-primary-100 text-primary-700' 
                          : extraction.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {extraction.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {extraction.status === 'completed' ? 'Complété' : extraction.status === 'pending' ? 'En cours' : 'Échoué'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{extraction.email}</p>
                    <p className="text-xs text-slate-600 mt-1">{extraction.documentCount} documents</p>
                  </div>
                ))}
              </div>
            )}
            
            <button className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mt-4">
              Voir toutes les extractions
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Section historique */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Vos extractions passées</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {recentExtractions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Aucune extraction effectuée</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Période</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Compte</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Documents</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentExtractions.map((extraction) => (
                  <tr key={extraction.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">{extraction.dateRange}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{extraction.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        extraction.status === 'completed' ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {extraction.status === 'completed' ? 'Complété' : 'Échoué'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{extraction.documentCount}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(extraction.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Google Icon
function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// Microsoft Icon
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
