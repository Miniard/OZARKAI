'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  Mail, 
  Building2, 
  Shield, 
  Trash2, 
  Save, 
  Loader2,
  Crown,
  AlertTriangle,
  Download,
  FileJson,
  MessageCircle,
  Plus,
  MoreVertical
} from 'lucide-react';
import { WhatsAppSetup } from '@/components/whatsapp/WhatsAppSetup';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  planExpiresAt: string | null;
  gmailConnected: boolean;
  createdAt: string;
  _count: {
    companies: number;
  };
}

export function SettingsPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [showNewOrgInput, setShowNewOrgInput] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName, companyType: 'MICRO_ENTREPRISE', vatRegime: 'FRANCHISE_BASE' }),
      });
      if (response.ok) {
        await fetchOrganizations();
        setNewOrgName('');
        setShowNewOrgInput(false);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setCreatingOrg(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name || '');
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (response.ok) {
        const updated = await response.json();
        setProfile(prev => prev ? { ...prev, name: updated.name } : null);
        // Mettre à jour la session
        await update({ name: updated.name });
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER MON COMPTE') return;
    
    setDeleting(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      
      if (response.ok) {
        signOut({ callbackUrl: '/' });
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Organizations / Workspaces */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Organizations</h2>
              <p className="text-sm text-slate-500">Manage your workspaces</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowNewOrgInput(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Organization
          </Button>
        </div>

        {/* New org input */}
        {showNewOrgInput && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Organization name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="My Organization"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <Button onClick={createOrganization} disabled={creatingOrg || !newOrgName.trim()}>
                {creatingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => { setShowNewOrgInput(false); setNewOrgName(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Organizations list */}
        <div className="space-y-2">
          {organizations.map((org) => (
            <div 
              key={org.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <span className="text-white font-bold">{org.name?.charAt(0) || 'O'}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">
                    {org._count?.documents || 0} documents • Created {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
          
          {organizations.length === 0 && !showNewOrgInput && (
            <div className="text-center py-8 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No organizations yet</p>
              <button 
                onClick={() => setShowNewOrgInput(true)}
                className="text-primary-600 hover:text-primary-700 text-sm mt-2"
              >
                Create your first organization
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Profil */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profil</h2>
            <p className="text-sm text-slate-500">Gérez vos informations personnelles</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">{profile?.email}</span>
              <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                Non modifiable
              </span>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Abonnement */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Abonnement</h2>
            <p className="text-sm text-slate-500">Votre plan actuel</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Plan</p>
            <p className="font-semibold text-slate-900 capitalize">
              {profile?.plan?.toLowerCase() || 'Starter'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Entreprises</p>
            <p className="font-semibold text-slate-900">
              {profile?._count.companies || 0}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Gmail connecté</p>
            <p className={`font-semibold ${profile?.gmailConnected ? 'text-success-600' : 'text-slate-400'}`}>
              {profile?.gmailConnected ? 'Oui' : 'Non'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Membre depuis</p>
            <p className="font-semibold text-slate-900">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Sécurité */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sécurité</h2>
            <p className="text-sm text-slate-500">Connexion et authentification</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-emerald-800">Connecté via Google</p>
              <p className="text-sm text-emerald-600">Votre compte est sécurisé par Google</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Export des données */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Mes données</h2>
            <p className="text-sm text-slate-500">Exportez vos données (RGPD)</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <FileJson className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-800">Export complet de vos données</p>
              <p className="text-sm text-blue-600 mb-4">
                Téléchargez toutes vos données personnelles, entreprises, documents et factures au format JSON.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.open('/api/user/export-data', '_blank')}
                className="border-blue-300 text-blue-600 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger mes données
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* WhatsApp Business */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">WhatsApp Business</h2>
            <p className="text-sm text-slate-500">Envoyez vos factures par WhatsApp</p>
          </div>
        </div>
        <WhatsAppSetup />
      </Card>

      {/* Zone de danger */}
      <Card padding="lg" className="border-danger-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-danger-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-danger-700">Zone de danger</h2>
            <p className="text-sm text-slate-500">Actions irréversibles</p>
          </div>
        </div>

        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-danger-800">Supprimer mon compte</p>
              <p className="text-sm text-danger-600 mb-4">
                Cette action est irréversible. Toutes vos données, entreprises et documents seront définitivement supprimés.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(true)}
                className="border-danger-300 text-danger-600 hover:bg-danger-100"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer mon compte
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de confirmation suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Supprimer le compte ?</h3>
                <p className="text-sm text-slate-500">Cette action est irréversible</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Pour confirmer, tapez <strong>SUPPRIMER MON COMPTE</strong> ci-dessous :
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm mb-4
                       focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500"
              placeholder="SUPPRIMER MON COMPTE"
            />

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'SUPPRIMER MON COMPTE' || deleting}
                className="flex-1 bg-danger-600 hover:bg-danger-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Confirmer'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

