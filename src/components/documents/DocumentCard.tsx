/**
 * Carte de document - Design moderne et lumineux
 */

'use client';

import { formatCurrency, formatDateShort } from '@/lib/utils';
import { FileText, Calendar, Building2, CheckCircle2, Clock } from 'lucide-react';

interface DocumentCardProps {
  document: {
    id: string;
    filename: string;
    fileType: string;
    analyzed: boolean;
    docType?: string | null;
    amount?: number | null;
    date?: Date | string | null;
    supplier?: string | null;
    analysisData?: any;
  };
  onClick?: () => void;
  selected?: boolean;
}

export function DocumentCard({ document, onClick, selected = false }: DocumentCardProps) {
  const getDocTypeInfo = (type?: string | null) => {
    const types: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
      FACTURE_ACHAT: { 
        label: 'Achat', 
        emoji: '🛒', 
        bg: 'bg-danger-50', 
        text: 'text-danger-700', 
        border: 'border-danger-200' 
      },
      FACTURE_VENTE: { 
        label: 'Vente', 
        emoji: '💰', 
        bg: 'bg-success-50', 
        text: 'text-success-700', 
        border: 'border-success-200' 
      },
      NOTE_FRAIS: { 
        label: 'Frais', 
        emoji: '🍴', 
        bg: 'bg-warning-50', 
        text: 'text-warning-700', 
        border: 'border-warning-200' 
      },
      RECU: { 
        label: 'Reçu', 
        emoji: '🧾', 
        bg: 'bg-primary-50', 
        text: 'text-primary-700', 
        border: 'border-primary-200' 
      },
      RELEVE_BANCAIRE: { 
        label: 'Banque', 
        emoji: '🏦', 
        bg: 'bg-purple-50', 
        text: 'text-purple-700', 
        border: 'border-purple-200' 
      },
      AUTRE: { 
        label: 'Autre', 
        emoji: '📄', 
        bg: 'bg-slate-50', 
        text: 'text-slate-700', 
        border: 'border-slate-200' 
      },
    };
    return types[type || 'AUTRE'] || types['AUTRE'];
  };

  const docTypeInfo = getDocTypeInfo(document.docType);

  return (
    <div
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden
        ${selected 
          ? 'bg-primary-50 border-primary-300 shadow-sm' 
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-soft-md'
        }
      `}
    >
      {/* Active Indicator Strip */}
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
      )}

      <div className="p-4 flex items-start gap-4">
        {/* Icon Box */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl border
          ${docTypeInfo.bg} ${docTypeInfo.border}
        `}>
          {docTypeInfo.emoji}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`font-medium truncate pr-2 ${selected ? 'text-primary-700' : 'text-slate-900'}`}>
              {document.filename}
            </h3>
            {document.amount && (
              <span className={`text-lg font-bold whitespace-nowrap ${
                document.docType === 'FACTURE_VENTE' ? 'text-success-600' : 'text-slate-900'
              }`}>
                {document.docType === 'FACTURE_VENTE' ? '+' : ''}{formatCurrency(document.amount)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            {document.supplier && (
              <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{document.supplier}</span>
              </div>
            )}
            {document.date && (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className="w-3 h-3" />
                <span>{formatDateShort(document.date)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className={`
              inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border
              ${docTypeInfo.bg} ${docTypeInfo.text} ${docTypeInfo.border}
            `}>
              {docTypeInfo.label}
            </span>
            
            {document.analyzed ? (
              <span className="flex items-center gap-1 text-xs text-success-700 font-medium bg-success-50 px-2.5 py-1 rounded-lg border border-success-200">
                <CheckCircle2 className="w-3 h-3" />
                Analysé
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-warning-700 font-medium bg-warning-50 px-2.5 py-1 rounded-lg border border-warning-200">
                <Clock className="w-3 h-3 animate-pulse" />
                Analyse...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
