/**
 * Composant de configuration WhatsApp Business
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
  Smartphone
} from 'lucide-react';

interface WhatsAppSetupProps {
  onSetupComplete?: () => void;
}

export function WhatsAppSetup({ onSetupComplete }: WhatsAppSetupProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      setIsConnected(data.connected);
      setPhoneNumber(data.phoneNumber || '');
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
    } catch (e) {
      setError('Erreur lors de la déconnexion');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  // Connecté
  if (isConnected) {
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
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">1</span>
                <span>Ajoutez le numéro Komptal à vos contacts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">2</span>
                <span>Envoyez une photo ou PDF de votre facture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">3</span>
                <span>L'IA analyse et importe automatiquement !</span>
              </li>
            </ol>
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

  // Non connecté
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

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Votre numéro de téléphone
            </label>
            <input
              type="tel"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Le numéro depuis lequel vous enverrez vos factures
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              Numéro enregistré avec succès !
            </div>
          )}

          <Button 
            onClick={handleSaveNumber}
            disabled={isSaving || !inputPhone}
            className="w-full bg-green-600 hover:bg-green-700"
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

        {/* Note */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>📝 Note :</strong> Après activation, vous pourrez envoyer vos factures au numéro Komptal. 
            Assurez-vous d'envoyer depuis le numéro enregistré ci-dessus.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

