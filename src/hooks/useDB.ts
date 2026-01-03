import { useEffect, useCallback, useState } from 'react';
import { db, Note, Notebook, Tag } from '@/lib/db';
import { useToast } from './use-toast';

/**
 * Custom hook for persisting notes to IndexedDB
 */
export function useNotesDB() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Load notes from IndexedDB
   */
  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const notes = await db.getAllNotes();
      return notes;
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
  }, [toast]);

  /**
   * Save a single note to IndexedDB
   */
  const saveNote = useCallback(async (note: Note) => {
    try {
      setIsSyncing(true);
      await db.saveNote({
        ...note,
        updatedAt: new Date(),
      });
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
  }, [toast]);

  /**
   * Save multiple notes to IndexedDB
   */
  const saveNotes = useCallback(async (notes: Note[]) => {
    try {
      setIsSyncing(true);
      await db.saveNotes(notes);
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
  }, [toast]);

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

  const loadNotebooks = useCallback(async () => {
    try {
      return await db.getAllNotebooks();
    } catch (error) {
      console.error('Error loading notebooks:', error);
      return [];
    }
  }, []);

  const saveNotebook = useCallback(async (notebook: Notebook) => {
    try {
      await db.saveNotebook(notebook);
    } catch (error) {
      console.error('Error saving notebook:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save notebook',
        variant: 'destructive',
      });
    }
  }, [toast]);

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

  const loadTags = useCallback(async () => {
    try {
      return await db.getAllTags();
    } catch (error) {
      console.error('Error loading tags:', error);
      return [];
    }
  }, []);

  const saveTag = useCallback(async (tag: Tag) => {
    try {
      await db.saveTag(tag);
    } catch (error) {
      console.error('Error saving tag:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save tag',
        variant: 'destructive',
      });
    }
  }, [toast]);

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
