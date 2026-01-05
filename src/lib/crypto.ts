/**
 * Cryptography utilities for HadesNotes vault (Legacy v1)
 * Supports multiple encryption algorithms:
 * - AES-256-GCM (Web Crypto API)
 * - ChaCha20-Poly1305 (TweetNaCl - XSalsa20-Poly1305)
 * 
 * NOTE: For new vaults, use crypto-v2.ts with Argon2id + XChaCha20-Poly1305
 */

import * as bip39 from 'bip39';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// Constants
const KEY_LENGTH = 32; // 256 bits

// Encryption algorithm types
export type EncryptionAlgorithm = 'aes-256-gcm' | 'chacha20-poly1305';

// Default algorithm
export const DEFAULT_ALGORITHM: EncryptionAlgorithm = 'aes-256-gcm';

/**
 * Generate a new 12-word BIP39 mnemonic
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128); // 128 bits = 12 words
}

/**
 * Validate a BIP39 mnemonic
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Derive encryption key from mnemonic using PBKDF2
 */
export async function deriveKeyFromMnemonic(mnemonic: string, salt: string = 'hadesnotes-vault'): Promise<Uint8Array> {
  const normalizedMnemonic = mnemonic.trim().toLowerCase();

  // Convert mnemonic to seed using BIP39
  const seed = await bip39.mnemonicToSeed(normalizedMnemonic, salt);

  // Use first 32 bytes as encryption key
  return new Uint8Array(seed.subarray(0, KEY_LENGTH));
}

/**
 * Generate a random nonce for encryption
 */
export function generateNonce(): Uint8Array {
  return nacl.randomBytes(nacl.secretbox.nonceLength);
}

/**
 * Generate random IV for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
}

/**
 * Encrypt data using AES-256-GCM
 */
async function encryptAES256GCM(data: string, key: Uint8Array): Promise<string> {
  const iv = generateIV();
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Import key - use ArrayBuffer to avoid TypeScript issues
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
    cryptoKey,
    dataBuffer
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return encodeBase64(combined);
}

/**
 * Decrypt data using AES-256-GCM
 */
async function decryptAES256GCM(encryptedData: string, key: Uint8Array): Promise<string | null> {
  try {
    const combined = decodeBase64(encryptedData);

    // Extract IV and encrypted message
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Import key - use ArrayBuffer to avoid TypeScript issues
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
      cryptoKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('AES-GCM decryption error:', error);
    return null;
  }
}

/**
 * Encrypt data using ChaCha20-Poly1305 (via TweetNaCl's XSalsa20-Poly1305)
 */
function encryptChaCha20(data: string, key: Uint8Array): string {
  const nonce = generateNonce();
  const encoder = new TextEncoder();
  const messageUint8 = encoder.encode(data);
  const encrypted = nacl.secretbox(messageUint8, nonce, key);

  // Combine nonce and encrypted data
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return encodeBase64(fullMessage);
}

/**
 * Decrypt data using ChaCha20-Poly1305
 */
function decryptChaCha20(encryptedData: string, key: Uint8Array): string | null {
  try {
    const fullMessage = decodeBase64(encryptedData);

    // Extract nonce and encrypted message
    const nonce = fullMessage.slice(0, nacl.secretbox.nonceLength);
    const message = fullMessage.slice(nacl.secretbox.nonceLength);

    // Decrypt
    const decrypted = nacl.secretbox.open(message, nonce, key);

    if (!decrypted) {
      return null;
    }

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('ChaCha20 decryption error:', error);
    return null;
  }
}

/**
 * Encrypt data using specified algorithm
 */
