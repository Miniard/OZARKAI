/**
 * Composant d'upload moderne avec multi-fichiers et preview
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '@/lib/utils';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Mail
} from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error';
  error?: string;
  result?: {
    type: string;
    amount: number;
    category: string;
    supplier?: string;
  };
}

interface UploadDocumentModernProps {
  companyId: string;
  onUploadComplete?: () => void;
}

export function UploadDocumentModern({ companyId, onUploadComplete }: UploadDocumentModernProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => {
      const id = Math.random().toString(36).substring(7);
      const preview = file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : undefined;
      
      return {
        file,
        id,
        preview,
        status: 'pending' as const,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/html': ['.html'],
    },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadAndAnalyze = async (uploadedFile: UploadedFile) => {
    try {
      // Update status: uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'uploading' as const } : f))
      );

      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      formData.append('companyId', companyId);

      const uploadRes = await fetch('/api/upload-local', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(`Erreur d'upload: ${uploadRes.statusText}`);
      }

      const uploadData = await uploadRes.json();

      // Update status: analyzing
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'analyzing' as const } : f))
      );

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: uploadData.documentId }),
      });

      if (!analyzeRes.ok) {
        throw new Error(`Erreur d'analyse: ${analyzeRes.statusText}`);
      }

      const analyzeData = await analyzeRes.json();

      // Update status: success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'success' as const,
                result: {
                  type: analyzeData.document.docType || 'AUTRE',
                  amount: analyzeData.document.amount || 0,
                  category: analyzeData.document.analysisData?.category || 'Non catégorisé',
                  supplier: analyzeData.document.supplier,
                },
              }
            : f
        )
      );
    } catch (error) {
      console.error('Error uploading/analyzing:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);

    // Upload tous les fichiers en parallèle (max 3 à la fois pour pas surcharger)
    const batchSize = 3;
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);
      await Promise.all(batch.map(uploadAndAnalyze));
    }

    setIsProcessing(false);
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card padding="none" className="overflow-hidden">
        <div
          {...getRootProps()}
          className={`relative p-12 cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'bg-primary-50 border-2 border-dashed border-primary-400' 
              : 'bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50/30'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="text-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all ${
              isDragActive 
                ? 'bg-primary-500 scale-110' 
                : 'bg-primary-100'
            }`}>
              <Upload className={`w-10 h-10 ${isDragActive ? 'text-white' : 'text-primary-500'}`} />
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos factures'}
            </h3>
            <p className="text-slate-500 mb-4">
              ou cliquez pour sélectionner plusieurs fichiers
            </p>
            
            <div className="flex gap-3 justify-center text-sm text-slate-400">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                <FileText className="w-4 h-4" /> PDF
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                <Image className="w-4 h-4" /> Images
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                <Mail className="w-4 h-4" /> HTML
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Notice */}
      <Card padding="md" className="bg-primary-50 border-primary-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h4 className="font-medium text-primary-900 mb-0.5">Analyse IA automatique</h4>
            <p className="text-sm text-primary-700">
              Notre IA va extraire automatiquement les informations : montant, date, fournisseur, TVA...
            </p>
          </div>
        </div>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-slate-900">
                Fichiers ({files.length})
              </h3>
              {successCount > 0 && (
                <span className="badge-success">✓ {successCount} analysé(s)</span>
              )}
              {errorCount > 0 && (
                <span className="badge-danger">✗ {errorCount} erreur(s)</span>
              )}
            </div>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <Button
                  onClick={handleUploadAll}
                  isLoading={isProcessing}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Analyser ({pendingCount})
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setFiles([])}
                disabled={isProcessing}
              >
                Tout effacer
              </Button>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {files.map((uploadedFile) => (
              <FileItem
                key={uploadedFile.id}
                uploadedFile={uploadedFile}
                onRemove={() => removeFile(uploadedFile.id)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FileItem({
  uploadedFile,
  onRemove,
}: {
  uploadedFile: UploadedFile;
  onRemove: () => void;
}) {
  const { file, preview, status, error, result } = uploadedFile;

  const statusConfig = {
    pending: { bg: '', icon: null, text: 'En attente' },
    uploading: { bg: 'bg-primary-50', icon: <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />, text: 'Upload...' },
    analyzing: { bg: 'bg-amber-50', icon: <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />, text: 'Analyse IA...' },
    success: { bg: 'bg-success-50', icon: <CheckCircle className="w-4 h-4 text-success-600" />, text: 'Analysé ✓' },
    error: { bg: 'bg-danger-50', icon: <AlertCircle className="w-4 h-4 text-danger-600" />, text: 'Erreur' },
  };

  const config = statusConfig[status];

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FACTURE_ACHAT: '🛒 Facture Achat',
      FACTURE_VENTE: '💰 Facture Vente',
      NOTE_FRAIS: '🍴 Note de Frais',
      RECU: '🧾 Reçu',
      AUTRE: '📄 Autre',
    };
    return labels[type] || type;
  };

  return (
    <div className={`flex items-center gap-4 px-6 py-4 transition-colors ${config.bg}`}>
      {/* Preview */}
      {preview ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
          <img src={preview} alt={file.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {config.icon}
          <p className="font-medium text-slate-900 truncate">{file.name}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{config.text}</span>
        </div>

        {/* Result */}
        {status === 'success' && result && (
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-slate-600">
              {getDocTypeLabel(result.type)}
            </span>
            <span className="font-semibold text-success-600">
              {result.amount.toFixed(2)} €
            </span>
            {result.supplier && (
              <span className="text-slate-500">{result.supplier}</span>
            )}
          </div>
        )}

        {/* Error */}
        {status === 'error' && error && (
          <p className="mt-1 text-sm text-danger-600">❌ {error}</p>
        )}
      </div>

      {/* Remove Button */}
      {status !== 'uploading' && status !== 'analyzing' && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="text-slate-400 hover:text-danger-500 hover:bg-danger-50"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
