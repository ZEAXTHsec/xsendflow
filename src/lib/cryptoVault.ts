import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'xsendflow_32_byte_secret_key_v1!'; // 32 characters for AES-256
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts sensitive credentials (like SMTP passwords or private API keys)
 * using AES-256-GCM authenticated encryption.
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM cipher string back into plaintext.
 */
export function decryptCredential(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText || '';
  try {
    const [ivHex, authTagHex, encryptedData] = cipherText.split(':');
    if (!ivHex || !authTagHex || !encryptedData) return cipherText;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return cipherText;
  }
}
