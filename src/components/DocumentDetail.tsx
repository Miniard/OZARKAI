/**
 * DocumentDetail - Vue plein écran d'une facture
 * PDF en grand + lignes en dessous
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  FileText, Calendar, Building2, Receipt, X, Download, 
  Maximize2, Minimize2, Loader2, Save, Trash2,
  ZoomIn, ZoomOut, Package, Plus, ShoppingCart,
  CreditCard, ArrowLeft, Edit3, Check, Sparkles, RefreshCw
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

export function DocumentDetail({ document, onClose, onSave, onDelete, onAnalyzed }: DocumentDetailProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isEditing, setIsEditing] = useState(false);
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    docType: document.docType || 'FACTURE_ACHAT',
    supplier: document.supplier || '',
    supplierVatNumber: document.analysisData?.supplierVatNumber || '',
    invoiceNumber: document.analysisData?.invoiceNumber || '',
    date: document.date ? new Date(document.date).toISOString().split('T')[0] : '',
    amount: document.amount || 0,
    vat: document.vat || 0,
    currency: document.analysisData?.currency || 'EUR',
    paymentMethod: document.analysisData?.paymentMethod || '',
    category: document.analysisData?.category || '',
  });

  // Lignes du document
  const [lineItems, setLineItems] = useState<LineItem[]>(
    document.analysisData?.lineItems || []
  );

  const isPDF = document.fileType === 'pdf' || document.filename?.toLowerCase().endsWith('.pdf');
  const isImage = document.fileType?.startsWith('image') || 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(document.filename || '');

  // Sync quand le document change
  useEffect(() => {
    setFormData({
      docType: document.docType || 'FACTURE_ACHAT',
      supplier: document.supplier || '',
      supplierVatNumber: document.analysisData?.supplierVatNumber || '',
      invoiceNumber: document.analysisData?.invoiceNumber || '',
      date: document.date ? new Date(document.date).toISOString().split('T')[0] : '',
      amount: document.amount || 0,
      vat: document.vat || 0,
      currency: document.analysisData?.currency || 'EUR',
      paymentMethod: document.analysisData?.paymentMethod || '',
      category: document.analysisData?.category || '',
    });
    setLineItems(document.analysisData?.lineItems || []);
    setHasChanges(false);
  }, [document.id]);

  // 🔥 ANALYSE AUTOMATIQUE si document pas encore analysé
  useEffect(() => {
    const autoAnalyze = async () => {
      // Ne pas analyser si déjà analysé ou si analyse en cours
      if (document.analyzed || isAnalyzing) return;
      
      // Ne pas analyser si on a déjà des données
      if (document.analysisData?.lineItems?.length > 0) return;
      
      console.log('🤖 [AUTO] Lancement analyse automatique pour:', document.id);
      setIsAnalyzing(true);
      setAnalyzeError(null);
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de l\'analyse');
        }

        console.log('✅ [AUTO] Analyse automatique réussie!');
        console.log('📊 [AUTO] Lignes extraites:', data.analysis?.lineItems?.length || 0);
        
        // Mettre à jour les données locales avec le résultat
        if (data.analysis) {
          setFormData({
            docType: data.analysis.type || 'FACTURE_ACHAT',
            supplier: data.analysis.fournisseur || '',
            supplierVatNumber: data.analysis.fournisseurTVA || '',
            invoiceNumber: data.analysis.numero || '',
            date: data.analysis.date || '',
            amount: data.analysis.montantTTC || 0,
            vat: data.analysis.tva || 0,
            currency: data.analysis.devise || 'EUR',
            paymentMethod: data.analysis.paymentMethod || '',
            category: data.analysis.category || '',
          });
          
          if (data.analysis.lineItems && data.analysis.lineItems.length > 0) {
            setLineItems(data.analysis.lineItems);
          }
        }
        
        // Rafraîchir la liste
        if (onAnalyzed) onAnalyzed();
        
      } catch (error) {
        console.error('❌ [AUTO] Erreur analyse:', error);
        setAnalyzeError(error instanceof Error ? error.message : 'Erreur inconnue');
      } finally {
        setIsAnalyzing(false);
      }
    };

    autoAnalyze();
  }, [document.id, document.analyzed]);

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
    setIsEditing(true);
  };

  const removeLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const totalHT = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalVAT = lineItems.reduce((sum, item) => {
        const vatRate = item.vatRate || 20;
        return sum + (item.amount * vatRate / 100);
      }, 0);

      const dataToSave = {
        ...formData,
        amount: totalHT + totalVAT || formData.amount,
        vat: totalVAT || formData.vat,
        lineItems,
      };

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
      setIsEditing(false);
      if (onAnalyzed) onAnalyzed();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const currencySymbol = formData.currency === 'EUR' ? '€' : formData.currency === 'USD' ? '$' : formData.currency;
  const totalHT = lineItems.length > 0 
    ? lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    : (formData.amount || 0) - (formData.vat || 0);
  const totalTTC = lineItems.length > 0 
    ? totalHT + lineItems.reduce((sum, item) => sum + (item.amount * (item.vatRate || 20) / 100), 0)
    : formData.amount || 0;

  const docTypeLabels: Record<string, string> = {
    'FACTURE_ACHAT': 'Facture d\'achat',
    'FACTURE_VENTE': 'Facture de vente',
    'NOTE_FRAIS': 'Note de frais',
    'RECU': 'Reçu',
    'DEVIS': 'Devis',
    'AUTRE': 'Autre',
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-[100] overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {formData.invoiceNumber ? `Facture #${formData.invoiceNumber}` : document.filename}
            </h1>
            <p className="text-sm text-slate-500">
              {formData.supplier || 'Fournisseur non défini'} • {formData.date ? new Date(formData.date).toLocaleDateString('fr-FR') : 'Date non définie'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {analyzeError && (
            <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
              ⚠️ {analyzeError}
            </span>
          )}
          {isAnalyzing && (
            <span className="text-sm text-violet-600 bg-violet-50 px-3 py-1 rounded-full flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyse IA en cours...
            </span>
          )}
          {hasChanges && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Non sauvegardé
            </span>
          )}
          
          <Button variant="outline" onClick={() => window.open(document.fileUrl, '_blank')}>
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          
          {/* === PDF VIEWER - GRAND === */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar PDF */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-sm text-slate-600 font-medium">{document.filename}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-sm text-slate-600 min-w-[50px] text-center">{zoom}%</span>
                <button 
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* PDF/Image */}
            <div className="bg-slate-800 flex items-center justify-center p-8 min-h-[600px]">
              {document.fileUrl ? (
                <div 
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                  className="transition-transform duration-200"
                >
                  {isPDF ? (
                    <iframe 
                      src={document.fileUrl} 
                      className="bg-white rounded-lg shadow-2xl"
                      style={{ width: '800px', height: '1000px' }}
                      title={document.filename}
                    />
                  ) : isImage ? (
                    <img 
                      src={document.fileUrl} 
                      alt={document.filename}
                      className="max-w-full max-h-[800px] rounded-lg shadow-2xl"
                    />
                  ) : (
                    <div className="text-center text-white py-20">
                      <FileText className="w-24 h-24 mx-auto mb-4 opacity-30" />
                      <p className="text-xl">Aperçu non disponible</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-white py-20">
                  <FileText className="w-24 h-24 mx-auto mb-4 opacity-30" />
                  <p className="text-xl">Aucun fichier</p>
                </div>
              )}
            </div>
          </div>

          {/* === ANALYSE EN COURS === */}
          {isAnalyzing && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-violet-900 mb-1">
                    🔍 Extraction automatique en cours...
                  </h3>
                  <p className="text-violet-700 text-sm">
                    Notre IA extrait les informations de votre document : fournisseur, montants, lignes de produits...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* === INFOS PRINCIPALES === */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Montant */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <p className="text-emerald-100 text-sm font-medium mb-1">Montant Total TTC</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{totalTTC.toFixed(2)}</span>
                <span className="text-3xl text-emerald-200">{currencySymbol}</span>
              </div>
              <div className="flex gap-4 mt-4 text-sm text-emerald-100">
                <span>HT: {totalHT.toFixed(2)} {currencySymbol}</span>
                <span>•</span>
                <span>TVA: {(totalTTC - totalHT).toFixed(2)} {currencySymbol}</span>
              </div>
            </div>

            {/* Fournisseur */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-700">Fournisseur</h3>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleFieldChange('supplier', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg font-medium"
                  placeholder="Nom du fournisseur"
                />
              ) : (
                <p className="text-xl font-semibold text-slate-900">{formData.supplier || '-'}</p>
              )}
              <p className="text-sm text-slate-500 mt-2">
                {formData.supplierVatNumber || 'N° TVA non renseigné'}
              </p>
            </div>

            {/* Infos */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-700">Informations</h3>
                </div>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isEditing ? <Check className="w-4 h-4 text-emerald-600" /> : <Edit3 className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  {isEditing ? (
                    <select
                      value={formData.docType}
                      onChange={(e) => handleFieldChange('docType', e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-sm"
                    >
                      {Object.entries(docTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-medium text-slate-900">{docTypeLabels[formData.docType]}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-sm"
                    />
                  ) : (
                    <span className="font-medium text-slate-900">
                      {formData.date ? new Date(formData.date).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">N° Facture</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-sm w-32 text-right"
                    />
                  ) : (
                    <span className="font-medium text-slate-900">{formData.invoiceNumber || '-'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* === LIGNES DU DOCUMENT === */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-800">Lignes du document</h3>
                <span className="bg-slate-100 text-slate-600 text-sm px-2 py-0.5 rounded-full">
                  {lineItems.length} ligne{lineItems.length > 1 ? 's' : ''}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une ligne
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h4 className="text-lg font-medium text-slate-700 mb-2">Aucune ligne ajoutée</h4>
                <p className="text-slate-500 mb-6">Ajoutez les produits/services de cette facture</p>
                <Button onClick={addLine}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>
            ) : (
              <>
                {/* Header table */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-1 text-center">Qté</div>
                  <div className="col-span-2 text-right">Prix unit. HT</div>
                  <div className="col-span-1 text-center">TVA</div>
                  <div className="col-span-2 text-right">Total HT</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                      <div className="col-span-1">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm flex items-center justify-center">
                          {index + 1}
                        </span>
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded-lg bg-transparent focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded-lg text-center bg-transparent focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded-lg text-right bg-transparent focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          value={item.vatRate || 20}
                          onChange={(e) => handleLineChange(index, 'vatRate', parseFloat(e.target.value))}
                          className="w-full px-1 py-2 border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded-lg text-center bg-transparent focus:bg-white transition-colors text-sm"
                        >
                          <option value={0}>0%</option>
                          <option value={5.5}>5.5%</option>
                          <option value={10}>10%</option>
                          <option value={20}>20%</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="font-semibold text-slate-900">
                          {item.amount.toFixed(2)} {currencySymbol}
                        </span>
                        <button
                          onClick={() => removeLine(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="max-w-xs ml-auto space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sous-total HT</span>
                      <span className="font-medium text-slate-700">{totalHT.toFixed(2)} {currencySymbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">TVA</span>
                      <span className="font-medium text-slate-700">{(totalTTC - totalHT).toFixed(2)} {currencySymbol}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                      <span className="text-slate-900">Total TTC</span>
                      <span className="text-emerald-600">{totalTTC.toFixed(2)} {currencySymbol}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
