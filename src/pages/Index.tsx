import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotesDB, useNotebooksDB, useTagsDB } from "@/hooks/useDB";
import { Sidebar } from "@/components/Sidebar";
import { MiniSidebar } from "@/components/MiniSidebar";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";
import { NoteTabs } from "@/components/NoteTabs";
import { AppSettings } from "@/components/AppSettings";
import { BlackNotesLogo } from "@/components/BlackNotesLogo";
import NotesImportExport from "@/components/ImportExportNotes";
import { useToast } from "@/hooks/use-toast";
import { 
  Menu, 
  X, 
  PanelLeft, 
  Plus, 
  PanelRight, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Maximize2, 
  Undo, 
  Redo, 
  Cloud, 
  List, 
  MoreVertical,
  ArrowUpDown,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVaultStore } from "@/stores/vaultStore";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

type SidebarTab = "home" | "notebooks" | "tags";

interface Note {
  id: string;
  vaultId?: string;
  title: string;
  content: string;
  preview: string;
  createdAt: Date;
  updatedAt?: Date;
  tags: string[];
  isFavorite: boolean;
  section: string;
  notebookId?: string;
  order?: number;
}

interface Notebook {
  id: string;
  vaultId?: string;
  name: string;
  noteCount: number;
  createdAt?: Date;
}

interface Tag {
  id: string;
  vaultId?: string;
  name: string;
  noteCount: number;
  createdAt?: Date;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState("notes");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("home");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<{ id: string; title: string }[]>([]);
  const [noteHistory, setNoteHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesListOpen, setNotesListOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesListCollapsed, setNotesListCollapsed] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const navigate = useNavigate();
  const { noteId } = useParams<{ noteId?: string }>();
  
  // Notebooks state
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  
  // Tags state
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { vaultId } = useVaultStore();

  const navigateToNote = useCallback(
    (targetNoteId: string | null, options?: { replace?: boolean }) => {
      if (targetNoteId) {
        navigate(`/vault/note/${targetNoteId}`, { replace: options?.replace ?? false });
        return;
      }
      navigate('/', { replace: options?.replace ?? false });
    },
    [navigate]
  );

  // IndexedDB hooks
  const { loadNotes, saveNote, saveNotes, deleteNote: deleteNoteFromDB, isLoading, isSyncing } = useNotesDB();
  const { loadNotebooks, saveNotebook, deleteNotebook: deleteNotebookFromDB } = useNotebooksDB();
  const { loadTags, saveTag, deleteTag: deleteTagFromDB } = useTagsDB();

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setNotesLoaded(false);
        const [loadedNotes, loadedNotebooks, loadedTags] = await Promise.all([
          loadNotes(),
          loadNotebooks(),
          loadTags(),
        ]);

        setNotes(loadedNotes);
        setNotebooks(loadedNotebooks);
        setAllTags(loadedTags);

