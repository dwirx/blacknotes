import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Note {
  id: string;
  title: string;
  content: string;
  preview: string;
  createdAt: Date;
  tags: string[];
  isFavorite: boolean;
  section: string;
  notebookId?: string;
  order: number;
}

interface Notebook {
  id: string;
  name: string;
  noteCount: number;
  order: number;
}

interface Tag {
  id: string;
  name: string;
  noteCount: number;
}

interface NotesState {
  notes: Note[];
  notebooks: Notebook[];
  tags: Tag[];
  activeSection: string;
  selectedNoteId: string | null;
  openNotes: { id: string; title: string }[];
  noteHistory: string[];
  historyIndex: number;
  searchQuery: string;
  
  // Actions
  addNote: (note: Omit<Note, 'order'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  toggleFavorite: (id: string) => void;
  archiveNote: (id: string) => void;
  reorderNotes: (activeId: string, overId: string) => void;
  
  addNotebook: (name: string) => void;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;
  reorderNotebooks: (activeId: string, overId: string) => void;
  
  addTag: (name: string) => void;
  deleteTag: (id: string) => void;
  
  setActiveSection: (section: string) => void;
  selectNote: (id: string | null) => void;
  openNote: (id: string, title: string) => void;
  closeNote: (id: string) => void;
  setSearchQuery: (query: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
}

export const useNotesStore = create<NotesState>()(
  subscribeWithSelector((set, get) => ({
    notes: [],
    notebooks: [],
    tags: [],
    activeSection: 'notes',
    selectedNoteId: null,
    openNotes: [],
    noteHistory: [],
    historyIndex: -1,
    searchQuery: '',

    addNote: (note) => set((state) => ({
      notes: [{ ...note, order: 0 }, ...state.notes.map(n => ({ ...n, order: n.order + 1 }))],
    })),

    updateNote: (id, updates) => set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n),
      openNotes: state.openNotes.map(n => n.id === id && updates.title !== undefined 
        ? { ...n, title: updates.title || 'Untitled' } 
        : n
      ),
    })),

    deleteNote: (id) => set((state) => {
      const note = state.notes.find(n => n.id === id);
      if (!note) return state;

      if (note.section === 'trash') {
        return {
          notes: state.notes.filter(n => n.id !== id),
          openNotes: state.openNotes.filter(n => n.id !== id),
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        };
      }

      return {
        notes: state.notes.map(n => n.id === id ? { ...n, section: 'trash' } : n),
        selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
      };
    }),

    restoreNote: (id) => set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, section: 'notes' } : n),
    })),

    toggleFavorite: (id) => set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n),
    })),

    archiveNote: (id) => set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, section: 'archive' } : n),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    })),

    reorderNotes: (activeId, overId) => set((state) => {
      const activeIndex = state.notes.findIndex(n => n.id === activeId);
      const overIndex = state.notes.findIndex(n => n.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return state;
      
      const newNotes = [...state.notes];
      const [removed] = newNotes.splice(activeIndex, 1);
      newNotes.splice(overIndex, 0, removed);
      
      return {
        notes: newNotes.map((n, i) => ({ ...n, order: i })),
      };
    }),

    addNotebook: (name) => set((state) => ({
      notebooks: [...state.notebooks, {
        id: crypto.randomUUID(),
        name,
        noteCount: 0,
        order: state.notebooks.length,
      }],
    })),

    updateNotebook: (id, updates) => set((state) => ({
      notebooks: state.notebooks.map(n => n.id === id ? { ...n, ...updates } : n),
    })),

    deleteNotebook: (id) => set((state) => ({
      notebooks: state.notebooks.filter(n => n.id !== id),
    })),

    reorderNotebooks: (activeId, overId) => set((state) => {
      const activeIndex = state.notebooks.findIndex(n => n.id === activeId);
      const overIndex = state.notebooks.findIndex(n => n.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return state;
      
      const newNotebooks = [...state.notebooks];
      const [removed] = newNotebooks.splice(activeIndex, 1);
      newNotebooks.splice(overIndex, 0, removed);
      
      return {
        notebooks: newNotebooks.map((n, i) => ({ ...n, order: i })),
      };
    }),

    addTag: (name) => set((state) => ({
      tags: [...state.tags, {
        id: crypto.randomUUID(),
        name,
        noteCount: 0,
      }],
    })),

    deleteTag: (id) => set((state) => ({
      tags: state.tags.filter(t => t.id !== id),
    })),

    setActiveSection: (section) => set({ activeSection: section }),

    selectNote: (id) => set({ selectedNoteId: id }),

    openNote: (id, title) => set((state) => {
      const alreadyOpen = state.openNotes.find(n => n.id === id);
      const newHistory = [...state.noteHistory.slice(0, state.historyIndex + 1), id];
      
      return {
        selectedNoteId: id,
        openNotes: alreadyOpen ? state.openNotes : [...state.openNotes, { id, title }],
        noteHistory: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

    closeNote: (id) => set((state) => {
      const remaining = state.openNotes.filter(n => n.id !== id);
      return {
        openNotes: remaining,
        selectedNoteId: state.selectedNoteId === id 
          ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
          : state.selectedNoteId,
      };
    }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    navigateBack: () => set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        historyIndex: newIndex,
        selectedNoteId: state.noteHistory[newIndex],
      };
    }),

    navigateForward: () => set((state) => {
      if (state.historyIndex >= state.noteHistory.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        historyIndex: newIndex,
        selectedNoteId: state.noteHistory[newIndex],
      };
    }),
  }))
);
