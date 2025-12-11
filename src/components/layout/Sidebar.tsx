/**
 * Sidebar Navigation - Dark Theme Style Receptor AI
 * Avec sections collapsibles et design moderne
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  Mail,
  Settings,
  CreditCard,
  HelpCircle,
  Users,
  Calendar,
  BarChart3,
  Receipt,
  RefreshCcw,
  Briefcase,
  Sparkles,
  ExternalLink
} from 'lucide-react';
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

interface MenuSection {
  id: string;
  label: string;
  icon: any;
  items?: { id: string; label: string; icon?: any }[];
  isExpandable?: boolean;
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['documents']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const menuSections: MenuSection[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'sources', 
      label: 'Sources', 
      icon: Mail,
      isExpandable: true,
      items: [
        { id: 'connectors', label: 'Email Accounts' },
        { id: 'upload', label: 'Quick Upload' },
      ]
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: FileText,
      isExpandable: true,
      items: [
        { id: 'documents', label: 'Accounting' },
        { id: 'bills', label: 'Bills to Pay' },
        { id: 'recurring', label: 'Recurring' },
        { id: 'vendors', label: 'Vendors' },
      ]
    },
    { id: 'extraction', label: 'Retroactive', icon: RefreshCcw },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { 
      id: 'rules', 
      label: 'Rules', 
      icon: Settings,
      isExpandable: true,
      items: [
        { id: 'settings', label: 'Settings' },
      ]
    },
    { id: 'teams', label: 'Integrations', icon: Briefcase },
  ];

  const bottomMenuItems = [
    { id: 'billing', label: 'Exports History', icon: Receipt },
    { id: 'help', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Header - Logo & Ask AI Button */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-white font-semibold text-lg">Komptal</span>
        </div>
        
        {/* Ask AI Button */}
        <button className="w-full flex items-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Sparkles className="w-4 h-4" />
          Ask AI
          <span className="ml-auto text-xs bg-white/20 px-1.5 py-0.5 rounded">Upgrade</span>
        </button>
      </div>

      {/* Company Selector */}
      <div className="px-4 py-3 border-b border-white/10">
        {companies.length > 0 ? (
          <select
            value={selectedCompanyId || ''}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full bg-sidebar-light border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 
                      focus:outline-none focus:ring-2 focus:ring-primary-500/50 
                      transition-all cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id} className="bg-sidebar text-white">
                {company.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Building2 className="w-4 h-4" />
            No company
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar-dark">
        {menuSections.map((section) => (
          <div key={section.id} className="px-2">
            {section.isExpandable ? (
              <>
                {/* Expandable Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${expandedSections.includes(section.id) 
                      ? 'text-white bg-white/5' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{section.label}</span>
                  {expandedSections.includes(section.id) 
                    ? <ChevronDown className="w-4 h-4 text-white/50" />
                    : <ChevronRight className="w-4 h-4 text-white/50" />
                  }
                </button>
                
                {/* Sub Items */}
                {expandedSections.includes(section.id) && section.items && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                          ${activeTab === item.id
                            ? 'text-primary-400 bg-primary-500/10 font-medium'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === item.id ? 'bg-primary-400' : 'bg-white/30'}`} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Single Item */
              <button
                onClick={() => setActiveTab(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${activeTab === section.id
                    ? 'text-white bg-sidebar-light'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                <section.icon className="w-5 h-5" />
                <span>{section.label}</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 p-2">
        {bottomMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
              ${activeTab === item.id
                ? 'text-white bg-sidebar-light'
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Footer - Help & User */}
      <div className="p-4 border-t border-white/10">
        {/* Help Link */}
        <a 
          href="#" 
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 mb-4 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          How do I integrate with Komptal?
        </a>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {(userName?.[0] || userEmail?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {userName || 'User'}
            </p>
            <p className="text-xs text-white/50 truncate">
              {userEmail || ''}
            </p>
          </div>
          <button 
            onClick={() => signOut()}
            className="p-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
