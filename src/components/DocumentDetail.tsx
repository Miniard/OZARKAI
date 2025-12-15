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
  
  // Cast analysisData pour accès aux propriétés
  const analysis = document.analysisData as Record<string, any> | null;
  
  // Données du formulaire - TOUTES les infos de l'analyse
  const [formData, setFormData] = useState({
    // Type de document
    docType: document.docType || analysis?.type || 'FACTURE_ACHAT',
    
    // Infos fournisseur
    supplier: document.supplier || analysis?.fournisseur || '',
    supplierAddress: analysis?.fournisseurAdresse || analysis?.supplierAddress || '',
    supplierEmail: analysis?.fournisseurEmail || analysis?.supplierEmail || '',
    supplierPhone: analysis?.fournisseurTelephone || analysis?.supplierPhone || '',
    supplierVatNumber: analysis?.fournisseurTVA || analysis?.supplierVatNumber || '',
    supplierWebsite: analysis?.fournisseurSiteWeb || analysis?.supplierWebsite || '',
    
    // Numéros de référence
    invoiceNumber: analysis?.numero || analysis?.invoiceNumber || '',
    receiptNumber: analysis?.receiptNumber || '',
    transactionId: analysis?.transactionId || '',
    poNumber: analysis?.poNumber || '',
    quoteId: analysis?.quoteId || '',
    
    // Dates
    date: document.date ? new Date(document.date).toISOString().split('T')[0] : (analysis?.date || ''),
    dueDate: analysis?.dueDate || '',
    
    // Client
    billedTo: analysis?.client || '',
    billedToEmail: analysis?.clientEmail || '',
    
    // Comptabilité
    account: analysis?.category || '',
    currency: analysis?.devise || analysis?.currency || 'EUR',
    
    // Paiement
    paymentMethod: analysis?.paymentMethod || '',
    paymentStatus: analysis?.paymentStatus || '',
    
    // Montants
    montantHT: analysis?.montantHT || null,
    tva: document.vat || analysis?.tva || null,
    tauxTVA: analysis?.tauxTVA || null,
    montantTTC: document.amount || analysis?.montantTTC || null,
    
    // Notes
    description: analysis?.description || '',
    notes: analysis?.notes || '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    document.analysisData?.lineItems || []
  );

  const isPDF = document.fileType === 'pdf' || document.fileType === 'application/pdf' || document.filename?.toLowerCase().endsWith('.pdf');
  const isImage = document.fileType?.startsWith('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.filename || '');
  const isHTML = document.fileType === 'text/html' || document.filename?.toLowerCase().endsWith('.html');

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
        const a = data.analysis;
        setFormData(prev => ({
          ...prev,
          // Type
          docType: a.type || prev.docType,
          account: a.category || prev.account,
          
          // Fournisseur
          supplier: a.fournisseur || prev.supplier,
          supplierAddress: a.fournisseurAdresse || prev.supplierAddress,
          supplierEmail: a.fournisseurEmail || prev.supplierEmail,
          supplierPhone: a.fournisseurTelephone || prev.supplierPhone,
          supplierVatNumber: a.fournisseurTVA || prev.supplierVatNumber,
          supplierWebsite: a.fournisseurSiteWeb || prev.supplierWebsite,
          
          // Références
          invoiceNumber: a.numero || prev.invoiceNumber,
          
          // Dates
          date: a.date || prev.date,
          dueDate: a.dueDate || prev.dueDate,
          
          // Client
          billedTo: a.client || prev.billedTo,
          billedToEmail: a.clientEmail || prev.billedToEmail,
          
          // Montants
          montantHT: a.montantHT || prev.montantHT,
          tva: a.tva || prev.tva,
          tauxTVA: a.tauxTVA || prev.tauxTVA,
          montantTTC: a.montantTTC || prev.montantTTC,
          currency: a.devise || prev.currency,
          
          // Paiement
          paymentMethod: a.paymentMethod || prev.paymentMethod,
          paymentStatus: a.paymentStatus || prev.paymentStatus,
          
          // Notes
          description: a.description || prev.description,
          notes: a.notes || prev.notes,
        }));
        
        if (a.lineItems?.length) {
          setLineItems(a.lineItems);
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
    { value: 'FACTURE_ACHAT', label: 'Facture (achat)' },
    { value: 'FACTURE_VENTE', label: 'Facture (vente)' },
    { value: 'RECU', label: 'Reçu' },
    { value: 'ABONNEMENT', label: 'Abonnement' },
    { value: 'AVOIR', label: 'Avoir / Remboursement' },
    { value: 'NOTE_FRAIS', label: 'Note de frais' },
    { value: 'DEVIS', label: 'Devis' },
    { value: 'AUTRE', label: 'Autre' },
  ];

  const accountOptions = [
    { value: '', label: 'Sélectionner une catégorie...' },
    { value: 'LOGICIEL', label: 'Logiciel / SaaS' },
    { value: 'ABONNEMENT', label: 'Abonnement' },
    { value: 'JEUX_VIDEO', label: 'Jeux vidéo' },
    { value: 'STREAMING', label: 'Streaming' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'COURSES', label: 'Courses' },
    { value: 'FOURNITURES', label: 'Fournitures bureau' },
    { value: 'TELECOM', label: 'Télécom / Internet' },
    { value: 'HEBERGEMENT', label: 'Hébergement' },
    { value: 'SERVICES', label: 'Services' },
    { value: 'AUTRES', label: 'Autres' },
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
                {/* SECTION: Type & Catégorie */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Type de document</h3>
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
                      <label className="block text-sm text-slate-600 mb-1">Catégorie</label>
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
                </div>

                {/* SECTION: Fournisseur */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Fournisseur / Vendeur</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Nom</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => handleFieldChange('supplier', e.target.value)}
                        placeholder="Nom du fournisseur"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Adresse</label>
                      <input
                        type="text"
                        value={formData.supplierAddress}
                        onChange={(e) => handleFieldChange('supplierAddress', e.target.value)}
                        placeholder="Adresse complète"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.supplierEmail}
                          onChange={(e) => handleFieldChange('supplierEmail', e.target.value)}
                          placeholder="email@example.com"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Téléphone</label>
                        <input
                          type="text"
                          value={formData.supplierPhone}
                          onChange={(e) => handleFieldChange('supplierPhone', e.target.value)}
                          placeholder="+33..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">N° TVA / SIRET</label>
                        <input
                          type="text"
                          value={formData.supplierVatNumber}
                          onChange={(e) => handleFieldChange('supplierVatNumber', e.target.value)}
                          placeholder="FR12345678901"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Site web</label>
                        <input
                          type="text"
                          value={formData.supplierWebsite}
                          onChange={(e) => handleFieldChange('supplierWebsite', e.target.value)}
                          placeholder="https://..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION: Références */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Références</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">N° Facture</label>
                      <input
                        type="text"
                        value={formData.invoiceNumber}
                        onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">N° Reçu</label>
                      <input
                        type="text"
                        value={formData.receiptNumber}
                        onChange={(e) => handleFieldChange('receiptNumber', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Transaction</label>
                      <input
                        type="text"
                        value={formData.transactionId}
                        onChange={(e) => handleFieldChange('transactionId', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">N° Commande</label>
                      <input
                        type="text"
                        value={formData.poNumber}
                        onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION: Dates */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Dates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Date facture</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Date échéance</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION: Client */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Client / Destinataire</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Nom</label>
                      <input
                        type="text"
                        value={formData.billedTo}
                        onChange={(e) => handleFieldChange('billedTo', e.target.value)}
                        placeholder="Nom du client"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.billedToEmail}
                        onChange={(e) => handleFieldChange('billedToEmail', e.target.value)}
                        placeholder="client@email.com"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION: Montants */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Montants</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Montant HT</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.montantHT || ''}
                        onChange={(e) => handleFieldChange('montantHT', parseFloat(e.target.value) || null)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">TVA ({formData.tauxTVA || 20}%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.tva || ''}
                        onChange={(e) => handleFieldChange('tva', parseFloat(e.target.value) || null)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Montant TTC</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.montantTTC || ''}
                        onChange={(e) => handleFieldChange('montantTTC', parseFloat(e.target.value) || null)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Devise</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleFieldChange('currency', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION: Paiement */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Paiement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Mode de paiement</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Non spécifié</option>
                        <option value="CB">Carte bancaire</option>
                        <option value="VIREMENT">Virement</option>
                        <option value="PRELEVEMENT">Prélèvement</option>
                        <option value="ESPECES">Espèces</option>
                        <option value="CHEQUE">Chèque</option>
                        <option value="PAYPAL">PayPal</option>
                        <option value="APPLE_PAY">Apple Pay</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Statut</label>
                      <select
                        value={formData.paymentStatus}
                        onChange={(e) => handleFieldChange('paymentStatus', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Non spécifié</option>
                        <option value="PAYE">Payé</option>
                        <option value="EN_ATTENTE">En attente</option>
                        <option value="ECHOUE">Échoué</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION: Notes */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Notes</h3>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-slate-600 mb-1">Notes additionnelles</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
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
                  // Pour les PDF, utiliser embed qui supporte les data URLs
                  <embed 
                    src={document.fileUrl} 
                    type="application/pdf"
                    className="bg-white rounded-lg shadow-xl"
                    style={{ width: '700px', height: '900px' }}
                    title={document.filename}
                  />
                ) : isImage ? (
                  <img 
                    src={document.fileUrl} 
                    alt={document.filename}
                    className="max-w-full rounded-lg shadow-xl"
                    style={{ maxHeight: '800px' }}
                  />
                ) : isHTML ? (
                  // Pour les factures HTML, utiliser un iframe
                  <iframe 
                    src={document.fileUrl} 
                    className="bg-white rounded-lg shadow-xl border-0"
                    style={{ width: '700px', height: '900px' }}
                    title={document.filename}
                    sandbox="allow-same-origin"
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
