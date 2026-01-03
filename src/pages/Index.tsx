import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";
import { NoteTabs } from "@/components/NoteTabs";
import { useToast } from "@/hooks/use-toast";
import { Menu, X, PanelLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

type SidebarTab = "home" | "notebooks" | "tags";

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
}

interface Notebook {
  id: string;
  name: string;
  noteCount: number;
}

interface Tag {
  id: string;
  name: string;
  noteCount: number;
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
  
  // Notebooks state
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  
  // Tags state
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const filteredNotes = notes.filter((note) => {
    let matchesSection = false;
    
    if (activeSection === "favorites") {
      matchesSection = note.isFavorite && note.section !== "trash";
    } else {
      matchesSection = note.section === activeSection;
    }
    
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

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
      title: "",
      content: "",
      preview: "",
      createdAt: new Date(),
      tags: [],
      isFavorite: false,
      section: activeSection === "trash" || activeSection === "archive" || activeSection === "favorites" 
        ? "notes" 
        : activeSection,
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
    
    // On mobile, close notes list when opening editor
    if (window.innerWidth < 768) {
      setNotesListOpen(false);
    }
    toast({
      title: "Note created",
      description: "New note has been created successfully.",
    });
  }, [activeSection, toast, historyIndex]);

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
      }
      toast({
        title: "Note moved to trash",
        description: "The note has been moved to trash.",
      });
    }
  }, [notes, selectedNoteId, toast]);

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
    }
    toast({
      title: "Note archived",
      description: "The note has been moved to archive.",
    });
  }, [selectedNoteId, toast]);

  const handleCloseNote = useCallback(() => {
    setSelectedNoteId(null);
    // On mobile, show notes list when closing editor
    if (window.innerWidth < 768) {
      setNotesListOpen(true);
    }
  }, []);

  const handleNoteSelect = useCallback((noteId: string) => {
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
    setNoteHistory(prev => [...prev.slice(0, historyIndex + 1), noteId]);
    setHistoryIndex(prev => prev + 1);
    
    // On mobile, close notes list when selecting a note
    if (window.innerWidth < 768) {
      setNotesListOpen(false);
    }
  }, [notes, historyIndex]);

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
        setSelectedNoteId(remainingNotes[remainingNotes.length - 1].id);
      } else {
        setSelectedNoteId(null);
      }
    }
  }, [openNotes, selectedNoteId]);

  const handleNavigateBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSelectedNoteId(noteHistory[newIndex]);
    }
  }, [historyIndex, noteHistory]);

  const handleNavigateForward = useCallback(() => {
    if (historyIndex < noteHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSelectedNoteId(noteHistory[newIndex]);
    }
  }, [historyIndex, noteHistory]);

  // Notebook handlers
  const handleAddNotebook = useCallback(() => {
    const name = prompt("Enter notebook name:");
    if (name) {
      const newNotebook: Notebook = {
        id: crypto.randomUUID(),
        name,
        noteCount: 0,
      };
      setNotebooks((prev) => [...prev, newNotebook]);
      toast({
        title: "Notebook created",
        description: `"${name}" has been created.`,
      });
    }
  }, [toast]);

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
        name,
        noteCount: 0,
      };
      setAllTags((prev) => [...prev, newTag]);
      toast({
        title: "Tag created",
        description: `"${name}" has been created.`,
      });
    }
  }, [toast]);

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

  // Compute tags from notes
  const computedTags = getTagsWithCounts();
  const displayTags = allTags.length > 0 ? allTags : computedTags;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-foreground hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">N</span>
            </div>
            <span className="font-semibold text-foreground text-sm">Notesnook</span>
          </div>
        </div>
        <button
          onClick={() => setNotesListOpen(!notesListOpen)}
          className={cn(
            "p-2 rounded-md transition-colors",
            notesListOpen ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted"
          )}
        >
          {notesListOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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
        "lg:hidden fixed z-50 h-full transition-transform duration-300 ease-in-out",
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
      <div className="hidden lg:flex flex-1 h-full">
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
              <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />
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
                  {/* Tabs Bar */}
                  <NoteTabs
                    onAddNote={handleAddNote}
                    onNavigateBack={handleNavigateBack}
                    onNavigateForward={handleNavigateForward}
                    canGoBack={historyIndex > 0}
                    canGoForward={historyIndex < noteHistory.length - 1}
                  />
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
              <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />
            </>
          )}

          {/* Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={30} className="min-w-0">
            <div className="h-full flex flex-col">
              {/* Show expand buttons when panels are collapsed */}
              {(sidebarCollapsed || notesListCollapsed) && (
                <div className="flex items-center gap-1 px-2 py-1 bg-background border-b border-border">
                  {sidebarCollapsed && (
                    <button
                      onClick={() => setSidebarCollapsed(false)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Show sidebar"
                    >
                      <PanelLeft className="w-4 h-4" />
                    </button>
                  )}
                  {notesListCollapsed && (
                    <button
                      onClick={() => setNotesListCollapsed(false)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Show notes list"
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                  )}
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
                  onBack={() => setNotesListOpen(true)}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile/Tablet Content */}
      <div className="lg:hidden flex-1 flex flex-col pt-14 overflow-hidden min-w-0">
        {/* Mobile Add Button - Fixed */}
        <div className="flex items-center gap-2 px-3 py-2 bg-background border-b border-border">
          <button
            onClick={handleAddNote}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground flex-1">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </span>
        </div>

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
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
