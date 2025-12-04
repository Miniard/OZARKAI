/**
 * Utilitaires de chiffrement pour données sensibles
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Génère une clé de chiffrement à partir d'une passphrase
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY non définie dans les variables d\'environnement');
  }
  
  // Dériver une clé de 32 bytes depuis la passphrase
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
}

/**
 * Chiffre une chaîne de caractères
 * @param text - Texte à chiffrer
 * @returns Texte chiffré en base64
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv + authTag + encrypted
    const result = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]);
    
    return result.toString('base64');
  } catch (error) {
    console.error('Erreur de chiffrement:', error);
    throw new Error('Échec du chiffrement');
  }
}

/**
 * Déchiffre une chaîne de caractères
 * @param encryptedText - Texte chiffré en base64
 * @returns Texte déchiffré
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(encryptedText, 'base64');
    
    // Extraire iv, authTag et données chiffrées
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erreur de déchiffrement:', error);
    throw new Error('Échec du déchiffrement');
  }
}

/**
 * Hash un mot de passe avec bcrypt
 * @param password - Mot de passe en clair
 * @returns Hash bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Vérifie un mot de passe contre son hash
 * @param password - Mot de passe en clair
 * @param hash - Hash bcrypt
 * @returns true si le mot de passe correspond
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Génère un token aléatoire sécurisé
 * @param length - Longueur du token (en bytes)
 * @returns Token en hexadécimal
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash une donnée avec SHA-256
 * @param data - Donnée à hasher
 * @returns Hash SHA-256 en hexadécimal
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

