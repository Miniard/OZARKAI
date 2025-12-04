/**
 * Filtres de documents - Design moderne
 */

'use client';

import { Filter } from 'lucide-react';

interface DocumentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const DOC_TYPES = [
  { value: 'ALL', label: 'Tout', emoji: '📑' },
  { value: 'FACTURE_VENTE', label: 'Ventes', emoji: '💰' },
  { value: 'FACTURE_ACHAT', label: 'Achats', emoji: '🛒' },
  { value: 'NOTE_FRAIS', label: 'Frais', emoji: '🍴' },
  { value: 'RECU', label: 'Reçus', emoji: '🧾' },
  { value: 'RELEVE_BANCAIRE', label: 'Banque', emoji: '🏦' },
];

export function DocumentFilters({
  selectedType,
  onTypeChange,
}: DocumentFiltersProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
      <div className="px-2 text-slate-400">
        <Filter className="w-4 h-4" />
      </div>
      <div className="h-4 w-px bg-slate-300" />
      <div className="flex gap-1 overflow-x-auto hide-scrollbar">
        {DOC_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
              ${selectedType === type.value
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }
            `}
          >
            <span className="mr-1.5">{type.emoji}</span>
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
