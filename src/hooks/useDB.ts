import { useEffect, useCallback, useState, useRef } from 'react';
import { db, Note, Notebook, Tag } from '@/lib/db';
import { useToast } from './use-toast';
import { useVaultStore } from '@/stores/vaultStore';
import { decryptNote, encryptNote, type DecryptedNote, type EncryptedNote } from '@/lib/crypto';

/**
 * Custom hook for persisting notes to IndexedDB
 */
export function useNotesDB() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const warnedMissingKey = useRef(false);
  const { encryptionKey, encryptionAlgorithm, isUnlocked, vaultId } = useVaultStore();

  const isEncryptedNote = (note: Note): note is Note & EncryptedNote => {
    return Boolean(note.encryptedTitle && note.encryptedContent && note.encryptedPreview);
  };

  const normalizeLegacyNote = useCallback((note: Note): DecryptedNote => ({
    id: note.id,
    vaultId: note.vaultId ?? vaultId ?? undefined,
    title: note.title ?? '',
    content: note.content ?? '',
    preview: note.preview ?? note.content?.substring(0, 100) ?? '',
    createdAt: note.createdAt,
    updatedAt: note.updatedAt ?? note.createdAt,
    tags: note.tags ?? [],
    isFavorite: note.isFavorite ?? false,
    section: note.section ?? 'notes',
    notebookId: note.notebookId,
    order: note.order ?? 0,
  }), [vaultId]);

  const warnMissingKeyOnce = useCallback(() => {
    if (warnedMissingKey.current) return;
    warnedMissingKey.current = true;
    toast({
      title: 'Vault terkunci',
      description: 'Buka vault untuk membaca atau menyimpan catatan terenkripsi.',
      variant: 'destructive',
    });
  }, [toast]);

  useEffect(() => {
    if (encryptionKey && isUnlocked) {
      warnedMissingKey.current = false;
    }
  }, [encryptionKey, isUnlocked]);

  /**
   * Load notes from IndexedDB
   */
  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const notes = await db.getAllNotes();

      if (!encryptionKey || !isUnlocked) {
        warnMissingKeyOnce();
        return [];
      }

      const decryptedNotes = await Promise.all(
        notes.map(async (note) => {
          if (vaultId && note.vaultId && note.vaultId !== vaultId) {
            return null;
          }
          if (!isEncryptedNote(note)) {
            return normalizeLegacyNote(note);
          }
          try {
            const decrypted = await decryptNote(note, encryptionKey, { suppressErrors: true });
            if (vaultId && decrypted.vaultId && decrypted.vaultId !== vaultId) {
              return null;
            }
            return decrypted.vaultId ? decrypted : { ...decrypted, vaultId };
          } catch (error) {
            return null;
          }
        })
      );

      return decryptedNotes.filter((note): note is DecryptedNote => Boolean(note));
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: 'Error loading notes',
        description: 'Failed to load notes from database',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [
    encryptionKey,
    isUnlocked,
    vaultId,
    toast,
    warnMissingKeyOnce,
    normalizeLegacyNote,
  ]);

  /**
   * Save a single note to IndexedDB
   */
  const saveNote = useCallback(async (note: Note) => {
    if (!encryptionKey || !isUnlocked) {
      warnMissingKeyOnce();
      return;
    }

    try {
      setIsSyncing(true);
      const normalized: DecryptedNote = {
        ...normalizeLegacyNote(note),
        updatedAt: new Date(),
        vaultId: vaultId ?? note.vaultId,
      };
      const encrypted = await encryptNote(normalized, encryptionKey, encryptionAlgorithm);
      await db.saveNote(encrypted);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save note',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [
    encryptionKey,
    encryptionAlgorithm,
    isUnlocked,
    vaultId,
    toast,
    warnMissingKeyOnce,
    normalizeLegacyNote,
  ]);

  /**
   * Save multiple notes to IndexedDB
   */
  const saveNotes = useCallback(async (notes: Note[]) => {
    if (!encryptionKey || !isUnlocked) {
      warnMissingKeyOnce();
      return;
    }

    try {
      setIsSyncing(true);
      const normalizedNotes: DecryptedNote[] = notes.map((note) => ({
        ...normalizeLegacyNote(note),
        updatedAt: note.updatedAt ?? new Date(),
        vaultId: vaultId ?? note.vaultId,
      }));
      const encryptedNotes = await Promise.all(
        normalizedNotes.map((note) => encryptNote(note, encryptionKey, encryptionAlgorithm))
      );
      await db.saveNotes(encryptedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [
    encryptionKey,
    encryptionAlgorithm,
    isUnlocked,
    vaultId,
    toast,
    warnMissingKeyOnce,
    normalizeLegacyNote,
  ]);

  /**
   * Delete a note from IndexedDB
   */
  const deleteNote = useCallback(async (id: string) => {
    try {
      setIsSyncing(true);
      await db.deleteNote(id);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  return {
    loadNotes,
    saveNote,
    saveNotes,
    deleteNote,
    isLoading,
    isSyncing,
  };
}

/**
 * Custom hook for persisting notebooks to IndexedDB
 */
export function useNotebooksDB() {
  const { toast } = useToast();
  const { vaultId } = useVaultStore();

  const loadNotebooks = useCallback(async () => {
    try {
      const notebooks = await db.getAllNotebooks();
      if (!vaultId) {
        return notebooks;
      }
      const legacy = notebooks.filter((notebook) => !notebook.vaultId);
      if (legacy.length > 0) {
        await Promise.all(
          legacy.map((notebook) => db.saveNotebook({ ...notebook, vaultId }))
        );
      }
      const scoped = notebooks.map((notebook) => (
        notebook.vaultId ? notebook : { ...notebook, vaultId }
      ));
      return scoped.filter((notebook) => notebook.vaultId === vaultId);
    } catch (error) {
      console.error('Error loading notebooks:', error);
      return [];
    }
  }, [vaultId]);

  const saveNotebook = useCallback(async (notebook: Notebook) => {
    try {
      const record = vaultId ? { ...notebook, vaultId } : notebook;
      await db.saveNotebook(record);
    } catch (error) {
      console.error('Error saving notebook:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save notebook',
        variant: 'destructive',
      });
    }
  }, [toast, vaultId]);

  const deleteNotebook = useCallback(async (id: string) => {
    try {
      await db.deleteNotebook(id);
    } catch (error) {
      console.error('Error deleting notebook:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete notebook',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    loadNotebooks,
    saveNotebook,
    deleteNotebook,
  };
}

/**
 * Custom hook for persisting tags to IndexedDB
 */
export function useTagsDB() {
  const { toast } = useToast();
  const { vaultId } = useVaultStore();

  const loadTags = useCallback(async () => {
    try {
      const tags = await db.getAllTags();
      if (!vaultId) {
        return tags;
      }
      const legacy = tags.filter((tag) => !tag.vaultId);
      if (legacy.length > 0) {
        await Promise.all(
          legacy.map((tag) => db.saveTag({ ...tag, vaultId }))
        );
      }
      const scoped = tags.map((tag) => (
        tag.vaultId ? tag : { ...tag, vaultId }
      ));
      return scoped.filter((tag) => tag.vaultId === vaultId);
    } catch (error) {
      console.error('Error loading tags:', error);
      return [];
    }
  }, [vaultId]);

  const saveTag = useCallback(async (tag: Tag) => {
    try {
      const record = vaultId ? { ...tag, vaultId } : tag;
      await db.saveTag(record);
    } catch (error) {
      console.error('Error saving tag:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save tag',
        variant: 'destructive',
      });
    }
  }, [toast, vaultId]);

  const deleteTag = useCallback(async (id: string) => {
    try {
      await db.deleteTag(id);
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete tag',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    loadTags,
    saveTag,
    deleteTag,
  };
}

/**
 * Custom hook for database statistics
 */
export function useDBStats() {
  const [stats, setStats] = useState({
    notesCount: 0,
    notebooksCount: 0,
    tagsCount: 0,
    totalWords: 0,
  });

  const refreshStats = useCallback(async () => {
    try {
      const dbStats = await db.getStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return { stats, refreshStats };
}

/**
 * Custom hook for data export/import
 */
export function useDataManagement() {
  const { toast } = useToast();

  const exportData = useCallback(async () => {
    try {
      const data = await db.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hadesnotes-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'Your data has been exported',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const importData = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.importData(data);

      toast({
        title: 'Import successful',
        description: 'Your data has been imported. Please refresh the page.',
      });

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Import failed',
        description: 'Failed to import data. Please check the file format.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const clearAllData = useCallback(async () => {
    try {
      await db.clearAll();
      toast({
        title: 'Data cleared',
        description: 'All data has been cleared. Page will refresh.',
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: 'Clear failed',
        description: 'Failed to clear data',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    exportData,
    importData,
    clearAllData,
  };
}
