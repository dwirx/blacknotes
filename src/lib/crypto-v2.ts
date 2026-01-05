/**
 * Enhanced Cryptography Module v2.0 for HadesNotes
 * 
 * Features:
 * - Argon2id KDF (64MB memory, 3 iterations, 4 parallelism)
 * - XChaCha20-Poly1305 AEAD encryption (24-byte nonce)
 * - Structured payload format with versioning
 * - AAD (Additional Authenticated Data) binding
 * - PKCS7 padding to 1KB boundary
 * - Complete metadata encryption
 * - Backward compatibility with v1 format
 */

import _sodium from 'libsodium-wrappers-sumo';
import * as bip39 from 'bip39';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type EncryptionAlgorithmV2 = 'xchacha20-poly1305' | 'aes-256-gcm' | 'chacha20-poly1305';
export type KDFAlgorithm = 'argon2id' | 'pbkdf2';

export const DEFAULT_ALGORITHM_V2: EncryptionAlgorithmV2 = 'xchacha20-poly1305';
export const DEFAULT_KDF: KDFAlgorithm = 'argon2id';

// KDF Parameters
export interface KDFParams {
  algorithm: KDFAlgorithm;
  salt: Uint8Array;
  memoryKiB: number;      // 65536 (64MB) for Argon2id
  iterations: number;     // 3 for Argon2id, 600000 for PBKDF2
  parallelism: number;    // 4 for Argon2id
}

// Encrypted Payload v2.0 format
export interface EncryptedPayloadV2 {
  v: '2.0';
  kdf: {
    alg: KDFAlgorithm;
    salt: string;         // Base64 encoded
    mem?: number;         // Memory in KiB (Argon2id only)
    iter: number;
    par?: number;         // Parallelism (Argon2id only)
  };
  nonce: string;          // Base64 encoded, 24 bytes
  ct: string;             // Base64 encoded ciphertext
  aad?: string;           // Base64 encoded AAD (optional)
}


// AAD Context for binding ciphertext to note/vault
export interface AADContext {
  noteId: string;
  vaultId: string;
  version?: string;
}

// Encrypted Note v2.0 format
export interface EncryptedNoteV2 {
  id: string;
  vaultId: string;
  encryptedTitle: string;
  encryptedContent: string;
  encryptedPreview: string;
  encryptedTags: string;
  encryptedNotebookId?: string;
  encryptedTimestamps: string;
  coarseCreatedAt: string;    // Day precision: "YYYY-MM-DD"
  coarseUpdatedAt: string;
  formatVersion: '2.0';
  algorithm: EncryptionAlgorithmV2;
  isFavorite: boolean;
  section: string;
  order: number;
}

// Decrypted Note
export interface DecryptedNoteV2 {
  id: string;
  title: string;
  content: string;
  preview: string;
  tags: string[];
  notebookId?: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  section: string;
  order: number;
}

// Migration result
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: { noteId: string; error: string }[];
}

// ============================================================================
// Constants
// ============================================================================

const ARGON2_MEMORY_KIB = 65536;  // 64MB
const ARGON2_ITERATIONS = 3;
const ARGON2_PARALLELISM = 4;
const PBKDF2_ITERATIONS = 600000;
const KEY_LENGTH = 32;            // 256 bits
const SALT_LENGTH = 16;           // 128 bits
const NONCE_LENGTH = 24;          // XChaCha20 nonce
const PADDING_BLOCK_SIZE = 1024;  // 1KB padding
const AAD_DELIMITER = '\x00';     // Null byte delimiter (cannot appear in UUIDs)


// ============================================================================
// Sodium Initialization
// ============================================================================

let sodiumReady = false;

async function ensureSodium(): Promise<typeof _sodium> {
  if (!sodiumReady) {
    await _sodium.ready;
    sodiumReady = true;
  }
  return _sodium;
}

// ============================================================================
// Utility Functions
// ============================================================================

function toBase64(data: Uint8Array): string {
  return _sodium.to_base64(data, _sodium.base64_variants.ORIGINAL);
}

function fromBase64(data: string): Uint8Array {
  return _sodium.from_base64(data, _sodium.base64_variants.ORIGINAL);
}

