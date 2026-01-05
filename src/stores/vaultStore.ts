/**
 * Vault Store - Manages encrypted vault state with Remember Me support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  generateMnemonic,
  validateMnemonic,
  deriveKeyFromMnemonic,
  hashMnemonic,
  generateVaultId,
  EncryptionAlgorithm,
  DEFAULT_ALGORITHM,
  encryptData,
  decryptData,
} from '@/lib/crypto';

// Session Token for Remember Me feature
export interface SessionToken {
  encryptedMnemonic: string;
  createdAt: number;
  expiresAt: number;
  vaultId: string;
  version: string;
}

// Remember Me settings
export interface RememberMeSettings {
  enabled: boolean;
  duration: 7 | 30 | -1; // days, -1 = until logout
}

// Storage keys
const SESSION_TOKEN_KEY = 'hadesnotes-session-token';
const SESSION_KEY_KEY = 'hadesnotes-session-key';

export interface VaultState {
  // Vault status
  isVaultCreated: boolean;
  isUnlocked: boolean;
  vaultId: string | null;
  vaultHash: string | null;
  encryptionAlgorithm: EncryptionAlgorithm;

  // Encryption key (in memory only, never persisted)
  encryptionKey: Uint8Array | null;

  // Current mnemonic (only stored in memory when needed for backup/copy)
  currentMnemonic: string | null;

  // Remember Me settings
  rememberMeSettings: RememberMeSettings;

  // Actions
  createVault: (mnemonic?: string, algorithm?: EncryptionAlgorithm) => Promise<{ mnemonic: string; success: boolean }>;
  unlockVault: (mnemonic: string, rememberMe?: boolean) => Promise<boolean>;
  lockVault: () => void;
  destroyVault: () => void;
  setEncryptionAlgorithm: (algorithm: EncryptionAlgorithm) => void;
  getMnemonic: () => string | null;
  
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

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      // Initial state
      isVaultCreated: false,
      isUnlocked: false,
      vaultId: null,
      vaultHash: null,
      encryptionKey: null,
      encryptionAlgorithm: DEFAULT_ALGORITHM,
      currentMnemonic: null,
      rememberMeSettings: {
        enabled: false,
        duration: 7,
      },

      /**
       * Create a new vault
       */
      createVault: async (providedMnemonic?: string, algorithm?: EncryptionAlgorithm) => {
        try {
          const mnemonic = providedMnemonic || generateMnemonic();

          if (!validateMnemonic(mnemonic)) {
            return { mnemonic: '', success: false };
          }

          const key = await deriveKeyFromMnemonic(mnemonic);
          const vaultHash = await hashMnemonic(mnemonic);
          const vaultId = await generateVaultId(mnemonic);

          set({
            isVaultCreated: true,
            isUnlocked: true,
            vaultId,
            vaultHash,
            encryptionKey: key,
            encryptionAlgorithm: algorithm || DEFAULT_ALGORITHM,
            currentMnemonic: mnemonic,
          });

          console.log('✅ Vault created successfully');
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

          const key = await deriveKeyFromMnemonic(mnemonic);

          set({
            isUnlocked: true,
            encryptionKey: key,
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
        set({
          isUnlocked: false,
          encryptionKey: null,
          currentMnemonic: null,
        });
        console.log('🔒 Vault locked');
      },

      /**
       * Destroy vault completely (delete account)
       */
      destroyVault: () => {
        // Clear session token
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY_KEY);
        
        set({
          isVaultCreated: false,
          isUnlocked: false,
          vaultId: null,
          vaultHash: null,
          encryptionKey: null,
          currentMnemonic: null,
          encryptionAlgorithm: DEFAULT_ALGORITHM,
          rememberMeSettings: { enabled: false, duration: 7 },
        });
        console.log('🗑️ Vault destroyed');
      },

      /**
       * Set encryption algorithm preference
       */
      setEncryptionAlgorithm: (algorithm: EncryptionAlgorithm) => {
        set({ encryptionAlgorithm: algorithm });
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
       * Save session token for Remember Me
       */
      saveSessionToken: async () => {
        const state = get();
        if (!state.currentMnemonic || !state.vaultId) {
          console.error('Cannot save session token: no mnemonic or vault ID');
          return;
        }

        try {
          // Generate a random session key
          const sessionKey = generateSessionKey();
          
          // Encrypt the mnemonic with the session key
          const encryptedMnemonic = await encryptData(
            state.currentMnemonic,
            sessionKey,
            state.encryptionAlgorithm
          );

          // Calculate expiration
          const now = Date.now();
          const duration = state.rememberMeSettings.duration;
          const expiresAt = duration === -1 
            ? Number.MAX_SAFE_INTEGER 
            : now + (duration * 24 * 60 * 60 * 1000);

          const token: SessionToken = {
            encryptedMnemonic,
            createdAt: now,
            expiresAt,
            vaultId: state.vaultId,
            version: '1.0',
          };

          // Store the session key and token
          storeSessionKey(sessionKey);
          localStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(token));
          
          console.log('✅ Session token saved');
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

          const token: SessionToken = JSON.parse(tokenStr);
          
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
          const mnemonic = await decryptData(
            token.encryptedMnemonic,
            sessionKey,
            state.encryptionAlgorithm
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
        
        // Lock the vault
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
      name: 'hadesnotes-vault',
      partialize: (state) => ({
        isVaultCreated: state.isVaultCreated,
        vaultId: state.vaultId,
        vaultHash: state.vaultHash,
        encryptionAlgorithm: state.encryptionAlgorithm,
        rememberMeSettings: state.rememberMeSettings,
      }),
    }
  )
);
