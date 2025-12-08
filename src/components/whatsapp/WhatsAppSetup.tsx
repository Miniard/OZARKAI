/**
 * Composant de configuration WhatsApp via Twilio
 * Permet aux utilisateurs de lier leur numéro pour recevoir/envoyer des factures
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  MessageCircle, 
  CheckCircle, 
  Phone, 
  Shield, 
  Zap, 
  Camera,
  Loader2,
  AlertCircle,
  Smartphone,
  Copy,
  ExternalLink
} from 'lucide-react';

interface WhatsAppSetupProps {
  onSetupComplete?: () => void;
}

// Numéro Twilio Sandbox (à remplacer par le vrai numéro en prod)
const TWILIO_SANDBOX_NUMBER = '+1 415 523 8886';
const TWILIO_JOIN_CODE = 'join <ton-code>'; // L'utilisateur doit mettre son code

export function WhatsAppSetup({ onSetupComplete }: WhatsAppSetupProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      setIsConnected(data.connected);
      setPhoneNumber(data.phoneNumber || '');
      if (data.connected) {
        setStep(3);
      }
    } catch (e) {
      console.error('Erreur check status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNumber = async () => {
    if (!inputPhone || inputPhone.length < 10) {
      setError('Entrez un numéro valide');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      // Formater le numéro (enlever espaces, ajouter indicatif si besoin)
      let formattedNumber = inputPhone.replace(/\s/g, '').replace(/^0/, '33');
      if (!formattedNumber.startsWith('33') && !formattedNumber.startsWith('+')) {
        formattedNumber = '33' + formattedNumber;
      }
      formattedNumber = formattedNumber.replace(/^\+/, '');

      const response = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedNumber }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      setIsConnected(true);
      setPhoneNumber(formattedNumber);
      setSuccess(true);
      setStep(3);
      
      if (onSetupComplete) {
        onSetupComplete();
      }
    } catch (e) {
      setError('Erreur lors de l\'enregistrement du numéro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Voulez-vous déconnecter WhatsApp ?')) return;
    
    setIsSaving(true);
    try {
      await fetch('/api/whatsapp/status', {
        method: 'DELETE',
      });
      setIsConnected(false);
      setPhoneNumber('');
      setInputPhone('');
      setSuccess(false);
      setStep(1);
    } catch (e) {
      setError('Erreur lors de la déconnexion');
    } finally {
      setIsSaving(false);
    }
  };

  const copyNumber = async () => {
    await navigator.clipboard.writeText(TWILIO_SANDBOX_NUMBER.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  // Connecté
  if (isConnected && step === 3) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900">WhatsApp connecté</h3>
              </div>
              <p className="text-slate-600">+{phoneNumber}</p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-slate-900 mb-3">📱 Comment envoyer vos factures :</h4>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700 shrink-0">1</span>
                <div>
                  <span className="font-medium">Ouvrez WhatsApp et envoyez au :</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-slate-100 px-2 py-1 rounded text-green-700 font-mono">
                      {TWILIO_SANDBOX_NUMBER}
                    </code>
                    <button 
                      onClick={copyNumber}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700 shrink-0">2</span>
                <span>Envoyez une photo ou PDF de votre facture</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700 shrink-0">3</span>
                <span>L'IA analyse et importe automatiquement ! 🤖</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Important (Mode Sandbox) :</strong> Vous devez d'abord envoyer le message 
              <code className="bg-amber-100 px-1 mx-1 rounded">join &lt;code&gt;</code> 
              au numéro pour activer la connexion. Regardez dans votre console Twilio.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4" />
              <span>Vos données sont sécurisées</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              disabled={isSaving}
              className="text-danger-600 hover:bg-danger-50"
            >
              Déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Non connecté - Étapes de configuration
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          Connecter WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avantages */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Photo → Facture</p>
              <p className="text-xs text-slate-500">Prenez en photo, c'est importé</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Analyse auto</p>
              <p className="text-xs text-slate-500">L'IA extrait les données</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Stats par SMS</p>
              <p className="text-xs text-slate-500">Tapez "stats" pour voir</p>
            </div>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            1
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-green-500' : 'bg-slate-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            2
          </div>
          <div className={`w-16 h-1 ${step >= 3 ? 'bg-green-500' : 'bg-slate-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            3
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Étape 1 : Activez le Sandbox Twilio
              </h4>
              <p className="text-sm text-green-800 mb-3">
                Envoyez un message WhatsApp au numéro Twilio pour activer la connexion :
              </p>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                <code className="font-mono text-lg text-green-700 flex-1">
                  {TWILIO_SANDBOX_NUMBER}
                </code>
                <button 
                  onClick={copyNumber}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-400" />}
                </button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                📱 Envoyez le message : <code className="bg-green-100 px-1 rounded">join &lt;votre-code&gt;</code>
              </p>
            </div>

            <Button 
              onClick={() => setStep(2)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              J'ai envoyé le message
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Étape 2 : Entrez votre numéro de téléphone
              </label>
              <input
                type="tel"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Le numéro depuis lequel vous avez envoyé le message "join"
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
              >
                Retour
              </Button>
              <Button 
                onClick={handleSaveNumber}
                disabled={isSaving || !inputPhone}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Activer WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Note Twilio */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-sm text-slate-600">
            <strong>ℹ️ Mode Sandbox :</strong> Vous utilisez le sandbox Twilio pour les tests. 
            En production, un numéro dédié sera disponible.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
