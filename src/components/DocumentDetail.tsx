/**
 * Composant d'affichage détaillé d'un document analysé
 * Avec prévisualisation PDF/Image
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { FileText, Calendar, Building2, CreditCard, CheckCircle2, AlertCircle, TrendingDown, TrendingUp, Eye, X, Download, Maximize2 } from 'lucide-react';

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
  };
}

export function DocumentDetail({ document }: DocumentDetailProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  const isPDF = document.fileType === 'pdf' || document.filename?.toLowerCase().endsWith('.pdf');
  const isImage = document.fileType?.startsWith('image') || 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(document.filename || '');

  if (!document.analyzed || !document.analysisData) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-600">Ce document n'a pas encore été analysé</p>
          {document.fileUrl && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir le document
            </Button>
          )}
        </CardContent>
        
        {/* Modal Preview */}
        {showPreview && document.fileUrl && (
          <DocumentPreviewModal 
            url={document.fileUrl} 
            filename={document.filename}
            isPDF={isPDF}
            isImage={isImage}
            onClose={() => setShowPreview(false)} 
          />
        )}
      </Card>
    );
  }

  const analysis = document.analysisData;
  const isExpense = document.docType === 'FACTURE_ACHAT' || document.docType === 'NOTE_FRAIS';
  const isIncome = document.docType === 'FACTURE_VENTE';

  // Calculer le HT à partir du TTC et TVA
  const montantTTC = document.amount || 0;
  const montantTVA = document.vat || 0;
  const montantHT = montantTTC - montantTVA;

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <Card className={`border-l-4 ${isExpense ? 'border-l-danger-500' : isIncome ? 'border-l-success-500' : 'border-l-primary-500'}`}>
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                isExpense ? 'bg-danger-50' : isIncome ? 'bg-success-50' : 'bg-primary-50'
              }`}>
                <FileText className={`w-8 h-8 ${
                  isExpense ? 'text-danger-500' : isIncome ? 'text-success-500' : 'text-primary-500'
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{document.filename}</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    isExpense 
                      ? 'bg-danger-50 text-danger-700' 
                      : isIncome
                      ? 'bg-success-50 text-success-700'
                      : 'bg-primary-50 text-primary-700'
                  }`}>
                    {isExpense ? '💸 Dépense' : isIncome ? '💰 Revenu' : '📄 Document'}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-success-50 text-success-700">
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    Analysé
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION PRINCIPALE : MONTANT À PAYER */}
      <Card className={`${isExpense ? 'bg-danger-50 border-danger-200' : isIncome ? 'bg-success-50 border-success-200' : 'bg-primary-50 border-primary-200'}`}>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">
              {isExpense ? '💳 Montant à payer' : isIncome ? '💰 Montant à recevoir' : 'Montant total'}
            </p>
            <div className={`text-5xl font-bold mb-4 ${isExpense ? 'text-danger-600' : isIncome ? 'text-success-600' : 'text-primary-600'}`}>
              {formatCurrency(montantTTC)}
            </div>
            <p className="text-slate-600">
              {isExpense ? 'Vous devez payer cette somme' : isIncome ? 'Vous allez recevoir cette somme' : 'Montant TTC'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Détails du montant */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-slate-500 uppercase tracking-wide">Hors Taxes (HT)</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(montantHT)}</p>
            <p className="text-xs text-slate-400 mt-1">Montant sans la TVA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm text-slate-500 uppercase tracking-wide">TVA</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(montantTVA)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Taxe sur la Valeur Ajoutée ({analysis.vatRate || 20}%)
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isExpense ? 'border-danger-200' : 'border-success-200'}`}>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isExpense ? 'bg-danger-50' : 'bg-success-50'
              }`}>
                <CreditCard className={`w-5 h-5 ${isExpense ? 'text-danger-500' : 'text-success-500'}`} />
              </div>
              <p className="text-sm text-slate-500 uppercase tracking-wide">TOTAL TTC</p>
            </div>
            <p className={`text-2xl font-bold ${isExpense ? 'text-danger-600' : 'text-success-600'}`}>
              {formatCurrency(montantTTC)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Toutes Taxes Comprises - {isExpense ? 'À PAYER' : 'À RECEVOIR'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informations supplémentaires */}
      <div className="grid md:grid-cols-2 gap-4">
        {document.supplier && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-5 h-5 text-primary-500" />
                <p className="text-sm text-slate-500 uppercase tracking-wide">
                  {isExpense ? 'Fournisseur' : 'Client'}
                </p>
              </div>
              <p className="text-xl font-semibold text-slate-900">{document.supplier}</p>
            </CardContent>
          </Card>
        )}

        {document.date && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-primary-500" />
                <p className="text-sm text-slate-500 uppercase tracking-wide">Date</p>
              </div>
              <p className="text-xl font-semibold text-slate-900">
                {formatDateShort(document.date)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Catégorie comptable */}
      {analysis.category && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide">Catégorie comptable</p>
                <p className="text-lg font-semibold text-slate-900">{analysis.category}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              💡 Cette catégorie est utilisée pour classer votre dépense dans votre comptabilité
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">💡 Conseils</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-slate-600">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Bouton voir le document */}
      {document.fileUrl && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-600">Document original</span>
              </div>
              <Button onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Voir la facture
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Preview */}
      {showPreview && document.fileUrl && (
        <DocumentPreviewModal 
          url={document.fileUrl} 
          filename={document.filename}
          isPDF={isPDF}
          isImage={isImage}
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
}

// Composant Modal pour la prévisualisation
function DocumentPreviewModal({ 
  url, 
  filename, 
  isPDF, 
  isImage, 
  onClose 
}: { 
  url: string; 
  filename: string; 
  isPDF: boolean; 
  isImage: boolean; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-slate-900">{filename}</span>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <Maximize2 className="w-5 h-5" />
            </a>
            <a 
              href={url} 
              download={filename}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {isPDF ? (
            <iframe 
              src={url} 
              className="w-full h-full min-h-[600px] rounded-lg border border-slate-200 bg-white"
              title={filename}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img 
                src={url} 
                alt={filename} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FileText className="w-16 h-16 mb-4 text-slate-300" />
              <p>Prévisualisation non disponible</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 text-primary-600 hover:underline"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

