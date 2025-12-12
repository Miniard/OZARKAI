/**
 * DocumentDetail - Style Receptor AI
 * Formulaire à gauche avec tabs + Preview PDF à droite
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, Download, Trash2, Save, Loader2, Check,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText,
  Plus, X, Maximize2, RotateCw
} from 'lucide-react';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate?: number;
}

interface DocumentDetailProps {
  document: {
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
  };
  onClose?: () => void;
  onSave?: (data: any) => void;
  onDelete?: () => void;
  onAnalyzed?: () => void;
}

type Tab = 'basic' | 'lineItems' | 'exports' | 'duplicates';

export function DocumentDetail({ document, onClose, onSave, onDelete, onAnalyzed }: DocumentDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2; // Simulé
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    docType: document.docType || 'FACTURE_ACHAT',
    supplier: document.supplier || '',
    supplierVatNumber: document.analysisData?.supplierVatNumber || '',
    invoiceNumber: document.analysisData?.invoiceNumber || document.analysisData?.numero || '',
    receiptNumber: '',
    transactionId: '',
    poNumber: '',
    quoteId: '',
    date: document.date ? new Date(document.date).toISOString().split('T')[0] : '',
    dueDate: document.analysisData?.dueDate || '',
    billedTo: '',
    account: document.analysisData?.category || '',
    currency: document.analysisData?.currency || 'EUR',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    document.analysisData?.lineItems || []
  );

  const isPDF = document.fileType === 'pdf' || document.filename?.toLowerCase().endsWith('.pdf');
  const isImage = document.fileType?.startsWith('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.filename || '');

  // Auto-analyze
  useEffect(() => {
    if (!document.analyzed && !isAnalyzing && !document.analysisData?.lineItems?.length) {
      autoAnalyze();
    }
  }, [document.id]);

  const autoAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });
      const data = await response.json();
      
      if (data.analysis) {
        setFormData(prev => ({
          ...prev,
          docType: data.analysis.type || prev.docType,
          supplier: data.analysis.fournisseur || prev.supplier,
          supplierVatNumber: data.analysis.fournisseurTVA || prev.supplierVatNumber,
          invoiceNumber: data.analysis.numero || prev.invoiceNumber,
          date: data.analysis.date || prev.date,
          account: data.analysis.category || prev.account,
        }));
        if (data.analysis.lineItems?.length) {
          setLineItems(data.analysis.lineItems);
        }
      }
      if (onAnalyzed) onAnalyzed();
    } catch (e) {
      console.error('Auto-analyze error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].amount = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
    }
    setLineItems(updated);
    setHasChanges(true);
  };

  const addLine = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    setHasChanges(true);
  };

  const removeLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { ...formData, lineItems };
      if (onSave) {
        await onSave(dataToSave);
      } else {
        await fetch(`/api/documents/${document.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });
      }
      setHasChanges(false);
      if (onAnalyzed) onAnalyzed();
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!document.fileUrl) return;
    if (document.fileUrl.startsWith('data:')) {
      const [header, base64Data] = document.fileUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.filename || 'document';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      window.open(document.fileUrl, '_blank');
    }
  };

  // Générer couleur vendeur
  const getVendorColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-primary-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const vendorName = formData.supplier || 'Unknown';
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'basic', label: 'Basic' },
    { id: 'lineItems', label: 'Line Items', count: lineItems.length },
    { id: 'exports', label: 'Exports', count: 0 },
    { id: 'duplicates', label: 'Duplicates', count: 0 },
  ];

  const docTypeOptions = [
    { value: 'FACTURE_ACHAT', label: 'Invoice' },
    { value: 'RECU', label: 'Receipt' },
    { value: 'NOTE_FRAIS', label: 'Expense' },
    { value: 'DEVIS', label: 'Quote' },
    { value: 'AUTRE', label: 'Other' },
  ];

  const accountOptions = [
    { value: '', label: 'Select account...' },
    { value: 'SOFTWARE', label: 'Software and subscription services' },
    { value: 'OFFICE', label: 'Office supplies' },
    { value: 'TRAVEL', label: 'Travel expenses' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'OTHER', label: 'Other expenses' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button className="hover:text-slate-700">← Previous</button>
          <button className="hover:text-slate-700">Next →</button>
        </div>
      </header>

      {/* Document Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${getVendorColor(vendorName)} flex items-center justify-center`}>
              <span className="text-white text-lg font-bold">{vendorName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {formData.docType === 'RECU' ? 'Receipt' : 'Invoice'}
                </span>
                <span className="text-sm text-slate-900 font-mono">
                  #{formData.invoiceNumber || 'N/A'}
                </span>
              </div>
              <h1 className="text-lg font-semibold text-slate-900">{vendorName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Last updated: {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A'}
            </span>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
            {onDelete && (
              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-[480px] bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">General</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Source</label>
                    <p className="text-sm text-slate-900">{document.source || 'Email'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Billed to</label>
                    <select
                      value={formData.billedTo}
                      onChange={(e) => handleFieldChange('billedTo', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select business entity...</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Type</label>
                    <select
                      value={formData.docType}
                      onChange={(e) => handleFieldChange('docType', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      {docTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Account</label>
                    <select
                      value={formData.account}
                      onChange={(e) => handleFieldChange('account', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      {accountOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Invoice #</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Receipt #</label>
                    <input
                      type="text"
                      value={formData.receiptNumber}
                      onChange={(e) => handleFieldChange('receiptNumber', e.target.value)}
                      placeholder="Invoice ID"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Transaction #</label>
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => handleFieldChange('transactionId', e.target.value)}
                      placeholder="Transaction ID"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">PO #</label>
                    <input
                      type="text"
                      value={formData.poNumber}
                      onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                      placeholder="Purchase Order ID"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Quote #</label>
                    <input
                      type="text"
                      value={formData.quoteId}
                      onChange={(e) => handleFieldChange('quoteId', e.target.value)}
                      placeholder="Quote ID"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {activeTab === 'lineItems' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Line Items</h3>
                  <Button variant="outline" size="sm" onClick={addLine}>
                    <Plus className="w-4 h-4 mr-1" /> Add Line
                  </Button>
                </div>

                {lineItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No line items</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={addLine}>
                      <Plus className="w-4 h-4 mr-1" /> Add Line Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Qty</label>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Unit Price</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Total</label>
                                <p className="px-3 py-2 text-sm font-medium text-slate-900">
                                  €{item.amount.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeLine(index)}
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exports' && (
              <div className="text-center py-12 text-slate-500">
                <Download className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No exports yet</p>
              </div>
            )}

            {activeTab === 'duplicates' && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No duplicates found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden">
          {/* PDF Toolbar */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600">
                <input 
                  type="number" 
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                  className="w-8 text-center border border-slate-200 rounded"
                />
                <span className="mx-1">sur {totalPages}</span>
              </span>
              <button className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <select 
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="text-sm border border-slate-200 rounded px-2 py-1"
              >
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
              </select>
              <button className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
              <div className="w-px h-5 bg-slate-200 mx-2" />
              <button className="p-1.5 hover:bg-slate-100 rounded">
                <RotateCw className="w-4 h-4 text-slate-600" />
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded">
                <Maximize2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            {isAnalyzing && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg z-10">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyse IA en cours...
              </div>
            )}
            
            {document.fileUrl ? (
              <div 
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                className="transition-transform duration-200"
              >
                {isPDF ? (
                  // Pour les PDF base64, utiliser embed ou object au lieu de iframe
                  document.fileUrl.startsWith('data:') ? (
                    <div className="bg-white rounded-lg shadow-xl p-12 text-center" style={{ width: '700px' }}>
                      <FileText className="w-24 h-24 mx-auto mb-4 text-primary-300" />
                      <p className="text-slate-600 mb-2 font-medium">{document.filename}</p>
                      <p className="text-slate-500 text-sm mb-6">
                        L'aperçu PDF n'est pas disponible pour les fichiers stockés en cloud.
                      </p>
                      <Button onClick={handleDownload} className="bg-primary-500 hover:bg-primary-600">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger le PDF
                      </Button>
                    </div>
                  ) : (
                    <iframe 
                      src={document.fileUrl} 
                      className="bg-white rounded-lg shadow-xl"
                      style={{ width: '700px', height: '900px' }}
                      title={document.filename}
                    />
                  )
                ) : isImage ? (
                  <img 
                    src={document.fileUrl} 
                    alt={document.filename}
                    className="max-w-full rounded-lg shadow-xl"
                    style={{ maxHeight: '800px' }}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-xl p-20 text-center">
                    <FileText className="w-24 h-24 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">Aperçu non disponible</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-xl p-20 text-center">
                <FileText className="w-24 h-24 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Aucun fichier</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
