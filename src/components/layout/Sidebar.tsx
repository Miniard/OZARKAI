/**
 * Sidebar Navigation - Design lumineux et moderne
 */

'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userEmail?: string | null;
  userName?: string | null;
  companies: any[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  userEmail,
  userName,
  companies,
  selectedCompanyId,
  setSelectedCompanyId
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const mainMenuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'upload', label: 'Importer', icon: UploadCloud },
    { id: 'gmail', label: 'Import Gmail', icon: Mail },
    { id: 'outlook', label: 'Import Outlook', icon: Mail },
    { id: 'documents', label: 'Mes Factures', icon: FileText },
    { id: 'teams', label: 'Équipes', icon: Building2 },
  ];

  const settingsMenuItems = [
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen bg-white border-r border-slate-200
        transition-all duration-300 ease-out z-50 flex flex-col
        ${collapsed ? 'w-20' : 'w-72'}
      `}
    >
      {/* Header Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="/logo-icon.svg" alt="Komptal" className="w-9 h-9 flex-shrink-0" />
          <span className={`text-xl font-bold text-slate-900 whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            Komptal
          </span>
        </div>
      </div>

      {/* Company Selector */}
      <div className={`px-4 py-4 ${collapsed ? 'items-center' : ''} flex flex-col`}>
        {!collapsed && (
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">
            Entreprise
          </p>
        )}
        
        {companies.length > 0 ? (
          collapsed ? (
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto cursor-pointer hover:bg-slate-200 transition-colors">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
          ) : (
            <select
              value={selectedCompanyId || ''}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 
                        focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 
                        transition-all hover:bg-slate-100 cursor-pointer"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )
        ) : (
          !collapsed && (
            <p className="text-xs text-slate-400 px-1">Aucune entreprise</p>
          )
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        {/* Main Menu */}
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

        {/* Divider */}
        <div className="my-4 mx-2 h-px bg-slate-100" />

        {/* Settings Section */}
        <div className="space-y-1">
          {settingsMenuItems.map((item) => (
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
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-600">
              {(userName?.[0] || userEmail?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {userName || 'Utilisateur'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {userEmail || ''}
                </p>
              </div>
              
              <button 
                onClick={() => signOut()}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full 
                   flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 
                   transition-all shadow-soft-sm z-50"
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
    icon: any;
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
          ? 'bg-primary-50 text-primary-700' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }
      `}
      title={collapsed ? item.label : ''}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
      )}
      
      {/* Icon */}
      <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
      
      {/* Label */}
      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
        {item.label}
      </span>

      {/* New badge */}
      {item.isNew && !collapsed && (
        <span className="ml-auto px-2 py-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full uppercase">
          New
        </span>
      )}
    </button>
  );
}
