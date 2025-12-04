/**
 * Composant Upload LOCAL (sans S3)
 * Version simplifiée pour développement
 */

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadDocumentLocalProps {
  companyId: string;
  onUploadComplete?: () => void;
}

export function UploadDocumentLocal({ companyId, onUploadComplete }: UploadDocumentLocalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSuccess(false);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Upload avec FormData (pas de S3, direct au serveur)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);

      const uploadResponse = await fetch('/api/upload-local', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const { documentId } = await uploadResponse.json();

      setUploading(false);
      setAnalyzing(true);

      // Déclencher l'analyse
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Erreur lors de l\'analyse');
      }

      setAnalyzing(false);
      setSuccess(true);
      setFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Callback
      onUploadComplete?.();

      // Reset après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Télécharger un document (MODE LOCAL)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Zone de drop */}
          <div
            className="border-2 border-dashed border-dark-600 rounded-xl p-12 text-center hover:border-primary-500 transition-all duration-300 cursor-pointer bg-dark-800/30 hover:bg-dark-800/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3 text-primary-400">
                <FileText className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-medium text-white">{file.name}</p>
                  <span className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-16 h-16 mx-auto text-primary-400 mb-4" />
                <p className="text-gray-300 text-lg font-medium mb-2">
                  Cliquez pour sélectionner ou glissez un fichier ici
                </p>
                <p className="text-sm text-gray-500">
                  PDF, JPG, PNG (max. 10 MB)
                </p>
              </>
            )}
          </div>

          {/* Messages */}
          {success && (
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg p-4 backdrop-blur-sm">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Document uploadé et analysé avec succès !</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg p-4 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Bouton */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || analyzing}
            isLoading={uploading || analyzing}
            className="btn-ozark w-full text-base py-4"
          >
            {uploading && 'Upload en cours...'}
            {analyzing && 'Analyse en cours...'}
            {!uploading && !analyzing && 'Uploader et analyser'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

