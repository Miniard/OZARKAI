/**
 * Sidebar Navigation - Design Pro 2025
 * Style minimaliste et professionnel
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
  ChevronDown,
  Calendar,
  Plus,
  Check,
  Building2
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
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'upload', label: 'Importer', icon: UploadCloud },
    { id: 'connectors', label: 'Connexions', icon: Link2 },
    { id: 'extraction', label: 'Extraction', icon: Calendar },
  ];

  const bottomMenuItems = [
    { id: 'settings', label: 'Paramètres', icon: Settings },
    { id: 'help', label: 'Aide', icon: HelpCircle },
  ];

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen bg-slate-950 
        transition-all duration-200 ease-out z-50 flex flex-col
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-slate-900 font-bold text-sm">K</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-white whitespace-nowrap">
              Komptal
            </span>
          )}
        </div>
      </div>

      {/* Organization Selector */}
      {!collapsed && companies.length > 0 && (
        <div className="px-3 py-3 border-b border-slate-800" ref={orgDropdownRef}>
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {selectedCompany?.name || 'Mon Entreprise'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showOrgDropdown && (
            <div className="absolute left-3 right-3 mt-2 bg-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50">
              <div className="py-1 max-h-60 overflow-y-auto">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setSelectedCompanyId?.(company.id);
                      setShowOrgDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-300 text-xs font-medium">
                        {company.name?.charAt(0) || 'E'}
                      </span>
                    </div>
                    <span className="flex-1 text-left text-sm text-slate-300 truncate">
                      {company.name}
                    </span>
                    {company.id === selectedCompanyId && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-700 py-1">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowOrgDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors text-slate-400"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Ajouter une organisation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-0.5">
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

      {/* Bottom Navigation */}
      <div className="px-2 py-3 border-t border-slate-800">
        <div className="space-y-0.5">
          {bottomMenuItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="relative px-2 py-3 border-t border-slate-800" ref={profileMenuRef}>
        {showProfileMenu && !collapsed && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-700">
              <p className="text-sm font-medium text-white">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </button>
              <button
                onClick={() => { setActiveTab('security'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Sécurité
              </button>
              <button
                onClick={() => { setActiveTab('billing'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Facturation
              </button>
            </div>

            <div className="border-t border-slate-700 py-1">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => !collapsed && setShowProfileMenu(!showProfileMenu)}
          className={`w-full flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''} 
                     rounded-lg p-2 hover:bg-slate-800 transition-colors cursor-pointer`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-slate-300">
              {(userName?.[0] || userEmail?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">
                {userName || 'Utilisateur'}
              </p>
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full 
                   flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700
                   transition-all shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}

/* Nav Item Component */
interface NavItemProps {
  item: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
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
        w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150
        ${isActive 
          ? 'bg-slate-800 text-white' 
          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? item.label : ''}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      
      {!collapsed && (
        <span className="text-sm font-medium">
          {item.label}
        </span>
      )}
    </button>
  );
}
