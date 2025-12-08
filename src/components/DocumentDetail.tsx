/**
 * Composant d'affichage détaillé d'un document analysé
 * Design inspiré de Receiptor AI - Split view avec formulaire à gauche et aperçu à droite
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { 
  FileText, Calendar, Building2, Receipt, Hash, Globe, 
  CreditCard, CheckCircle2, AlertCircle, Eye, X, Download, 
  Maximize2, Minimize2, Sparkles, Loader2, Save, Trash2,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Package, Link2, BadgePercent, Plus, ExternalLink
} from 'lucide-react';

interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  vat?: number;
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
  };
  onAnalyzed?: () => void;
  onSave?: (data: any) => void;
  onDelete?: () => void;
}

type TabType = 'basique' | 'lignes' | 'exportations' | 'doublons';

export function DocumentDetail({ document, onAnalyzed, onSave, onDelete }: DocumentDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basique');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // États du formulaire éditables
  const [formData, setFormData] = useState({
    docType: document.docType || 'FACTURE_ACHAT',
    supplier: document.supplier || '',
    supplierWebsite: document.analysisData?.supplierWebsite || '',
    supplierVatNumber: document.analysisData?.supplierVatNumber || '',
    invoiceNumber: document.analysisData?.invoiceNumber || '',
    receiptNumber: document.analysisData?.receiptNumber || '',
    transactionId: document.analysisData?.transactionId || '',
    date: document.date ? new Date(document.date).toISOString().split('T')[0] : '',
    amount: document.amount || 0,
    vat: document.vat || 0,
    category: document.analysisData?.category || '',
    paymentMethod: document.analysisData?.paymentMethod || '',
    billedTo: document.analysisData?.billedTo || '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    document.analysisData?.lineItems || []
  );

  // États du viewer PDF
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isPDF = document.fileType === 'pdf' || document.filename?.toLowerCase().endsWith('.pdf');
  const isImage = document.fileType?.startsWith('image') || 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(document.filename || '');

  // Mettre à jour formData quand le document change
  useEffect(() => {
    setFormData({
      docType: document.docType || 'FACTURE_ACHAT',
      supplier: document.supplier || '',
      supplierWebsite: document.analysisData?.supplierWebsite || '',
      supplierVatNumber: document.analysisData?.supplierVatNumber || '',
      invoiceNumber: document.analysisData?.invoiceNumber || '',
      receiptNumber: document.analysisData?.receiptNumber || '',
      transactionId: document.analysisData?.transactionId || '',
      date: document.date ? new Date(document.date).toISOString().split('T')[0] : '',
      amount: document.amount || 0,
      vat: document.vat || 0,
      category: document.analysisData?.category || '',
      paymentMethod: document.analysisData?.paymentMethod || '',
      billedTo: document.analysisData?.billedTo || '',
    });
    setLineItems(document.analysisData?.lineItems || []);
  }, [document]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    
    try {
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }
      
      if (onAnalyzed) {
        onAnalyzed();
      } else {
        window.location.reload();
      }
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({ ...formData, lineItems });
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const docTypeLabels: Record<string, string> = {
    'FACTURE_ACHAT': 'Facture (achat)',
    'FACTURE_VENTE': 'Facture (vente)',
    'NOTE_FRAIS': 'Note de frais',
    'RECU': 'Reçu',
    'DEVIS': 'Devis',
    'AUTRE': 'Autre',
  };

  const categoryOptions = [
    'Services logiciels et abonnement',
    'Fournitures de bureau',
    'Marketing et publicité',
    'Télécommunications',
    'Transport et déplacements',
    'Restauration',
    'Hébergement',
    'Services professionnels',
    'Équipement informatique',
    'Autre',
  ];

  // Si non analysé, afficher le bouton d'analyse
  if (!document.analyzed || !document.analysisData) {
    return (
      <div className="h-full flex">
        {/* Panel gauche - Message */}
        <div className="w-1/2 border-r border-slate-200 p-8 flex flex-col items-center justify-center bg-slate-50">
          <AlertCircle className="w-16 h-16 text-amber-400 mb-6" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Document non analysé</h3>
          <p className="text-slate-500 text-center mb-6">
            Ce document n'a pas encore été analysé par l'IA
          </p>
          
          {analyzeError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm w-full max-w-md">
              {analyzeError}
            </div>
          )}
          
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="lg"
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyser avec l'IA
              </>
            )}
          </Button>
        </div>
        
        {/* Panel droit - Aperçu */}
        <div className="w-1/2 bg-slate-100 flex items-center justify-center">
          {document.fileUrl ? (
            <DocumentViewer 
              url={document.fileUrl}
              isPDF={isPDF}
              isImage={isImage}
              filename={document.filename}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          ) : (
            <div className="text-slate-400 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Aperçu non disponible</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const montantHT = (formData.amount || 0) - (formData.vat || 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header avec actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-slate-700">
              {formData.docType === 'RECU' ? 'Reçu' : 'Facture'} # {formData.invoiceNumber || formData.receiptNumber || 'N/A'}
            </span>
          </div>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">{formData.supplier || 'Fournisseur inconnu'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            Dernière mise à jour : {formatDateShort(new Date())}
          </span>
          <Button variant="outline" size="sm" onClick={() => window.open(document.fileUrl, '_blank')}>
            <Download className="w-4 h-4 mr-1" />
            Télécharger
          </Button>
          {onDelete && (
            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Content split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel gauche - Formulaire */}
        <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-white">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
            <TabButton 
              active={activeTab === 'basique'} 
              onClick={() => setActiveTab('basique')}
            >
              Basique
            </TabButton>
            <TabButton 
              active={activeTab === 'lignes'} 
              onClick={() => setActiveTab('lignes')}
              badge={lineItems.length}
            >
              Éléments de ligne
            </TabButton>
            <TabButton 
              active={activeTab === 'exportations'} 
              onClick={() => setActiveTab('exportations')}
              badge={0}
            >
              Exportations
            </TabButton>
            <TabButton 
              active={activeTab === 'doublons'} 
              onClick={() => setActiveTab('doublons')}
              badge={0}
            >
              Doublons
            </TabButton>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'basique' && (
              <div className="space-y-6">
                {/* Section Général */}
                <Section title="Général">
                  <FormField label="Source">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Globe className="w-4 h-4" />
                      <span>{document.source || 'Import manuel'}</span>
                    </div>
                  </FormField>
                  
                  <FormField label="Facturé à">
                    <select
                      value={formData.billedTo}
                      onChange={(e) => handleFieldChange('billedTo', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Sélectionnez l'entité commerciale...</option>
                      <option value="personnel">Personnel</option>
                      <option value="entreprise">Entreprise</option>
                    </select>
                  </FormField>
                </Section>

                {/* Type et Compte */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Type">
                    <select
                      value={formData.docType}
                      onChange={(e) => handleFieldChange('docType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {Object.entries(docTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </FormField>
                  
                  <FormField label="Compte">
                    <select
                      value={formData.category}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Sélectionnez...</option>
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {/* Numéros */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Facture #">
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </FormField>
                  
                  <FormField label="Reçu #">
                    <input
                      type="text"
                      value={formData.receiptNumber}
                      onChange={(e) => handleFieldChange('receiptNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </FormField>
                  
                  <FormField label="Transaction n°">
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => handleFieldChange('transactionId', e.target.value)}
                      placeholder="ID de transaction"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </FormField>
                </div>

                {/* Date */}
                <FormField label="Date de la transaction">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </FormField>

                {/* Fournisseur */}
                <Section title="Fournisseur">
                  <FormField label="Nom">
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => handleFieldChange('supplier', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </FormField>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Site web">
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.supplierWebsite}
                          onChange={(e) => handleFieldChange('supplierWebsite', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {formData.supplierWebsite && (
                          <a 
                            href={formData.supplierWebsite} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </FormField>
                    
                    <FormField label="Numéro d'identification fiscale">
                      <input
                        type="text"
                        value={formData.supplierVatNumber}
                        onChange={(e) => handleFieldChange('supplierVatNumber', e.target.value)}
                        placeholder="Numéro d'identification..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </FormField>
                  </div>
                </Section>

                {/* Montants */}
                <Section title="Montants">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField label="Montant HT">
                      <div className="relative">
                        <input
                          type="number"
                          value={montantHT.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                      </div>
                    </FormField>
                    
                    <FormField label="TVA">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.vat}
                          onChange={(e) => handleFieldChange('vat', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                      </div>
                    </FormField>
                    
                    <FormField label="Montant TTC">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                      </div>
                    </FormField>
                  </div>
                </Section>

                {/* Paiement */}
                <FormField label="Méthode de paiement">
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="card">Carte bancaire</option>
                    <option value="transfer">Virement</option>
                    <option value="cash">Espèces</option>
                    <option value="check">Chèque</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Autre</option>
                  </select>
                </FormField>
              </div>
            )}

            {activeTab === 'lignes' && (
              <div className="space-y-4">
                {lineItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun élément de ligne détecté</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setLineItems([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }])}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une ligne
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {lineItems.map((item, index) => (
                        <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm font-medium text-slate-500">Ligne {index + 1}</span>
                            <button 
                              onClick={() => setLineItems(items => items.filter((_, i) => i !== index))}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-2">
                              <label className="text-xs text-slate-500">Description</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...lineItems];
                                  updated[index].description = e.target.value;
                                  setLineItems(updated);
                                  setHasChanges(true);
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Qté</label>
                              <input
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const updated = [...lineItems];
                                  updated[index].quantity = parseFloat(e.target.value) || 0;
                                  setLineItems(updated);
                                  setHasChanges(true);
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Montant</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                onChange={(e) => {
                                  const updated = [...lineItems];
                                  updated[index].amount = parseFloat(e.target.value) || 0;
                                  setLineItems(updated);
                                  setHasChanges(true);
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, amount: 0 }])}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une ligne
                    </Button>
                  </>
                )}
              </div>
            )}

            {activeTab === 'exportations' && (
              <div className="text-center py-12 text-slate-500">
                <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune exportation pour ce document</p>
                <p className="text-sm mt-2">Les exportations comptables apparaîtront ici</p>
              </div>
            )}

            {activeTab === 'doublons' && (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                <p>Aucun doublon détecté</p>
                <p className="text-sm mt-2">Ce document est unique dans votre base</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel droit - Aperçu document */}
        <div className="w-1/2 bg-slate-800 flex flex-col">
          {/* Toolbar aperçu */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-700 text-white">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 hover:bg-slate-600 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm">{currentPage} sur {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 hover:bg-slate-600 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="p-1.5 hover:bg-slate-600 rounded"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <select 
                value={zoom} 
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="bg-slate-600 text-white text-sm px-2 py-1 rounded"
              >
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
              </select>
              <button 
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="p-1.5 hover:bg-slate-600 rounded"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-500 mx-1" />
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-slate-600 rounded"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Montant flottant */}
          <div className="absolute top-20 right-8 bg-white rounded-xl shadow-2xl p-6 z-10 min-w-[200px]">
            <div className="text-3xl font-bold text-slate-900">
              ${formData.amount.toFixed(2)}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Payé {formData.date ? formatDateShort(formData.date) : 'N/A'}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <button className="text-slate-600 hover:text-emerald-600 flex items-center gap-1">
                <Download className="w-4 h-4" />
                Télécharger la facture
              </button>
            </div>
          </div>

          {/* Aperçu */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {document.fileUrl ? (
              <div 
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                className="transition-transform"
              >
                {isPDF ? (
                  <iframe 
                    src={document.fileUrl} 
                    className="bg-white rounded shadow-lg"
                    style={{ width: '600px', height: '800px' }}
                    title={document.filename}
                  />
                ) : isImage ? (
                  <img 
                    src={document.fileUrl} 
                    alt={document.filename}
                    className="max-w-full rounded shadow-lg bg-white"
                  />
                ) : (
                  <div className="text-white text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Aperçu non disponible</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-white text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun fichier disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composants utilitaires
function TabButton({ 
  children, 
  active, 
  onClick, 
  badge 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
        active 
          ? 'border-emerald-500 text-emerald-600' 
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function DocumentViewer({ 
  url, 
  isPDF, 
  isImage, 
  filename,
  zoom,
  onZoomChange 
}: { 
  url: string; 
  isPDF: boolean; 
  isImage: boolean; 
  filename: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div style={{ transform: `scale(${zoom / 100})` }} className="transition-transform">
          {isPDF ? (
            <iframe 
              src={url} 
              className="bg-white rounded shadow-lg"
              style={{ width: '500px', height: '700px' }}
              title={filename}
            />
          ) : isImage ? (
            <img 
              src={url} 
              alt={filename}
              className="max-w-full rounded shadow-lg"
            />
          ) : (
            <div className="text-slate-400 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" />
              <p>Aperçu non disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