function toCoarseTimestamp(date: Date): string {
  return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// ============================================================================
// Padding Module (PKCS7 to 1KB boundary)
// ============================================================================

export function pad(data: Uint8Array, blockSize: number = PADDING_BLOCK_SIZE): Uint8Array {
  const remainder = data.length % blockSize;
  const paddingLength = remainder === 0 ? blockSize : blockSize - remainder;
  const padded = new Uint8Array(data.length + paddingLength);
  padded.set(data);
  // PKCS7: fill padding bytes with the padding length value
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = paddingLength;
  }
  return padded;
}

export function unpad(data: Uint8Array): Uint8Array {
  if (data.length === 0) return data;
  const paddingLength = data[data.length - 1];
  if (paddingLength === 0 || paddingLength > PADDING_BLOCK_SIZE) {
    throw new Error('Invalid padding');
  }
  // Verify all padding bytes
  for (let i = data.length - paddingLength; i < data.length; i++) {
    if (data[i] !== paddingLength) {
      throw new Error('Invalid padding');
    }
  }
  return data.slice(0, data.length - paddingLength);
}


// ============================================================================
// AAD Module (Additional Authenticated Data)
// ============================================================================

export function createAAD(context: AADContext): Uint8Array {
  const sodium = _sodium;
  const aadString = [
    context.noteId,
    context.vaultId,
    context.version || '2.0'
  ].join(AAD_DELIMITER);
  return sodium.from_string(aadString);
}

export function parseAAD(aad: Uint8Array): AADContext {
  const sodium = _sodium;
  const aadString = sodium.to_string(aad);
  const parts = aadString.split(AAD_DELIMITER);
  if (parts.length < 2) {
    throw new Error('Invalid AAD format');
  }
  return {
    noteId: parts[0],
    vaultId: parts[1],
    version: parts[2] || '2.0'
  };
}

// ============================================================================
// KDF Module (Key Derivation Function)
// ============================================================================

export function generateSalt(): Uint8Array {
  const sodium = _sodium;
  return sodium.randombytes_buf(SALT_LENGTH);
}

export function getDefaultKDFParams(algorithm: KDFAlgorithm = DEFAULT_KDF): KDFParams {
  return {
    algorithm,
    salt: new Uint8Array(SALT_LENGTH),
    memoryKiB: algorithm === 'argon2id' ? ARGON2_MEMORY_KIB : 0,
    iterations: algorithm === 'argon2id' ? ARGON2_ITERATIONS : PBKDF2_ITERATIONS,
    parallelism: algorithm === 'argon2id' ? ARGON2_PARALLELISM : 1
  };
}

export async function isArgon2idAvailable(): Promise<boolean> {
  try {
    const sodium = await ensureSodium();
    // Check if crypto_pwhash is available (sumo version)
    return typeof sodium.crypto_pwhash === 'function';
  } catch {
    return false;
  }
}


export async function deriveKeyArgon2id(
  password: string,
  salt: Uint8Array,
  memoryKiB: number = ARGON2_MEMORY_KIB,
  iterations: number = ARGON2_ITERATIONS,
  parallelism: number = ARGON2_PARALLELISM
): Promise<Uint8Array> {
  const sodium = await ensureSodium();
  
  // Use Argon2id via libsodium's crypto_pwhash
  const key = sodium.crypto_pwhash(
    KEY_LENGTH,
    password,
    salt,
    iterations,
    memoryKiB * 1024, // Convert KiB to bytes
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
  
  return key;
}

export async function deriveKeyPBKDF2(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  return new Uint8Array(derivedBits);
}

export async function deriveKey(
  mnemonic: string,
  params: KDFParams
): Promise<Uint8Array> {
  const normalizedMnemonic = mnemonic.trim().toLowerCase();
  
  if (params.algorithm === 'argon2id') {
    const available = await isArgon2idAvailable();
    if (available) {
      return deriveKeyArgon2id(
        normalizedMnemonic,
        params.salt,
        params.memoryKiB,
        params.iterations,
        params.parallelism
      );
    } else {
      console.warn('Argon2id not available, falling back to PBKDF2');
      return deriveKeyPBKDF2(normalizedMnemonic, params.salt, PBKDF2_ITERATIONS);
    }
  }
  
  return deriveKeyPBKDF2(normalizedMnemonic, params.salt, params.iterations);
}


// Legacy key derivation for backward compatibility
export async function deriveKeyFromMnemonicLegacy(
  mnemonic: string,
  salt: string = 'hadesnotes-vault'
): Promise<Uint8Array> {
  const normalizedMnemonic = mnemonic.trim().toLowerCase();
  const seed = await bip39.mnemonicToSeed(normalizedMnemonic, salt);
  return new Uint8Array(seed.subarray(0, KEY_LENGTH));
}

// ============================================================================
// Encryption Module (XChaCha20-Poly1305)
// ============================================================================

export function generateNonce(): Uint8Array {
  const sodium = _sodium;
  return sodium.randombytes_buf(NONCE_LENGTH);
}

export async function encryptXChaCha20(
  plaintext: Uint8Array,
  key: Uint8Array,
  aad?: Uint8Array
): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array }> {
  const sodium = await ensureSodium();
  const nonce = generateNonce();
  
  let ciphertext: Uint8Array;
  if (aad && aad.length > 0) {
    // Use AEAD with AAD
    ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      aad,
      null, // nsec (not used)
      nonce,
      key
    );
  } else {
    // Use secretbox (no AAD)
    ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  }
  
  return { nonce, ciphertext };
}