        console.log(`✅ Loaded ${loadedNotes.length} notes from IndexedDB`);
        console.log(`✅ Loaded ${loadedNotebooks.length} notebooks from IndexedDB`);
        console.log(`✅ Loaded ${loadedTags.length} tags from IndexedDB`);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setNotesLoaded(true);
      }
    };

    loadData();
  }, [loadNotes, loadNotebooks, loadTags]);

  // Auto-save notes to IndexedDB when they change
  useEffect(() => {
    if (notes.length > 0 && !isLoading) {
      saveNotes(notes);
    }
  }, [notes]);

  // Auto-save notebooks when they change
  useEffect(() => {
    if (notebooks.length > 0 && !isLoading) {
      notebooks.forEach(notebook => saveNotebook(notebook));
    }
  }, [notebooks]);

  // Auto-save tags when they change
  useEffect(() => {
    if (allTags.length > 0 && !isLoading) {
      allTags.forEach(tag => saveTag(tag));
    }
  }, [allTags]);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      let matchesSection = false;

      if (activeSection === "favorites") {
        matchesSection = note.isFavorite && note.section !== "trash";
      } else {
        matchesSection = note.section === activeSection;
      }

      const matchesSearch =
        note.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [notes, activeSection, debouncedSearchQuery]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const noteCounts = {
    notes: notes.filter((n) => n.section === "notes").length,
    favorites: notes.filter((n) => n.isFavorite && n.section !== "trash").length,
    reminders: notes.filter((n) => n.section === "reminders").length,
    monographs: notes.filter((n) => n.section === "monographs").length,
    trash: notes.filter((n) => n.section === "trash").length,
    archive: notes.filter((n) => n.section === "archive").length,
  };

  // Update tag counts from notes
  const getTagsWithCounts = useCallback(() => {
    const tagCounts: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts).map(([name, count], index) => ({
      id: `tag-${index}`,
      name,
      noteCount: count,
    }));
  }, [notes]);

  const handleAddNote = useCallback(() => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      vaultId: vaultId ?? undefined,
      title: "",
      content: "",
      preview: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      isFavorite: false,
      section: activeSection === "trash" || activeSection === "archive" || activeSection === "favorites"
        ? "notes"
        : activeSection,
      order: notes.length,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    
    // Add to open tabs
    setOpenNotes((prev) => {
      if (!prev.find(n => n.id === newNote.id)) {
        return [...prev, { id: newNote.id, title: newNote.title || "Untitled" }];
      }
      return prev;
    });
    
    // Add to history
    setNoteHistory(prev => [...prev.slice(0, historyIndex + 1), newNote.id]);
    setHistoryIndex(prev => prev + 1);

    navigateToNote(newNote.id);
    
    // On mobile, close notes list when opening editor
    if (window.innerWidth < 768) {
      setNotesListOpen(false);
    }
    toast({
      title: "Note created",
      description: "New note has been created successfully.",
    });
  }, [activeSection, toast, historyIndex, navigateToNote, vaultId]);

  const handleNoteChange = useCallback((updatedNote: { id: string; title: string; content: string; tags: string[] }) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === updatedNote.id
          ? {
              ...note,
              title: updatedNote.title,
              content: updatedNote.content,
              tags: updatedNote.tags,
              preview: updatedNote.content.substring(0, 100),
            }
          : note
      )
    );
    
    // Update open tabs title
    setOpenNotes((prev) =>
      prev.map((n) =>
        n.id === updatedNote.id ? { ...n, title: updatedNote.title || "Untitled" } : n
      )
    );
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (note.section === "trash") {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setOpenNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        navigateToNote(null, { replace: true });
      }
      toast({
        title: "Note deleted permanently",
        description: "The note has been permanently deleted.",
      });
    } else {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, section: "trash" } : n
        )
      );
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        navigateToNote(null, { replace: true });
      }
      toast({
        title: "Note moved to trash",
        description: "The note has been moved to trash.",
      });
    }
  }, [notes, selectedNoteId, toast, navigateToNote]);

  const handleRestoreNote = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, section: "notes" } : n
      )
    );
    toast({
      title: "Note restored",
      description: "The note has been restored from trash.",
    });
  }, [toast]);

  const handleToggleFavorite = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
      )
    );
  }, []);

  const handleArchiveNote = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, section: "archive" } : n
      )
    );
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      navigateToNote(null, { replace: true });
    }
    toast({
      title: "Note archived",
      description: "The note has been moved to archive.",
    });
  }, [selectedNoteId, toast, navigateToNote]);

  const handleCloseNote = useCallback(() => {
    setSelectedNoteId(null);
    navigateToNote(null);
    // On mobile, show notes list when closing editor
    if (window.innerWidth < 768) {
      setNotesListOpen(true);
    }
  }, [navigateToNote]);

  const handleNoteSelect = useCallback(
    (noteId: string, options?: { skipNavigation?: boolean; skipHistory?: boolean }) => {
      setSelectedNoteId(noteId);
      
      // Find the note for title
      const note = notes.find(n => n.id === noteId);
      
      // Add to open tabs if not already open
      setOpenNotes((prev) => {
        if (!prev.find(n => n.id === noteId)) {
          return [...prev, { id: noteId, title: note?.title || "Untitled" }];
        }
        return prev;
      });
      
      // Add to history
      if (!options?.skipHistory) {
        setNoteHistory(prev => [...prev.slice(0, historyIndex + 1), noteId]);
        setHistoryIndex(prev => prev + 1);
      }

      if (!options?.skipNavigation) {
        navigateToNote(noteId);
      }
      
      // On mobile, close notes list when selecting a note
      if (window.innerWidth < 768) {
        setNotesListOpen(false);
      }
    },
    [notes, historyIndex, navigateToNote]
  );

  // Open note from URL param when available
  useEffect(() => {
    if (!noteId || !notesLoaded) {
      return;
    }

    const noteExists = notes.some((note) => note.id === noteId);
    if (!noteExists) {
      if (notes.length > 0) {
        toast({
          title: "Catatan tidak tersedia",
          description: "Catatan ini tidak ada di vault ini atau sudah dihapus.",
          variant: "destructive",
        });
      }
      navigateToNote(null, { replace: true });
      return;
    }

    if (selectedNoteId !== noteId) {
      handleNoteSelect(noteId, { skipNavigation: true });
    }
  }, [noteId, notesLoaded, notes, selectedNoteId, toast, handleNoteSelect, navigateToNote]);

  // Clear selection when returning to root route
  useEffect(() => {
    if (noteId || !selectedNoteId) return;
    setSelectedNoteId(null);
    setNotesListOpen(true);
  }, [noteId, selectedNoteId]);

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  }, []);

  const handleTabClose = useCallback((noteId: string) => {
    setOpenNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (selectedNoteId === noteId) {
      // Select the previous tab or null
      const remainingNotes = openNotes.filter(n => n.id !== noteId);
      if (remainingNotes.length > 0) {
        const nextId = remainingNotes[remainingNotes.length - 1].id;
        setSelectedNoteId(nextId);
        navigateToNote(nextId, { replace: true });
      } else {
        setSelectedNoteId(null);
        navigateToNote(null, { replace: true });
      }
    }
  }, [openNotes, selectedNoteId, navigateToNote]);

  const handleNavigateBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const nextId = noteHistory[newIndex];
      setSelectedNoteId(nextId);
      navigateToNote(nextId, { replace: true });
    }
  }, [historyIndex, noteHistory, navigateToNote]);

  const handleNavigateForward = useCallback(() => {
    if (historyIndex < noteHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextId = noteHistory[newIndex];
      setSelectedNoteId(nextId);
      navigateToNote(nextId, { replace: true });
    }
  }, [historyIndex, noteHistory, navigateToNote]);

  // Notebook handlers
  const handleAddNotebook = useCallback(() => {
    const name = prompt("Enter notebook name:");
    if (name) {
      const newNotebook: Notebook = {
        id: crypto.randomUUID(),
        vaultId: vaultId ?? undefined,
        name,
        noteCount: 0,
      };
      setNotebooks((prev) => [...prev, newNotebook]);
      toast({
        title: "Notebook created",
        description: `"${name}" has been created.`,
      });
    }
  }, [toast, vaultId]);

  const handleDeleteNotebook = useCallback((notebookId: string) => {
    setNotebooks((prev) => prev.filter((n) => n.id !== notebookId));
    if (selectedNotebookId === notebookId) {
      setSelectedNotebookId(null);
    }
    toast({
      title: "Notebook deleted",
      description: "The notebook has been deleted.",
    });
  }, [selectedNotebookId, toast]);

  const handleRenameNotebook = useCallback((notebookId: string) => {
    const notebook = notebooks.find(n => n.id === notebookId);
    const newName = prompt("Enter new name:", notebook?.name);
    if (newName) {
      setNotebooks((prev) =>
        prev.map((n) =>
          n.id === notebookId ? { ...n, name: newName } : n
        )
      );
    }
  }, [notebooks]);

  // Tag handlers
  const handleAddTag = useCallback(() => {
    const name = prompt("Enter tag name:");
    if (name) {
      const newTag: Tag = {
        id: crypto.randomUUID(),
        vaultId: vaultId ?? undefined,
        name,
        noteCount: 0,
      };
      setAllTags((prev) => [...prev, newTag]);
      toast({
        title: "Tag created",
        description: `"${name}" has been created.`,
      });
    }
  }, [toast, vaultId]);

  const handleDeleteTag = useCallback((tagId: string) => {
    setAllTags((prev) => prev.filter((t) => t.id !== tagId));
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
    }
    toast({
      title: "Tag deleted",
      description: "The tag has been deleted.",
    });
  }, [selectedTagId, toast]);

  const handleRenameTag = useCallback((tagId: string) => {
    const tag = allTags.find(t => t.id === tagId);
    const newName = prompt("Enter new name:", tag?.name);
    if (newName) {
      setAllTags((prev) =>
        prev.map((t) =>
          t.id === tagId ? { ...t, name: newName } : t
        )
      );
    }
  }, [allTags]);

  // Import notes handler
  const handleImportNotes = useCallback((importedNotes: Note[]) => {
    setNotes((prev) => [...importedNotes, ...prev]);
  }, []);

  // Compute tags from notes
  const computedTags = getTagsWithCounts();
  const displayTags = allTags.length > 0 ? allTags : computedTags;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bg-background border-b border-border safe-area-inset">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-foreground hover:bg-muted transition-colors active:bg-muted/80"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BlackNotesLogo size="sm" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddNote}
            className="p-2 rounded-md text-primary hover:bg-primary/10 transition-colors"
            aria-label="Add note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile/Tablet */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed z-50 h-full w-[220px] transition-transform duration-300 ease-in-out bg-sidebar",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          noteCounts={noteCounts}
          onClose={() => setSidebarOpen(false)}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          notebooks={notebooks}
          tags={displayTags}
          selectedNotebookId={selectedNotebookId}
          selectedTagId={selectedTagId}
          onNotebookSelect={setSelectedNotebookId}
          onTagSelect={setSelectedTagId}
          onAddNotebook={handleAddNotebook}
          onAddTag={handleAddTag}
        />
      </div>

      {/* Desktop Layout with Resizable Panels */}
      <div className="hidden lg:flex flex-1 h-full flex-col">
        {/* Global Tabs Bar */}
        <div className="flex items-center bg-background border-b border-border min-h-[44px] flex-shrink-0">
          {/* Left side - Search (above notes list area) */}
          <div className="flex items-center min-w-[200px] max-w-[300px] px-3 border-r border-border">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search in Notes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Center - Add button, navigation, and tabs */}
          <div className="flex-1 flex items-center min-w-0">
            {/* Add and Nav buttons */}
            <div className="flex items-center gap-0.5 px-2 flex-shrink-0">
              <button
                onClick={handleAddNote}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Add new note"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleNavigateBack}
                disabled={historyIndex <= 0}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  historyIndex > 0
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                    : "text-muted-foreground/30 cursor-not-allowed"
                )}
                title="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNavigateForward}
                disabled={historyIndex >= noteHistory.length - 1}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  historyIndex < noteHistory.length - 1
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                    : "text-muted-foreground/30 cursor-not-allowed"
                )}
                title="Go forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex-1 flex items-center overflow-x-auto scrollbar-none min-w-0">
              {openNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer transition-colors group min-w-0 max-w-[180px]",
                    selectedNoteId === note.id
                      ? "bg-editor text-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => handleNoteSelect(note.id)}
                >
                  <FileText className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="text-sm truncate">{note.title || "Untitled"}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabClose(note.id);
                    }}
                    className="p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-0.5 px-2 flex-shrink-0 border-l border-border">
            <NotesImportExport 
              notes={notes} 
              onImportNotes={handleImportNotes}
              selectedNote={selectedNote}
            />
            <AppSettings autoSaveDelay={500} searchDelay={300} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mini Sidebar when collapsed */}
          {sidebarCollapsed && (
            <MiniSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
              onExpand={() => setSidebarCollapsed(false)}
            />
          )}

          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Sidebar Panel */}
            {!sidebarCollapsed && (
              <>
                <ResizablePanel 
                  defaultSize={15} 
                  minSize={10} 
                  maxSize={25}
                  className="min-w-0"
                >
                  <div className="h-full">
                    <Sidebar
                      activeSection={activeSection}
                      onSectionChange={handleSectionChange}
                      noteCounts={noteCounts}
                      onClose={() => setSidebarOpen(false)}
                      activeTab={sidebarTab}
                      onTabChange={setSidebarTab}
                      notebooks={notebooks}
                      tags={displayTags}
                      selectedNotebookId={selectedNotebookId}
                      selectedTagId={selectedTagId}
                      onNotebookSelect={setSelectedNotebookId}
                      onTagSelect={setSelectedTagId}
                      onAddNotebook={handleAddNotebook}
                      onAddTag={handleAddTag}
                      onCollapse={() => setSidebarCollapsed(true)}
                      isCollapsible={true}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* Notes List Panel */}
            {!notesListCollapsed && (
              <>
                <ResizablePanel 
                  defaultSize={25} 
                  minSize={15} 
                  maxSize={40}
                  className="min-w-0"
                >
                  <div className="h-full flex flex-col">
                    {/* Notes List Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">Recent</span>
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Sort">
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="View">
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setNotesListCollapsed(true)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors" 
                          title="Hide Recent"
                        >
                          <PanelLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Notes List */}
                    <div className="flex-1 overflow-hidden">
                      <NotesList
                        notes={filteredNotes}
                        selectedNoteId={selectedNoteId}
                        onNoteSelect={handleNoteSelect}
                        onAddNote={handleAddNote}
                        onDeleteNote={handleDeleteNote}
                        onRestoreNote={handleRestoreNote}
                        onToggleFavorite={handleToggleFavorite}
                        onArchiveNote={handleArchiveNote}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeSection={activeSection}
                        hideSearch={true}
                        onReorderNotes={(activeId, overId) => {
                          setNotes((prev) => {
                            const activeIndex = prev.findIndex(n => n.id === activeId);
                            const overIndex = prev.findIndex(n => n.id === overId);
                            if (activeIndex === -1 || overIndex === -1) return prev;
                            const newNotes = [...prev];
                            const [removed] = newNotes.splice(activeIndex, 1);
                            newNotes.splice(overIndex, 0, removed);
                            return newNotes;
                          });
                        }}
                      />
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

          {/* Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={30} className="min-w-0">
            <div className="h-full flex flex-col">
              {/* Show expand buttons when notes list is collapsed */}
              {notesListCollapsed && (
                <div className="flex items-center gap-1 px-3 py-2 bg-muted/30 border-b border-border">
                  <button
                    onClick={() => setNotesListCollapsed(false)}
                    className="flex items-center gap-2 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
                    title="Show Recent notes list"
                  >
                    <PanelRight className="w-3.5 h-3.5" />
                    <span>Show Recent</span>
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <NoteEditor
                  note={selectedNote ? {
                    id: selectedNote.id,
                    title: selectedNote.title,
                    content: selectedNote.content,
                    tags: selectedNote.tags,
                    isFavorite: selectedNote.isFavorite,
                  } : null}
                  onNoteChange={handleNoteChange}
                  onClose={handleCloseNote}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteNote}
                  onBack={() => {
                    setNotesListOpen(true);
                    navigateToNote(null);
                  }}
                  onAddNote={handleAddNote}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        </div>
      </div>

      {/* Mobile/Tablet Content */}
      <div className="lg:hidden flex-1 flex flex-col pt-12 overflow-hidden min-w-0">

        <div className="flex-1 flex flex-row overflow-hidden">
          {/* Notes List */}
          <div className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 w-full sm:w-[280px] md:w-[320px]",
            notesListOpen ? "block" : "hidden",
            selectedNoteId ? "hidden sm:block" : "block"
          )}>
            <NotesList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={handleNoteSelect}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onRestoreNote={handleRestoreNote}
              onToggleFavorite={handleToggleFavorite}
              onArchiveNote={handleArchiveNote}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeSection={activeSection}
              onReorderNotes={(activeId, overId) => {
                setNotes((prev) => {
                  const activeIndex = prev.findIndex(n => n.id === activeId);
                  const overIndex = prev.findIndex(n => n.id === overId);
                  if (activeIndex === -1 || overIndex === -1) return prev;
                  const newNotes = [...prev];
                  const [removed] = newNotes.splice(activeIndex, 1);
                  newNotes.splice(overIndex, 0, removed);
                  return newNotes;
                });
              }}
            />
          </div>

          {/* Note Editor */}
          <div className={cn(
            "flex-1 min-w-0",
            selectedNoteId ? "block" : "hidden sm:block"
          )}>
            <NoteEditor
              note={selectedNote ? {
                id: selectedNote.id,
                title: selectedNote.title,
                content: selectedNote.content,
                tags: selectedNote.tags,
                isFavorite: selectedNote.isFavorite,
              } : null}
              onNoteChange={handleNoteChange}
              onClose={handleCloseNote}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteNote}
              onBack={() => {
                setSelectedNoteId(null);
                setNotesListOpen(true);
                navigateToNote(null);
              }}
              onAddNote={handleAddNote}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
