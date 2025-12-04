'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Plus, 
  Settings, 
  Trash2, 
  Mail, 
  Crown, 
  Shield, 
  Eye,
  UserPlus,
  Loader2,
  X,
  Copy,
  Check
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  myRole: string;
  memberCount: number;
  pendingInvitations: number;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  OWNER: { label: 'Propriétaire', icon: Crown, color: 'text-amber-600 bg-amber-50' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  MEMBER: { label: 'Membre', icon: Users, color: 'text-slate-600 bg-slate-50' },
  VIEWER: { label: 'Observateur', icon: Eye, color: 'text-slate-400 bg-slate-50' },
};

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Erreur chargement équipes:', error);
    } finally {
      setLoading(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Mes Équipes</h2>
          <p className="text-sm text-slate-500">Collaborez avec vos collègues</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Créer une équipe
        </Button>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune équipe</h3>
          <p className="text-slate-500 mb-6">
            Créez une équipe pour collaborer avec vos collègues.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Créer ma première équipe
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team} 
              onInvite={() => setShowInviteModal(team.id)}
              onSelect={() => setSelectedTeam(team)}
              onRefresh={fetchTeams}
            />
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => {
            setShowCreateModal(false);
            fetchTeams();
          }}
        />
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal 
          teamId={showInviteModal}
          onClose={() => setShowInviteModal(null)} 
          onInvited={() => {
            setShowInviteModal(null);
            fetchTeams();
          }}
        />
      )}
    </div>
  );
}

function TeamCard({ 
  team, 
  onInvite, 
  onSelect,
  onRefresh 
}: { 
  team: Team; 
  onInvite: () => void;
  onSelect: () => void;
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const roleConfig = ROLE_LABELS[team.myRole] || ROLE_LABELS.MEMBER;
  const RoleIcon = roleConfig.icon;

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir quitter l'équipe "${team.name}" ?`)) return;
    
    try {
      const response = await fetch(`/api/teams/${team.id}/members?userId=me`, { method: 'DELETE' });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <Card padding="lg" className="hover:border-primary-200 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{team.name}</h3>
            {team.description && (
              <p className="text-sm text-slate-500 mt-0.5">{team.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${roleConfig.color}`}>
                <RoleIcon className="w-3 h-3" />
                {roleConfig.label}
              </span>
              <span className="text-xs text-slate-400">
                {team.memberCount} membre{team.memberCount > 1 ? 's' : ''}
              </span>
              {team.pendingInvitations > 0 && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {team.pendingInvitations} invitation{team.pendingInvitations > 1 ? 's' : ''} en attente
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['OWNER', 'ADMIN'].includes(team.myRole) && (
            <Button variant="outline" size="sm" onClick={onInvite}>
              <UserPlus className="w-4 h-4 mr-1" />
              Inviter
            </Button>
          )}
          {team.myRole === 'OWNER' ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete}
              disabled={deleting}
              className="text-danger-600 hover:bg-danger-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLeave}
              className="text-slate-400 hover:text-danger-600 hover:bg-danger-50"
            >
              Quitter
            </Button>
          )}
        </div>
      </div>

      {/* Members preview */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-2">Membres</p>
        <div className="flex flex-wrap gap-2">
          {team.members.slice(0, 5).map((member) => (
            <div 
              key={member.id}
              className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg"
            >
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-600">
                {(member.user.name?.[0] || member.user.email[0]).toUpperCase()}
              </div>
              <span className="text-sm text-slate-600">
                {member.user.name || member.user.email}
              </span>
            </div>
          ))}
          {team.memberCount > 5 && (
            <span className="text-sm text-slate-400 px-2 py-1">
              +{team.memberCount - 5} autres
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      
      if (response.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Erreur création:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Créer une équipe</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom de l'équipe *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="Ex: Équipe Comptabilité"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              rows={3}
              placeholder="Description de l'équipe..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || creating} className="flex-1">
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteMemberModal({ teamId, onClose, onInvited }: { teamId: string; onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setInviting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      
      if (response.ok) {
        onInvited();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de l\'invitation');
      }
    } catch (error) {
      console.error('Erreur invitation:', error);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Inviter un membre</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="collegue@entreprise.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rôle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="ADMIN">Admin - Peut gérer les membres</option>
              <option value="MEMBER">Membre - Lecture et écriture</option>
              <option value="VIEWER">Observateur - Lecture seule</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleInvite} disabled={!email.trim() || inviting} className="flex-1">
              {inviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Inviter
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


