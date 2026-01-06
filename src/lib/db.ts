/**
 * IndexedDB Database Service for HadesNotes
 * Provides persistent storage for notes, notebooks, and tags
 */

import type { EncryptionAlgorithm } from '@/lib/crypto';

const DB_NAME = 'HadesNotesDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  NOTES: 'notes',
  NOTEBOOKS: 'notebooks',
  TAGS: 'tags',
  SETTINGS: 'settings',
};

export interface Note {
  id: string;
  vaultId?: string;
  title?: string;
  content?: string;
  preview?: string;
  encryptedTitle?: string;
  encryptedContent?: string;
  encryptedPreview?: string;
  algorithm?: EncryptionAlgorithm;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isFavorite: boolean;
  section: string;
  notebookId?: string;
  order: number;
}

export interface Notebook {
  id: string;
  vaultId?: string;
  name: string;
  noteCount: number;
  createdAt: Date;
}

export interface Tag {
  id: string;
  vaultId?: string;
  name: string;
  noteCount: number;
  createdAt: Date;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSaveDelay: number;
  searchDelay: number;
  showTOC: boolean;
  compactMode: boolean;
  fontSize: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    // Return existing promise if initialization is already in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        this.initPromise = null; // Reset promise on error
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Notes store
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          notesStore.createIndex('section', 'section', { unique: false });
          notesStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          notesStore.createIndex('createdAt', 'createdAt', { unique: false });
          notesStore.createIndex('notebookId', 'notebookId', { unique: false });
          console.log('📝 Notes store created');
        }

        // Create Notebooks store
        if (!db.objectStoreNames.contains(STORES.NOTEBOOKS)) {
          db.createObjectStore(STORES.NOTEBOOKS, { keyPath: 'id' });
          console.log('📚 Notebooks store created');
        }

        // Create Tags store
        if (!db.objectStoreNames.contains(STORES.TAGS)) {
          db.createObjectStore(STORES.TAGS, { keyPath: 'id' });
          console.log('🏷️ Tags store created');
        }

        // Create Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
          console.log('⚙️ Settings store created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db && !this.initPromise) {
      await this.init();
    } else if (this.initPromise) {
      await this.initPromise;
    }
    
    if (!this.db) {
      throw new Error('Database initialization failed');
    }
  }

  /**
   * Generic method to get all items from a store
   */
  private async getAll<T>(storeName: string): Promise<T[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to add/update an item
   */
  private async put<T>(storeName: string, item: T): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to delete an item
   */
  private async delete(storeName: string, id: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to clear a store
   */
  private async clear(storeName: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== NOTES ====================

  async getAllNotes(): Promise<Note[]> {
    const notes = await this.getAll<Note>(STORES.NOTES);
    // Convert date strings back to Date objects
    return notes.map(note => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt ?? note.createdAt),
    }));
  }

  async saveNote(note: Note): Promise<void> {
    await this.put(STORES.NOTES, note);
  }

  async saveNotes(notes: Note[]): Promise<void> {
    await this.ensureInitialized();

    const transaction = this.db!.transaction(STORES.NOTES, 'readwrite');
    const store = transaction.objectStore(STORES.NOTES);

    for (const note of notes) {
      store.put(note);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    await this.delete(STORES.NOTES, id);
  }

  async clearNotes(): Promise<void> {
    await this.clear(STORES.NOTES);
  }

  // ==================== NOTEBOOKS ====================

  async getAllNotebooks(): Promise<Notebook[]> {
    const notebooks = await this.getAll<Notebook>(STORES.NOTEBOOKS);
    return notebooks.map(notebook => ({
      ...notebook,
      createdAt: new Date(notebook.createdAt),
    }));
  }

  async saveNotebook(notebook: Notebook): Promise<void> {
    await this.put(STORES.NOTEBOOKS, notebook);
  }

  async deleteNotebook(id: string): Promise<void> {
    await this.delete(STORES.NOTEBOOKS, id);
  }

  // ==================== TAGS ====================

  async getAllTags(): Promise<Tag[]> {
    const tags = await this.getAll<Tag>(STORES.TAGS);
    return tags.map(tag => ({
      ...tag,
      createdAt: new Date(tag.createdAt),
    }));
  }

  async saveTag(tag: Tag): Promise<void> {
    await this.put(STORES.TAGS, tag);
  }

  async deleteTag(id: string): Promise<void> {
    await this.delete(STORES.TAGS, id);
  }

  // ==================== SETTINGS ====================

  async getSettings(): Promise<AppSettings | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get('appSettings');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.put(STORES.SETTINGS, { key: 'appSettings', value: settings });
  }

  // ==================== UTILITY ====================

  /**
   * Get database statistics
   */
  async getStats() {
    const [notes, notebooks, tags] = await Promise.all([
      this.getAllNotes(),
      this.getAllNotebooks(),
      this.getAllTags(),
    ]);

    return {
      notesCount: notes.length,
      notebooksCount: notebooks.length,
      tagsCount: tags.length,
      totalWords: notes.reduce((acc, note) => {
        const content = note.content ?? '';
        const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
        return acc + words;
      }, 0),
    };
  }

  /**
   * Export all data
   */
  async exportData() {
    const [notes, notebooks, tags, settings] = await Promise.all([
      this.getAllNotes(),
      this.getAllNotebooks(),
      this.getAllTags(),
      this.getSettings(),
    ]);

    return {
      version: DB_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        notes,
        notebooks,
        tags,
        settings,
      },
    };
  }

  /**
   * Import data
   */
  async importData(data: {
    version?: number;
    exportDate?: string;
    data: {
      notes?: Note[];
      notebooks?: Notebook[];
      tags?: Tag[];
      settings?: AppSettings;
    };
  }) {
    // Clear existing data
    await Promise.all([
      this.clearNotes(),
      this.clear(STORES.NOTEBOOKS),
      this.clear(STORES.TAGS),
    ]);

    // Import new data
    if (data.data.notes) await this.saveNotes(data.data.notes);
    if (data.data.notebooks) {
      for (const notebook of data.data.notebooks) {
        await this.saveNotebook(notebook);
      }
    }
    if (data.data.tags) {
      for (const tag of data.data.tags) {
        await this.saveTag(tag);
      }
    }
    if (data.data.settings) await this.saveSettings(data.data.settings);
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.clearNotes(),
      this.clear(STORES.NOTEBOOKS),
      this.clear(STORES.TAGS),
      this.clear(STORES.SETTINGS),
    ]);
    console.log('🗑️ All data cleared');
  }

  /**
   * Clear vault-specific data (notes, notebooks, tags)
   */
  async clearVaultData(vaultId?: string): Promise<void> {
    if (!vaultId) {
      await Promise.all([
        this.clearNotes(),
        this.clear(STORES.NOTEBOOKS),
        this.clear(STORES.TAGS),
      ]);
      console.log('🧹 Vault data cleared');
      return;
    }

    const [notes, notebooks, tags] = await Promise.all([
      this.getAllNotes(),
      this.getAllNotebooks(),
      this.getAllTags(),
    ]);

    await Promise.all([
      ...notes.filter((note) => note.vaultId === vaultId).map((note) => this.delete(STORES.NOTES, note.id)),
      ...notebooks.filter((notebook) => notebook.vaultId === vaultId).map((notebook) => this.delete(STORES.NOTEBOOKS, notebook.id)),
      ...tags.filter((tag) => tag.vaultId === vaultId).map((tag) => this.delete(STORES.TAGS, tag.id)),
    ]);

    console.log('🧹 Vault data cleared');
  }
}

// Create singleton instance
export const db = new IndexedDBService();

// Initialize on import
if (typeof window !== 'undefined') {
  db.init().catch(console.error);
}
