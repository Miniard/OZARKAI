/**
 * Utilitaires pour upload sécurisé vers S3 / Cloudflare R2
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuration S3 / R2
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'komptal-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

/**
 * Génère une URL présignée pour upload direct depuis le client
 * @param filename - Nom du fichier
 * @param fileType - Type MIME du fichier
 * @param fileSize - Taille du fichier en bytes
 * @param userId - ID de l'utilisateur
 * @returns URL présignée + clé S3
 */
export async function generatePresignedUploadUrl(
  filename: string,
  fileType: string,
  fileSize: number,
  userId: string
): Promise<{ uploadUrl: string; key: string }> {
  // Validation
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux. Maximum : ${MAX_FILE_SIZE / 1024 / 1024} MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    throw new Error(`Type de fichier non autorisé. Types acceptés : ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Générer une clé unique
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${userId}/${timestamp}-${randomString}-${sanitizedFilename}`;

  // Créer la commande PutObject
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  // Générer l'URL présignée (valide 5 minutes)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { uploadUrl, key };
}

/**
 * Génère une URL présignée pour téléchargement
 * @param key - Clé S3 du fichier
 * @param expiresIn - Durée de validité en secondes (défaut: 1 heure)
 * @returns URL présignée
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload direct depuis le serveur (pour traitement interne)
 * @param buffer - Buffer du fichier
 * @param filename - Nom du fichier
 * @param contentType - Type MIME
 * @param userId - ID de l'utilisateur
 * @returns Clé S3
 */
export async function uploadFromServer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${userId}/${timestamp}-${randomString}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  return key;
}

/**
 * Télécharge un fichier depuis S3 (pour traitement serveur)
 * @param key - Clé S3
 * @returns Buffer du fichier
 */
export async function downloadFromServer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('Fichier introuvable');
  }

  // Convertir le stream en buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

/**
 * Valide les métadonnées d'upload
 */
export function validateUploadMetadata(
  filename: string,
  fileType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!filename || filename.length > 255) {
    return { valid: false, error: 'Nom de fichier invalide' };
  }

  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    return { valid: false, error: 'Type de fichier non autorisé' };
  }

  if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `Taille de fichier invalide (max: ${MAX_FILE_SIZE / 1024 / 1024} MB)` };
  }

  return { valid: true };
}

