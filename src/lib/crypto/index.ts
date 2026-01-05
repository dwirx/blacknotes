/**
 * Crypto Module Index
 * 
 * Re-exports from both legacy (v1) and enhanced (v2) crypto modules.
 * Use v2 for new implementations.
 */

// V2 Enhanced Encryption (Argon2id + XChaCha20-Poly1305)
export {
  // Types
  type EncryptionAlgorithmV2,
  type KDFAlgorithm,
  type KDFParams,
  type EncryptedPayloadV2,
  type AADContext,
  type EncryptedNoteV2,
  type DecryptedNoteV2,
  type MigrationResult,
  type SearchResult,
  type VaultBackupV2,
  type VaultBackupDataV2,
  
  // Constants
  DEFAULT_ALGORITHM_V2,
  DEFAULT_KDF,
  
  // Padding
  pad,
  unpad,
  
  // AAD
  createAAD,
  parseAAD,
  
  // KDF
  generateSalt,
  getDefaultKDFParams,
  isArgon2idAvailable,
  deriveKeyArgon2id,
  deriveKeyPBKDF2,
  deriveKey,
  deriveKeyFromMnemonicLegacy,
  
  // Encryption
  generateNonce,
  encryptXChaCha20,
  decryptXChaCha20,
  
  // Payload
  createPayload,
  parsePayload,
  serializePayload,
  deserializePayload,
  
  // High-level API
  encryptString,
  decryptString,
  
  // Note encryption
  encryptNoteV2,
  decryptNoteV2,
  
  // Migration
  detectPayloadVersion,
  migrateNote,
  migrateAllNotes,
  
  // Search
  searchIndex,
  
  // Vault utilities
  generateMnemonic,
  validateMnemonic,
  hashMnemonic,
  generateVaultId,
  
  // Backup
  createVaultBackupV2,
  restoreVaultBackupV2,
} from '../crypto-v2';

// V1 Legacy Encryption (for backward compatibility)
export {
  type EncryptionAlgorithm,
  type EncryptedNote,
  type DecryptedNote,
  type VaultBackup,
  type VaultBackupData,
  type BackupPreview,
  
  DEFAULT_ALGORITHM,
  
  deriveKeyFromMnemonic,
  encryptData,
  decryptData,
  encryptNote,
  decryptNote,
  createVaultBackup,
  restoreVaultBackup,
  downloadBackup,
  parseBackupFile,
  getBackupPreview,
} from '../crypto';
