/**
 * Sidebar Navigation - Design moderne avec sélecteur d'organisation
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
  ChevronDown,
  Calendar,
  Plus,
  Check
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string | null;
  userName?: string | null;
  companies?: any[];
  selectedCompanyId?: string | null;
  setSelectedCompanyId?: (id: string) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  userEmail,
  userName,
  companies = [],
  selectedCompanyId,
  setSelectedCompanyId,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false);
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

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen bg-white border-r border-slate-200
        transition-all duration-300 ease-out z-50 flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className={`text-xl font-bold text-slate-900 whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            Komptal
          </span>
        </div>
      </div>

      {/* Organization Selector */}
      {!collapsed && companies.length > 0 && (
        <div className="px-3 py-3 border-b border-slate-100" ref={orgDropdownRef}>
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {selectedCompany?.name?.charAt(0) || 'E'}
              </span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {selectedCompany?.name || 'Mon Entreprise'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Organization Dropdown */}
          {showOrgDropdown && (
            <div className="absolute left-3 right-3 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="py-2 max-h-60 overflow-y-auto">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setSelectedCompanyId?.(company.id);
                      setShowOrgDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 text-sm font-bold">
                        {company.name?.charAt(0) || 'E'}
                      </span>
                    </div>
                    <span className="flex-1 text-left text-sm font-medium text-slate-700 truncate">
                      {company.name}
                    </span>
                    {company.id === selectedCompanyId && (
                      <Check className="w-4 h-4 text-primary-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 py-2">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowOrgDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-600"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Gérer les organisations</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowOrgDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Nouvelle organisation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed org icon */}
      {collapsed && companies.length > 0 && (
        <div className="px-3 py-3 border-b border-slate-100 flex justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-bold">
              {selectedCompany?.name?.charAt(0) || 'E'}
            </span>
          </div>
        </div>
      )}

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
      <div className="relative p-3 border-t border-slate-100" ref={profileMenuRef}>
        {/* Menu Dropdown */}
        {showProfileMenu && !collapsed && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2">
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
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 
                         group-hover:ring-2 group-hover:ring-primary-200 transition-all">
            <span className="text-sm font-semibold text-primary-600">
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
