/**
 * Vault Store V2 - Enhanced encryption with Argon2id and XChaCha20-Poly1305
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  generateMnemonic,
  validateMnemonic,
  deriveKey,
  deriveKeyFromMnemonicLegacy,
  hashMnemonic,
  generateVaultId,
  generateSalt,
  getDefaultKDFParams,
  encryptString,
  decryptString,
  searchIndex,
  EncryptionAlgorithmV2,
  KDFAlgorithm,
  KDFParams,
  DEFAULT_ALGORITHM_V2,
  DEFAULT_KDF,
} from '@/lib/crypto-v2';

// Session Token for Remember Me feature
export interface SessionTokenV2 {
  encryptedMnemonic: string;
  createdAt: number;
  expiresAt: number;
  vaultId: string;
  version: '2.0';
  kdfParams: {
    alg: KDFAlgorithm;
    salt: string;
    mem?: number;
    iter: number;
    par?: number;
  };
}

// Remember Me settings
export interface RememberMeSettings {
  enabled: boolean;
  duration: 7 | 30 | -1;
}

// Storage keys
const SESSION_TOKEN_KEY = 'hadesnotes-session-token-v2';
const SESSION_KEY_KEY = 'hadesnotes-session-key-v2';

// KDF Params storage
const KDF_PARAMS_KEY = 'hadesnotes-kdf-params';


export interface VaultStateV2 {
  // Vault status
  isVaultCreated: boolean;
  isUnlocked: boolean;
  vaultId: string | null;
  vaultHash: string | null;
  encryptionAlgorithm: EncryptionAlgorithmV2;
  kdfAlgorithm: KDFAlgorithm;
  formatVersion: '1.0' | '2.0';

  // Encryption key (in memory only, never persisted)
  encryptionKey: Uint8Array | null;
  kdfParams: KDFParams | null;

  // Current mnemonic (only stored in memory when needed for backup/copy)
  currentMnemonic: string | null;

  // Remember Me settings
  rememberMeSettings: RememberMeSettings;

  // Actions
  createVault: (mnemonic?: string) => Promise<{ mnemonic: string; success: boolean }>;
  unlockVault: (mnemonic: string, rememberMe?: boolean) => Promise<boolean>;
  lockVault: () => void;
  destroyVault: () => void;
  getMnemonic: () => string | null;
  getKDFParams: () => KDFParams | null;
  
  // Remember Me actions
  setRememberMe: (enabled: boolean, duration?: 7 | 30 | -1) => void;
  saveSessionToken: () => Promise<void>;
  clearSessionToken: () => void;
  autoUnlockWithToken: () => Promise<boolean>;
  hasSessionToken: () => boolean;
  logout: (clearRememberMe?: boolean) => void;
}

/**
 * Generate a random session key for encrypting the mnemonic
 */
function generateSessionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Store session key in localStorage (base64 encoded)
 */
function storeSessionKey(key: Uint8Array): void {
  const base64Key = btoa(String.fromCharCode(...key));
  localStorage.setItem(SESSION_KEY_KEY, base64Key);
}

/**
 * Retrieve session key from localStorage
 */