export async function encryptData(
  data: string,
  key: Uint8Array,
  algorithm: EncryptionAlgorithm = DEFAULT_ALGORITHM
): Promise<string> {
  switch (algorithm) {
    case 'aes-256-gcm':
      return await encryptAES256GCM(data, key);
    case 'chacha20-poly1305':
      return encryptChaCha20(data, key);
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

/**
 * Decrypt data using specified algorithm
 */
export async function decryptData(
  encryptedData: string,
  key: Uint8Array,
  algorithm: EncryptionAlgorithm = DEFAULT_ALGORITHM
): Promise<string | null> {
  switch (algorithm) {
    case 'aes-256-gcm':
      return await decryptAES256GCM(encryptedData, key);
    case 'chacha20-poly1305':
      return decryptChaCha20(encryptedData, key);
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

/**
 * Hash mnemonic for verification (without revealing the actual mnemonic)
 */
export async function hashMnemonic(mnemonic: string): Promise<string> {
  const normalized = mnemonic.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt note content
 */
export interface EncryptedNote {
  id: string;
  encryptedTitle: string;
  encryptedContent: string;
  encryptedPreview: string;
  algorithm: EncryptionAlgorithm; // Track which algorithm was used
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isFavorite: boolean;
  section: string;
  notebookId?: string;
  order: number;
}

export interface DecryptedNote {
  id: string;
  title: string;
  content: string;
  preview: string;
  algorithm?: EncryptionAlgorithm;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isFavorite: boolean;
  section: string;
  notebookId?: string;
  order: number;
}

export async function encryptNote(
  note: DecryptedNote,
  key: Uint8Array,
  algorithm: EncryptionAlgorithm = DEFAULT_ALGORITHM
): Promise<EncryptedNote> {
  return {
    ...note,
    encryptedTitle: await encryptData(note.title, key, algorithm),
    encryptedContent: await encryptData(note.content, key, algorithm),
    encryptedPreview: await encryptData(note.preview, key, algorithm),
    algorithm,
  };
}

/**
 * Decrypt note content
 */
export async function decryptNote(encryptedNote: EncryptedNote, key: Uint8Array): Promise<DecryptedNote> {
  const algorithm = encryptedNote.algorithm || DEFAULT_ALGORITHM;

  const title = await decryptData(encryptedNote.encryptedTitle, key, algorithm);
  const content = await decryptData(encryptedNote.encryptedContent, key, algorithm);
  const preview = await decryptData(encryptedNote.encryptedPreview, key, algorithm);

  if (!title || !content || !preview) {
    throw new Error('Failed to decrypt note');
  }

  return {
    ...encryptedNote,
    title,
    content,
    preview,
  };
}

/**
 * Generate vault ID from mnemonic hash
 */
export async function generateVaultId(mnemonic: string): Promise<string> {
  const hash = await hashMnemonic(mnemonic);
  return `vault-${hash.slice(0, 16)}`;
}

/**
 * Export encrypted vault backup
 */
export interface VaultBackup {
  version: string;
  vaultId: string;
  algorithm: EncryptionAlgorithm;
  exportDate: string;
  encryptedData: string; // All data encrypted with vault key
}

export interface VaultBackupData {
  notes?: DecryptedNote[];
  notebooks?: unknown[];
  tags?: unknown[];
  settings?: unknown;
}

export async function createVaultBackup(
  data: VaultBackupData,
  key: Uint8Array,
  vaultId: string,
  algorithm: EncryptionAlgorithm = DEFAULT_ALGORITHM
): Promise<VaultBackup> {
  const jsonData = JSON.stringify(data);
  const encryptedData = await encryptData(jsonData, key, algorithm);

  return {
    version: '1.0',
    vaultId,
    algorithm,
    exportDate: new Date().toISOString(),
    encryptedData,
  };
}

/**
 * Restore vault from encrypted backup
 */
export async function restoreVaultBackup(
  backup: VaultBackup,
  key: Uint8Array
): Promise<VaultBackupData | null> {
  try {
    const decryptedJson = await decryptData(backup.encryptedData, key, backup.algorithm);
    if (!decryptedJson) {
      return null;
    }
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return null;
  }
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(backup: VaultBackup): void {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `hadesnotes-backup-${date}.json`;
  
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📦 Backup downloaded: ${filename}`);
}

/**
 * Parse backup file from File object
 */
export async function parseBackupFile(file: File): Promise<VaultBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content) as VaultBackup;
        
        // Validate backup structure
        if (!backup.version || !backup.vaultId || !backup.algorithm || !backup.encryptedData) {
          throw new Error('Invalid backup file structure');
        }
        
        // Validate version
        if (!backup.version.startsWith('1.')) {
          throw new Error(`Unsupported backup version: ${backup.version}`);
        }
        
        console.log('📂 Backup file parsed successfully');
        resolve(backup);
      } catch (error) {
        console.error('Failed to parse backup file:', error);
        reject(new Error('Invalid or corrupted backup file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Backup preview information
 */
export interface BackupPreview {
  noteCount: number;
  notebookCount: number;
  tagCount: number;
  backupDate: string;
  algorithm: EncryptionAlgorithm;
  vaultId: string;
}

/**
 * Get preview of backup contents without fully restoring
 */
export async function getBackupPreview(
  backup: VaultBackup,
  key: Uint8Array
): Promise<BackupPreview | null> {
  try {
    const data = await restoreVaultBackup(backup, key);
    
    if (!data) {
      return null;
    }
    
    return {
      noteCount: data.notes?.length || 0,
      notebookCount: Array.isArray(data.notebooks) ? data.notebooks.length : 0,
      tagCount: Array.isArray(data.tags) ? data.tags.length : 0,
      backupDate: backup.exportDate,
      algorithm: backup.algorithm,
      vaultId: backup.vaultId,
    };
  } catch (error) {
    console.error('Failed to get backup preview:', error);
    return null;
  }
}
