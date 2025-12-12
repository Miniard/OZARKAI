/**
 * DocumentsTable - Vue tableau exacte style Receptor AI
 * Colonnes: Checkbox, Type, Payment Status, Source, Source Details, ID, Date, Vendor, Billed To, Amount
 */

'use client';

import { useState } from 'react';
import { 
  FileText, 
  Receipt, 
  Mail, 
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MoreVertical,
  RefreshCw,
  Link2
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
}

export function DocumentsTable({ 
  documents, 
  onDocumentClick, 
  selectedIds = new Set(),
  onSelectionChange 
}: DocumentsTableProps) {
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

  // Trier les documents
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
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    }
    
    if (sortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatAmount = (amount: number | null, showSecondary = false) => {
    if (!amount) return '-';
    const formatted = `€${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`;
    return formatted;
  };

  // Générer une couleur basée sur le nom du fournisseur
  const getVendorColor = (name: string) => {
    const colors = [
      { bg: 'bg-cyan-500', text: 'text-white' },
      { bg: 'bg-red-500', text: 'text-white' },
      { bg: 'bg-emerald-500', text: 'text-white' },
      { bg: 'bg-orange-500', text: 'text-white' },
      { bg: 'bg-purple-500', text: 'text-white' },
      { bg: 'bg-blue-500', text: 'text-white' },
      { bg: 'bg-amber-500', text: 'text-white' },
      { bg: 'bg-indigo-600', text: 'text-white' },
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-slate-500" />
      : <ChevronDown className="w-3 h-3 text-slate-500" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {/* Checkbox */}
              <th className="w-10 px-4 py-3 bg-white">
                <input
                  type="checkbox"
                  checked={selectedIds.size === documents.length && documents.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600"
                />
              </th>
              {/* Type */}
              <th className="px-3 py-3 text-left bg-white">
                <span className="text-xs font-medium text-slate-500 uppercase">Type</span>
              </th>
              {/* Payment Status */}
              <th className="px-3 py-3 text-left bg-white">
                <span className="text-xs font-medium text-slate-500 uppercase">Payment<br/>Status</span>
              </th>
              {/* Source */}
              <th className="px-3 py-3 text-left bg-white">
                <span className="text-xs font-medium text-slate-500 uppercase">Source</span>
              </th>
              {/* Source Details */}
              <th className="px-3 py-3 text-left bg-white">
                <span className="text-xs font-medium text-slate-500 uppercase">Source Details</span>
              </th>
              {/* ID */}
              <th className="px-3 py-3 text-left bg-white">
                <span className="text-xs font-medium text-slate-500 uppercase">ID</span>
              </th>
              {/* Date */}
              <th className="px-3 py-3 text-left bg-white cursor-pointer" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-slate-500 uppercase">Date</span>
                  <SortIcon field="date" />
                </div>
              </th>
              {/* Vendor */}
              <th className="px-3 py-3 text-left bg-white cursor-pointer" onClick={() => handleSort('supplier')}>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-slate-500 uppercase">Vendor</span>
                  <SortIcon field="supplier" />
                </div>
              </th>
              {/* Billed To */}
              <th className="px-3 py-3 text-left bg-white">
                <span className="text-xs font-medium text-slate-500 uppercase">Billed To</span>
              </th>
              {/* Amount */}
              <th className="px-3 py-3 text-right bg-white cursor-pointer" onClick={() => handleSort('amount')}>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs font-medium text-slate-500 uppercase">Amount</span>
                  <SortIcon field="amount" />
                </div>
              </th>
              {/* Actions */}
              <th className="w-10 px-2 py-3 bg-white"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedDocs.map((doc) => {
              const isInvoice = doc.docType === 'FACTURE_ACHAT' || doc.docType === 'FACTURE_VENTE';
              const isPaid = doc.analyzed && doc.amount && doc.amount > 0;
              const invoiceNumber = doc.analysisData?.invoiceNumber || doc.analysisData?.numero || '-';
              const vendorName = doc.supplier || doc.analysisData?.fournisseur || 'Unknown';
              const vendorDesc = doc.analysisData?.description || doc.filename;
              const vendorColor = getVendorColor(vendorName);
              const sourceEmail = doc.analysisData?.sourceEmail || 'stove83130@gmail.com';
              const billedTo = doc.analysisData?.billedTo || 'N/A';
              const hasLinked = Math.random() > 0.7; // Simulé

              return (
                <tr 
                  key={doc.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onDocumentClick(doc)}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(doc.id)}
                      onChange={(e) => toggleSelect(doc.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600"
                    />
                  </td>
                  
                  {/* Type with icons */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-slate-300" />
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-slate-700">{isInvoice ? 'Invoice' : 'Receipt'}</span>
                      {hasLinked && (
                        <div className="flex items-center gap-0.5 text-xs text-primary-600">
                          <Link2 className="w-3 h-3" />
                          <span>1 linked</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Payment Status */}
                  <td className="px-3 py-3">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                        <Check className="w-3 h-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                        <X className="w-3 h-3" />
                        Unpaid
                      </span>
                    )}
                  </td>
                  
                  {/* Source */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Email</span>
                    </div>
                  </td>
                  
                  {/* Source Details */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-slate-500">{sourceEmail}</span>
                  </td>
                  
                  {/* ID */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-slate-600 font-mono">{invoiceNumber}</span>
                  </td>
                  
                  {/* Date */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-slate-700">{formatDate(doc.date)}</span>
                  </td>
                  
                  {/* Vendor */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${vendorColor.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className={`${vendorColor.text} text-xs font-bold`}>
                          {vendorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{vendorName}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{vendorDesc}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Billed To */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-slate-500">{billedTo}</span>
                  </td>
                  
                  {/* Amount */}
                  <td className="px-3 py-3 text-right">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatAmount(doc.amount)}
                      </span>
                      {doc.analysisData?.originalAmount && (
                        <p className="text-xs text-slate-400">
                          (${doc.analysisData.originalAmount})
                        </p>
                      )}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-2 py-3">
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-slate-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {documents.length === 0 && (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No documents found</p>
        </div>
      )}
    </div>
  );
}
