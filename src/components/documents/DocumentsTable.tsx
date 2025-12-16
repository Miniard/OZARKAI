/**
 * DocumentsTable - Design Pro 2025
 * Table minimaliste et professionnelle
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  ChevronDown,
  ChevronUp,
  Check,
  MoreHorizontal,
  Trash2,
  Download,
  Eye,
  ArrowUpDown
} from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  fileUrl?: string;
  fileType?: string;
  docType: string | null;
  amount: number | null;
  vat: number | null;
  date: Date | string | null;
  supplier: string | null;
  analyzed: boolean;
  analysisData: any;
  source?: string;
  createdAt?: Date | string;
  exported?: boolean;
}

interface DocumentsTableProps {
  documents: Document[];
  onDocumentClick: (doc: Document) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onDeleteSelected?: () => void;
  onExportSelected?: (format: 'csv' | 'json') => void;
  onDeleteDocument?: (id: string) => void;
}

export function DocumentsTable({ 
  documents, 
  onDocumentClick, 
  selectedIds = new Set(),
  onSelectionChange,
  onDeleteSelected,
  onExportSelected,
  onDeleteDocument
}: DocumentsTableProps) {
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  
  useEffect(() => {
    const handleClickOutside = () => setActionMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.size === documents.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(documents.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const sortedDocs = [...documents].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortField) {
      case 'date':
        aVal = a.date ? new Date(a.date).getTime() : 0;
        bVal = b.date ? new Date(b.date).getTime() : 0;
        break;
      case 'amount':
        aVal = a.amount || 0;
        bVal = b.amount || 0;
        break;
      case 'supplier':
        aVal = a.supplier || '';
        bVal = b.supplier || '';
        break;
      default:
        return 0;
    }
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getDocTypeLabel = (type: string | null) => {
    const types: Record<string, { label: string; color: string }> = {
      'FACTURE_ACHAT': { label: 'Facture', color: 'bg-blue-50 text-blue-700' },
      'FACTURE_VENTE': { label: 'Facture', color: 'bg-emerald-50 text-emerald-700' },
      'RECU': { label: 'Reçu', color: 'bg-amber-50 text-amber-700' },
      'ABONNEMENT': { label: 'Abonnement', color: 'bg-purple-50 text-purple-700' },
      'AVOIR': { label: 'Avoir', color: 'bg-red-50 text-red-700' },
      'NOTE_FRAIS': { label: 'Note de frais', color: 'bg-cyan-50 text-cyan-700' },
      'DEVIS': { label: 'Devis', color: 'bg-slate-100 text-slate-700' },
    };
    return types[type || ''] || { label: 'Document', color: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Action Bar */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onSelectionChange?.(new Set())}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
          </div>
          <div className="flex items-center gap-2">
            {onExportSelected && (
              <button
                onClick={() => onExportSelected('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            )}
            {onDeleteSelected && (
              <button
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 bg-slate-800 hover:bg-red-900/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="w-14 px-4 py-3">
                <div 
                  className="flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectAll();
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedIds.size === documents.length && documents.length > 0
                      ? 'bg-violet-600 border-violet-600'
                      : selectedIds.size > 0
                        ? 'bg-violet-200 border-violet-400'
                        : 'border-slate-300 bg-white hover:border-violet-400'
                  }`}>
                    {selectedIds.size === documents.length && documents.length > 0 && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                    {selectedIds.size > 0 && selectedIds.size < documents.length && (
                      <div className="w-2.5 h-0.5 bg-violet-600 rounded" />
                    )}
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</span>
              </th>
              <th className="px-4 py-3 text-left">
                <button 
                  onClick={() => handleSort('supplier')}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wide hover:text-slate-900"
                >
                  Fournisseur
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Numéro</span>
              </th>
              <th className="px-4 py-3 text-left">
                <button 
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wide hover:text-slate-900"
                >
                  Date
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button 
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wide hover:text-slate-900 ml-auto"
                >
                  Montant
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Statut</span>
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedDocs.map((doc) => {
              const typeInfo = getDocTypeLabel(doc.docType || doc.analysisData?.type);
              const invoiceNumber = doc.analysisData?.numero || doc.analysisData?.invoiceNumber || '-';
              const vendorName = doc.supplier || doc.analysisData?.fournisseur || 'Inconnu';
              const isSelected = selectedIds.has(doc.id);
              const isPaid = doc.analysisData?.paymentStatus === 'PAYE' || doc.analyzed;

              return (
                <tr 
                  key={doc.id}
                  onClick={() => onDocumentClick(doc)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <div 
                      className="flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(doc.id, e);
                      }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-violet-600 border-violet-600'
                          : 'border-slate-300 bg-white hover:border-violet-400'
                      }`}>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </td>

                  {/* Vendor */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {doc.analysisData?.vendorLogo ? (
                        <img 
                          src={doc.analysisData.vendorLogo} 
                          alt="" 
                          className="w-8 h-8 rounded-lg object-contain bg-slate-100 p-1"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-500">
                            {vendorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{vendorName}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{doc.filename}</p>
                      </div>
                    </div>
                  </td>

                  {/* Invoice Number */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600 font-mono">{invoiceNumber}</span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{formatDate(doc.date)}</span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-slate-900">{formatAmount(doc.amount)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                        <Check className="w-3 h-3" />
                        Traité
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                        En attente
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuId(actionMenuId === doc.id ? null : doc.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {actionMenuId === doc.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onDocumentClick(doc);
                              setActionMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                          {onExportSelected && (
                            <button
                              onClick={() => {
                                onSelectionChange?.(new Set([doc.id]));
                                onExportSelected('csv');
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Exporter
                            </button>
                          )}
                          {onDeleteDocument && (
                            <button
                              onClick={() => {
                                onDeleteDocument(doc.id);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="px-4 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">Aucun document</p>
        </div>
      )}
    </div>
  );
}
