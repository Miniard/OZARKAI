/**
 * Sidebar Navigation - Design clair et minimaliste
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Link2,
  Settings,
  CreditCard,
  HelpCircle,
  Shield,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string | null;
  userName?: string | null;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  userEmail,
  userName,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainMenuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'upload', label: 'Importer', icon: UploadCloud },
    { id: 'connectors', label: 'Email', icon: Link2 },
    { id: 'extraction', label: 'Extraction', icon: Calendar, isNew: true },
    { id: 'documents', label: 'Mes Factures', icon: FileText },
  ];

  const profileMenuItems = [
    { id: 'settings', label: 'Paramètres du compte', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'help', label: 'Aide & Support', icon: HelpCircle },
  ];

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen bg-white border-r border-slate-200
        transition-all duration-300 ease-out z-50 flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header Logo - Même hauteur que la top bar (h-12) */}
      <div className="h-12 flex items-center px-4 bg-white">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">K</span>
          </div>
          <span className={`text-lg font-bold text-slate-900 whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            Komptal
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainMenuItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Footer User Profile */}
      <div className="relative p-4 border-t border-slate-100" ref={profileMenuRef}>
        {/* Menu Dropdown */}
        {showProfileMenu && !collapsed && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-semibold text-slate-900">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
            
            <div className="py-2">
              {profileMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Profile Button */}
        <button
          onClick={() => !collapsed && setShowProfileMenu(!showProfileMenu)}
          className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center' : ''} 
                     rounded-xl p-2 hover:bg-slate-100 transition-all cursor-pointer group`}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 
                         group-hover:ring-2 group-hover:ring-emerald-200 transition-all">
            <span className="text-sm font-semibold text-emerald-600">
              {(userName?.[0] || userEmail?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {userName || 'Utilisateur'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {userEmail || ''}
                </p>
              </div>
              
              <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full 
                   flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 
                   transition-all shadow-sm z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}

/* ===========================================
   NAV ITEM COMPONENT
   =========================================== */

interface NavItemProps {
  item: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isNew?: boolean;
  };
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavItem({ item, isActive, collapsed, onClick }: NavItemProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
        ${isActive 
          ? 'bg-emerald-50 text-emerald-700' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }
      `}
      title={collapsed ? item.label : ''}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
      )}
      
      {/* Icon */}
      <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
      
      {/* Label */}
      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
        {item.label}
      </span>

      {/* New badge */}
      {item.isNew && !collapsed && (
        <span className="ml-auto px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase">
          New
        </span>
      )}
    </button>
  );
}