function getStoredSessionKey(): Uint8Array | null {
  const base64Key = localStorage.getItem(SESSION_KEY_KEY);
  if (!base64Key) return null;
  
  try {
    const binaryString = atob(base64Key);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Store KDF params in localStorage
 */
function storeKDFParams(params: KDFParams): void {
  const stored = {
    algorithm: params.algorithm,
    salt: btoa(String.fromCharCode(...params.salt)),
    memoryKiB: params.memoryKiB,
    iterations: params.iterations,
    parallelism: params.parallelism
  };
  localStorage.setItem(KDF_PARAMS_KEY, JSON.stringify(stored));
}

/**
 * Retrieve KDF params from localStorage
 */
function getStoredKDFParams(): KDFParams | null {
  const stored = localStorage.getItem(KDF_PARAMS_KEY);
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    const saltBinary = atob(parsed.salt);
    const salt = new Uint8Array(saltBinary.length);
    for (let i = 0; i < saltBinary.length; i++) {
      salt[i] = saltBinary.charCodeAt(i);
    }
    return {
      algorithm: parsed.algorithm,
      salt,
      memoryKiB: parsed.memoryKiB,
      iterations: parsed.iterations,
      parallelism: parsed.parallelism
    };
  } catch {
    return null;
  }
}


export const useVaultStoreV2 = create<VaultStateV2>()(
  persist(
    (set, get) => ({
      // Initial state
      isVaultCreated: false,
      isUnlocked: false,
      vaultId: null,
      vaultHash: null,
      encryptionKey: null,
      encryptionAlgorithm: DEFAULT_ALGORITHM_V2,
      kdfAlgorithm: DEFAULT_KDF,
      kdfParams: null,
      formatVersion: '2.0',
      currentMnemonic: null,
      rememberMeSettings: {
        enabled: false,
        duration: 7,
      },

      /**
       * Create a new vault with Argon2id KDF
       */
      createVault: async (providedMnemonic?: string) => {
        try {
          const mnemonic = providedMnemonic || generateMnemonic();

          if (!validateMnemonic(mnemonic)) {
            return { mnemonic: '', success: false };
          }

          // Generate new salt and KDF params
          const salt = generateSalt();
          const kdfParams: KDFParams = {
            ...getDefaultKDFParams(DEFAULT_KDF),
            salt
          };

          // Derive key using Argon2id
          const key = await deriveKey(mnemonic, kdfParams);
          const vaultHash = await hashMnemonic(mnemonic);
          const vaultId = await generateVaultId(mnemonic);

          // Store KDF params
          storeKDFParams(kdfParams);

          set({
            isVaultCreated: true,
            isUnlocked: true,
            vaultId,
            vaultHash,
            encryptionKey: key,
            encryptionAlgorithm: DEFAULT_ALGORITHM_V2,
            kdfAlgorithm: DEFAULT_KDF,
            kdfParams,
            formatVersion: '2.0',
            currentMnemonic: mnemonic,
          });

          console.log('✅ Vault created with Argon2id + XChaCha20-Poly1305');
          return { mnemonic, success: true };
        } catch (error) {
          console.error('Failed to create vault:', error);
          return { mnemonic: '', success: false };
        }
      },

      /**
       * Unlock vault with mnemonic
       */
      unlockVault: async (mnemonic: string, rememberMe?: boolean) => {
        try {
          const state = get();

          if (!state.isVaultCreated) {
            console.error('No vault exists');
            return false;
          }

          if (!validateMnemonic(mnemonic)) {
            console.error('Invalid mnemonic');
            return false;
          }

          const inputHash = await hashMnemonic(mnemonic);
          if (inputHash !== state.vaultHash) {
            console.error('Mnemonic does not match vault');
            return false;
          }

          // Get stored KDF params or use defaults
          let kdfParams = getStoredKDFParams();
          let key: Uint8Array;

          if (kdfParams) {
            // Use stored KDF params (v2 format)
            key = await deriveKey(mnemonic, kdfParams);
          } else {
            // Legacy vault - use old key derivation
            key = await deriveKeyFromMnemonicLegacy(mnemonic);
            // Create new KDF params for future use
            const salt = generateSalt();
            kdfParams = {
              ...getDefaultKDFParams(DEFAULT_KDF),
              salt
            };
          }

          set({
            isUnlocked: true,
            encryptionKey: key,
            kdfParams,
            currentMnemonic: mnemonic,
          });

          // Save session token if Remember Me is enabled
          if (rememberMe !== undefined) {
            set({ rememberMeSettings: { ...state.rememberMeSettings, enabled: rememberMe } });
          }
          
          if (rememberMe || state.rememberMeSettings.enabled) {
            await get().saveSessionToken();
          }

          console.log('✅ Vault unlocked');
          return true;
        } catch (error) {
          console.error('Failed to unlock vault:', error);
          return false;
        }
      },

      /**
       * Lock vault (clear encryption key from memory)
       */
      lockVault: () => {
        const state = get();
        
        // Zero out the encryption key
        if (state.encryptionKey) {
          state.encryptionKey.fill(0);
        }
        
        // Clear search index
        searchIndex.clear();
        
        set({
          isUnlocked: false,
          encryptionKey: null,
          currentMnemonic: null,
        });
        console.log('🔒 Vault locked (key zeroed)');
      },

      /**
       * Destroy vault completely
       */
      destroyVault: () => {
        const state = get();
        
        // Zero out the encryption key
        if (state.encryptionKey) {
          state.encryptionKey.fill(0);
        }
        
        // Clear all storage
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY_KEY);
        localStorage.removeItem(KDF_PARAMS_KEY);
        
        // Clear search index
        searchIndex.clear();
        
        set({
          isVaultCreated: false,
          isUnlocked: false,
          vaultId: null,
          vaultHash: null,
          encryptionKey: null,
          kdfParams: null,
          currentMnemonic: null,
          encryptionAlgorithm: DEFAULT_ALGORITHM_V2,
          kdfAlgorithm: DEFAULT_KDF,
          formatVersion: '2.0',
          rememberMeSettings: { enabled: false, duration: 7 },
        });
        console.log('🗑️ Vault destroyed');
      },

      /**
       * Get current mnemonic (for backup/copy)
       */
      getMnemonic: () => {
        const state = get();
        if (!state.isUnlocked || !state.currentMnemonic) {
          return null;
        }
        return state.currentMnemonic;
      },

      /**
       * Get KDF params
       */
      getKDFParams: () => {
        return get().kdfParams;
      },

      /**
       * Set Remember Me settings
       */
      setRememberMe: (enabled: boolean, duration?: 7 | 30 | -1) => {
        const state = get();
        set({
          rememberMeSettings: {
            enabled,
            duration: duration ?? state.rememberMeSettings.duration,
          },
        });
      },


      /**
       * Save session token for Remember Me (with separate session key)
       */
      saveSessionToken: async () => {
        const state = get();
        if (!state.currentMnemonic || !state.vaultId || !state.kdfParams) {
          console.error('Cannot save session token: missing data');
          return;
        }

        try {
          // Generate a SEPARATE random session key (not the vault key)
          const sessionKey = generateSessionKey();
          
          // Create session-specific KDF params
          const sessionSalt = generateSalt();
          const sessionKdfParams: KDFParams = {
            ...getDefaultKDFParams(DEFAULT_KDF),
            salt: sessionSalt
          };
          
          // Encrypt the mnemonic with the session key
          const encryptedMnemonic = await encryptString(
            state.currentMnemonic,
            sessionKey,
            sessionKdfParams
          );

          // Calculate expiration
          const now = Date.now();
          const duration = state.rememberMeSettings.duration;
          const expiresAt = duration === -1 
            ? Number.MAX_SAFE_INTEGER 
            : now + (duration * 24 * 60 * 60 * 1000);

          const token: SessionTokenV2 = {
            encryptedMnemonic,
            createdAt: now,
            expiresAt,
            vaultId: state.vaultId,
            version: '2.0',
            kdfParams: {
              alg: sessionKdfParams.algorithm,
              salt: btoa(String.fromCharCode(...sessionKdfParams.salt)),
              mem: sessionKdfParams.memoryKiB,
              iter: sessionKdfParams.iterations,
              par: sessionKdfParams.parallelism
            }
          };

          // Store the session key and token
          storeSessionKey(sessionKey);
          localStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(token));
          
          console.log('✅ Session token saved (separate key)');
        } catch (error) {
          console.error('Failed to save session token:', error);
        }
      },

      /**
       * Clear session token
       */
      clearSessionToken: () => {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY_KEY);
        console.log('🗑️ Session token cleared');
      },

      /**
       * Check if session token exists
       */
      hasSessionToken: () => {
        return localStorage.getItem(SESSION_TOKEN_KEY) !== null;
      },

      /**
       * Auto-unlock vault with stored session token
       */
      autoUnlockWithToken: async () => {
        const state = get();
        
        if (!state.isVaultCreated) {
          return false;
        }

        try {
          const tokenStr = localStorage.getItem(SESSION_TOKEN_KEY);
          if (!tokenStr) {
            return false;
          }

          const token: SessionTokenV2 = JSON.parse(tokenStr);
          
          // Validate token
          if (token.vaultId !== state.vaultId) {
            console.error('Token vault ID mismatch');
            get().clearSessionToken();
            return false;
          }

          // Check expiration
          if (Date.now() > token.expiresAt) {
            console.log('Session token expired');
            get().clearSessionToken();
            return false;
          }

          // Get session key
          const sessionKey = getStoredSessionKey();
          if (!sessionKey) {
            console.error('Session key not found');
            get().clearSessionToken();
            return false;
          }

          // Decrypt mnemonic
          const mnemonic = await decryptString(
            token.encryptedMnemonic,
            sessionKey
          );

          if (!mnemonic) {
            console.error('Failed to decrypt mnemonic');
            get().clearSessionToken();
            return false;
          }

          // Unlock vault with decrypted mnemonic
          const success = await get().unlockVault(mnemonic, false);
          
          if (success) {
            console.log('✅ Auto-unlocked with session token');
          }
          
          return success;
        } catch (error) {
          console.error('Failed to auto-unlock:', error);
          get().clearSessionToken();
          return false;
        }
      },

      /**
       * Logout - lock vault and optionally clear Remember Me
       */
      logout: (clearRememberMe: boolean = true) => {
        const state = get();
        
        // Zero out the encryption key
        if (state.encryptionKey) {
          state.encryptionKey.fill(0);
        }
        
        // Clear search index
        searchIndex.clear();
        
        set({
          isUnlocked: false,
          encryptionKey: null,
          currentMnemonic: null,
        });

        // Clear session token if requested
        if (clearRememberMe) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          localStorage.removeItem(SESSION_KEY_KEY);
          set({ rememberMeSettings: { ...state.rememberMeSettings, enabled: false } });
        }

        console.log('👋 Logged out', clearRememberMe ? '(session cleared)' : '(session preserved)');
      },
    }),
    {
      name: 'hadesnotes-vault-v2',
      partialize: (state) => ({
        isVaultCreated: state.isVaultCreated,
        vaultId: state.vaultId,
        vaultHash: state.vaultHash,
        encryptionAlgorithm: state.encryptionAlgorithm,
        kdfAlgorithm: state.kdfAlgorithm,
        formatVersion: state.formatVersion,
        rememberMeSettings: state.rememberMeSettings,
      }),
    }
  )
);