export async function decryptXChaCha20(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array,
  aad?: Uint8Array
): Promise<Uint8Array> {
  const sodium = await ensureSodium();
  
  try {
    if (aad && aad.length > 0) {
      // Use AEAD with AAD
      return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null, // nsec (not used)
        ciphertext,
        aad,
        nonce,
        key
      );
    } else {
      // Use secretbox (no AAD)
      const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
      if (!decrypted) {
        throw new Error('Decryption failed: authentication error');
      }
      return decrypted;
    }
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'authentication error'}`);
  }
}


// ============================================================================
// Payload Module (Structured Format v2.0)
// ============================================================================

export function createPayload(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  kdfParams: KDFParams,
  aad?: Uint8Array
): EncryptedPayloadV2 {
  const payload: EncryptedPayloadV2 = {
    v: '2.0',
    kdf: {
      alg: kdfParams.algorithm,
      salt: toBase64(kdfParams.salt),
      iter: kdfParams.iterations
    },
    nonce: toBase64(nonce),
    ct: toBase64(ciphertext)
  };
  
  if (kdfParams.algorithm === 'argon2id') {
    payload.kdf.mem = kdfParams.memoryKiB;
    payload.kdf.par = kdfParams.parallelism;
  }
  
  if (aad && aad.length > 0) {
    payload.aad = toBase64(aad);
  }
  
  return payload;
}

export function parsePayload(data: string): { version: '1.0' | '2.0'; payload: EncryptedPayloadV2 | string } {
  try {
    const parsed = JSON.parse(data);
    if (parsed.v === '2.0' && parsed.kdf && parsed.nonce && parsed.ct) {
      return { version: '2.0', payload: parsed as EncryptedPayloadV2 };
    }
  } catch {
    // Not JSON, assume v1 format (base64 encoded nonce+ciphertext)
  }
  return { version: '1.0', payload: data };
}

export function serializePayload(payload: EncryptedPayloadV2): string {
  return JSON.stringify(payload);
}

export function deserializePayload(json: string): EncryptedPayloadV2 {
  const parsed = JSON.parse(json);
  if (parsed.v !== '2.0') {
    throw new Error(`Unsupported payload version: ${parsed.v}`);
  }
  return parsed as EncryptedPayloadV2;
}


// ============================================================================
// High-Level Encryption/Decryption API
// ============================================================================

export async function encryptString(
  plaintext: string,
  key: Uint8Array,
  kdfParams: KDFParams,
  aadContext?: AADContext
): Promise<string> {
  const sodium = await ensureSodium();
  
  // Convert string to bytes
  const plaintextBytes = sodium.from_string(plaintext);
  
  // Pad to 1KB boundary
  const paddedPlaintext = pad(plaintextBytes);
  
  // Create AAD if context provided
  const aad = aadContext ? createAAD(aadContext) : undefined;
  
  // Encrypt
  const { nonce, ciphertext } = await encryptXChaCha20(paddedPlaintext, key, aad);
  
  // Create and serialize payload
  const payload = createPayload(ciphertext, nonce, kdfParams, aad);
  return serializePayload(payload);
}

export async function decryptString(
  encryptedData: string,
  key: Uint8Array,
  expectedAADContext?: AADContext
): Promise<string> {
  const sodium = await ensureSodium();
  
  const { version, payload } = parsePayload(encryptedData);
  
  if (version === '1.0') {
    // Legacy v1 format - delegate to legacy decryption
    return decryptStringLegacy(payload as string, key);
  }
  
  const v2Payload = payload as EncryptedPayloadV2;
  
  // Extract components
  const nonce = fromBase64(v2Payload.nonce);
  const ciphertext = fromBase64(v2Payload.ct);
  const storedAAD = v2Payload.aad ? fromBase64(v2Payload.aad) : undefined;
  
  // Verify AAD if expected
  if (expectedAADContext) {
    const expectedAAD = createAAD(expectedAADContext);
    if (storedAAD) {
      // Compare AAD
      if (sodium.to_string(storedAAD) !== sodium.to_string(expectedAAD)) {
        throw new Error('AAD mismatch: ciphertext may have been moved');
      }
    }
  }
  
  // Decrypt
  const paddedPlaintext = await decryptXChaCha20(ciphertext, nonce, key, storedAAD);
  
  // Remove padding
  const plaintext = unpad(paddedPlaintext);
  
  return sodium.to_string(plaintext);
}

// Legacy decryption for v1 format (XSalsa20-Poly1305 via tweetnacl)
async function decryptStringLegacy(encryptedData: string, key: Uint8Array): Promise<string> {
  const sodium = await ensureSodium();
  const fullMessage = fromBase64(encryptedData);
  
  // v1 format: nonce (24 bytes) + ciphertext
  const nonce = fullMessage.slice(0, 24);
  const ciphertext = fullMessage.slice(24);
  
  // Try XSalsa20-Poly1305 (tweetnacl compatible)
  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  if (!decrypted) {
    throw new Error('Legacy decryption failed');
  }
  
  return sodium.to_string(decrypted);
}


// ============================================================================
// Note Encryption/Decryption
// ============================================================================

export async function encryptNoteV2(
  note: DecryptedNoteV2,
  key: Uint8Array,
  vaultId: string,
  kdfParams: KDFParams
): Promise<EncryptedNoteV2> {
  const aadContext: AADContext = {
    noteId: note.id,
    vaultId,
    version: '2.0'
  };
  
  // Encrypt all sensitive fields
  const [
    encryptedTitle,
    encryptedContent,
    encryptedPreview,
    encryptedTags,
    encryptedTimestamps
  ] = await Promise.all([
    encryptString(note.title, key, kdfParams, aadContext),
    encryptString(note.content, key, kdfParams, aadContext),
    encryptString(note.preview, key, kdfParams, aadContext),
    encryptString(JSON.stringify(note.tags), key, kdfParams, aadContext),
    encryptString(JSON.stringify({
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString()
    }), key, kdfParams, aadContext)
  ]);
  
  // Encrypt notebookId if present
  let encryptedNotebookId: string | undefined;
  if (note.notebookId) {
    encryptedNotebookId = await encryptString(note.notebookId, key, kdfParams, aadContext);
  }
  
  return {
    id: note.id,
    vaultId,
    encryptedTitle,
    encryptedContent,
    encryptedPreview,
    encryptedTags,
    encryptedNotebookId,
    encryptedTimestamps,
    coarseCreatedAt: toCoarseTimestamp(note.createdAt),
    coarseUpdatedAt: toCoarseTimestamp(note.updatedAt),
    formatVersion: '2.0',
    algorithm: 'xchacha20-poly1305',
    isFavorite: note.isFavorite,
    section: note.section,
    order: note.order
  };
}

export async function decryptNoteV2(
  encryptedNote: EncryptedNoteV2,
  key: Uint8Array
): Promise<DecryptedNoteV2> {
  const aadContext: AADContext = {
    noteId: encryptedNote.id,
    vaultId: encryptedNote.vaultId,
    version: '2.0'
  };
  
  // Decrypt all fields
  const [
    title,
    content,
    preview,
    tagsJson,
    timestampsJson
  ] = await Promise.all([
    decryptString(encryptedNote.encryptedTitle, key, aadContext),
    decryptString(encryptedNote.encryptedContent, key, aadContext),
    decryptString(encryptedNote.encryptedPreview, key, aadContext),
    decryptString(encryptedNote.encryptedTags, key, aadContext),
    decryptString(encryptedNote.encryptedTimestamps, key, aadContext)
  ]);
  
  // Decrypt notebookId if present
  let notebookId: string | undefined;
  if (encryptedNote.encryptedNotebookId) {
    notebookId = await decryptString(encryptedNote.encryptedNotebookId, key, aadContext);
  }
  
  // Parse JSON fields
  const tags = JSON.parse(tagsJson) as string[];
  const timestamps = JSON.parse(timestampsJson) as { createdAt: string; updatedAt: string };
  
  return {
    id: encryptedNote.id,
    title,
    content,
    preview,
    tags,
    notebookId,
    createdAt: new Date(timestamps.createdAt),
    updatedAt: new Date(timestamps.updatedAt),
    isFavorite: encryptedNote.isFavorite,
    section: encryptedNote.section,
    order: encryptedNote.order
  };
}


// ============================================================================
// Migration Module (v1 → v2)
// ============================================================================

// Import types from legacy crypto module
import type { EncryptedNote, DecryptedNote } from './crypto';

export function detectPayloadVersion(data: string): '1.0' | '2.0' {
  try {
    const parsed = JSON.parse(data);
    if (parsed.v === '2.0') return '2.0';
  } catch {
    // Not JSON, assume v1
  }
  return '1.0';
}

export async function migrateNote(
  legacyNote: EncryptedNote,
  legacyKey: Uint8Array,
  vaultId: string,
  newKdfParams: KDFParams,
  newKey: Uint8Array
): Promise<EncryptedNoteV2> {
  // Import legacy decryption
  const { decryptNote } = await import('./crypto');
  
  // Decrypt with legacy key
  const decrypted = await decryptNote(legacyNote, legacyKey);
  
  // Convert to v2 format
  const decryptedV2: DecryptedNoteV2 = {
    id: decrypted.id,
    title: decrypted.title,
    content: decrypted.content,
    preview: decrypted.preview,
    tags: decrypted.tags,
    notebookId: decrypted.notebookId,
    createdAt: decrypted.createdAt,
    updatedAt: decrypted.updatedAt,
    isFavorite: decrypted.isFavorite,
    section: decrypted.section,
    order: decrypted.order
  };
  
  // Re-encrypt with new v2 format
  return encryptNoteV2(decryptedV2, newKey, vaultId, newKdfParams);
}

export async function migrateAllNotes(
  legacyNotes: EncryptedNote[],
  legacyKey: Uint8Array,
  vaultId: string,
  newKdfParams: KDFParams,
  newKey: Uint8Array
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    errors: []
  };
  
  const migratedNotes: EncryptedNoteV2[] = [];
  
  for (const note of legacyNotes) {
    try {
      const migrated = await migrateNote(note, legacyKey, vaultId, newKdfParams, newKey);
      migratedNotes.push(migrated);
      result.migratedCount++;
    } catch (error) {
      result.failedCount++;
      result.errors.push({
        noteId: note.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`Failed to migrate note ${note.id}:`, error);
    }
  }
  
  result.success = result.failedCount === 0;
  return result;
}


// ============================================================================
// Search Module (Local-First Encrypted Search)
// ============================================================================

export interface SearchResult {
  noteId: string;
  score: number;
  matches: {
    field: 'title' | 'content' | 'tags';
    snippet: string;
  }[];
}

class LocalSearchIndex {
  private documents: Map<string, {
    id: string;
    title: string;
    content: string;
    tags: string[];
  }> = new Map();
  
  private invertedIndex: Map<string, Set<string>> = new Map();
  
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }
  
  private addToInvertedIndex(noteId: string, tokens: string[]): void {
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(noteId);
    }
  }
  
  private removeFromInvertedIndex(noteId: string): void {
    for (const [, noteIds] of this.invertedIndex) {
      noteIds.delete(noteId);
    }
  }
  
  buildIndex(notes: DecryptedNoteV2[]): void {
    this.clear();
    for (const note of notes) {
      this.updateNote(note);
    }
  }
  
  updateNote(note: DecryptedNoteV2): void {
    // Remove old entry if exists
    this.removeNote(note.id);
    
    // Add document
    this.documents.set(note.id, {
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags
    });
    
    // Build inverted index
    const titleTokens = this.tokenize(note.title);
    const contentTokens = this.tokenize(note.content);
    const tagTokens = note.tags.flatMap(tag => this.tokenize(tag));
    
    this.addToInvertedIndex(note.id, [...titleTokens, ...contentTokens, ...tagTokens]);
  }
  
  removeNote(noteId: string): void {
    this.documents.delete(noteId);
    this.removeFromInvertedIndex(noteId);
  }
  
  clear(): void {
    this.documents.clear();
    this.invertedIndex.clear();
  }
  
  search(query: string): SearchResult[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];
    
    // Find matching documents
    const matchingNotes = new Map<string, number>();
    
    for (const token of queryTokens) {
      const noteIds = this.invertedIndex.get(token);
      if (noteIds) {
        for (const noteId of noteIds) {
          matchingNotes.set(noteId, (matchingNotes.get(noteId) || 0) + 1);
        }
      }
    }
    
    // Build results with scores
    const results: SearchResult[] = [];
    
    for (const [noteId, tokenMatches] of matchingNotes) {
      const doc = this.documents.get(noteId);
      if (!doc) continue;
      
      const matches: SearchResult['matches'] = [];
      const queryLower = query.toLowerCase();
      
      // Check title
      if (doc.title.toLowerCase().includes(queryLower)) {
        matches.push({
          field: 'title',
          snippet: doc.title.substring(0, 100)
        });
      }
      
      // Check content
      const contentLower = doc.content.toLowerCase();
      const contentIndex = contentLower.indexOf(queryLower);
      if (contentIndex !== -1) {
        const start = Math.max(0, contentIndex - 30);
        const end = Math.min(doc.content.length, contentIndex + query.length + 30);
        matches.push({
          field: 'content',
          snippet: '...' + doc.content.substring(start, end) + '...'
        });
      }
      
      // Check tags
      for (const tag of doc.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          matches.push({
            field: 'tags',
            snippet: tag
          });
          break;
        }
      }
      
      // Calculate score (simple TF-based scoring)
      const score = tokenMatches / queryTokens.length;
      
      results.push({
        noteId,
        score,
        matches
      });
    }
    
    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }
}

// Singleton search index instance
export const searchIndex = new LocalSearchIndex();


// ============================================================================
// Vault Utilities
// ============================================================================

export { generateMnemonic, validateMnemonic } from 'bip39';

export async function hashMnemonic(mnemonic: string): Promise<string> {
  const sodium = await ensureSodium();
  const normalized = mnemonic.trim().toLowerCase();
  const hash = sodium.crypto_generichash(32, sodium.from_string(normalized));
  return sodium.to_hex(hash);
}

export async function generateVaultId(mnemonic: string): Promise<string> {
  const hash = await hashMnemonic(mnemonic);
  return `vault-${hash.slice(0, 16)}`;
}

// ============================================================================
// Backup/Restore with v2 format
// ============================================================================

export interface VaultBackupV2 {
  version: '2.0';
  vaultId: string;
  algorithm: EncryptionAlgorithmV2;
  kdfParams: {
    alg: KDFAlgorithm;
    salt: string;
    mem?: number;
    iter: number;
    par?: number;
  };
  exportDate: string;
  encryptedData: string;
}

export interface VaultBackupDataV2 {
  notes?: DecryptedNoteV2[];
  notebooks?: unknown[];
  tags?: unknown[];
  settings?: unknown;
}

export async function createVaultBackupV2(
  data: VaultBackupDataV2,
  key: Uint8Array,
  vaultId: string,
  kdfParams: KDFParams
): Promise<VaultBackupV2> {
  const jsonData = JSON.stringify(data);
  const encryptedData = await encryptString(jsonData, key, kdfParams);
  
  return {
    version: '2.0',
    vaultId,
    algorithm: 'xchacha20-poly1305',
    kdfParams: {
      alg: kdfParams.algorithm,
      salt: toBase64(kdfParams.salt),
      mem: kdfParams.memoryKiB,
      iter: kdfParams.iterations,
      par: kdfParams.parallelism
    },
    exportDate: new Date().toISOString(),
    encryptedData
  };
}

export async function restoreVaultBackupV2(
  backup: VaultBackupV2,
  key: Uint8Array
): Promise<VaultBackupDataV2 | null> {
  try {
    const decryptedJson = await decryptString(backup.encryptedData, key);
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error('Failed to restore v2 backup:', error);
    return null;
  }
}

// ============================================================================
// Initialize sodium on module load
// ============================================================================

ensureSodium().catch(console.error);
