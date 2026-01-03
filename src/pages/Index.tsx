import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";
import { useToast } from "@/hooks/use-toast";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  preview: string;
  createdAt: Date;
  tags: string[];
  isFavorite: boolean;
  section: string;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesListOpen, setNotesListOpen] = useState(true);
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
    // On mobile, close notes list when opening editor
    if (window.innerWidth < 768) {
      setNotesListOpen(false);
    }
    toast({
      title: "Note created",
      description: "New note has been created successfully.",
    });
  }, [activeSection, toast]);

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
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (note.section === "trash") {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
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
    // On mobile, close notes list when selecting a note
    if (window.innerWidth < 768) {
      setNotesListOpen(false);
    }
  }, []);

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground">Notesnook</span>
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

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed md:relative z-50 md:z-0 h-full transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          noteCounts={noteCounts}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row pt-14 md:pt-0 overflow-hidden">
        {/* Notes List */}
        <div className={cn(
          "md:block transition-all duration-300 ease-in-out overflow-hidden",
          notesListOpen ? "flex-shrink-0" : "hidden md:hidden",
          selectedNoteId && window.innerWidth < 768 ? "hidden" : ""
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
          />
        </div>

        {/* Note Editor */}
        <div className={cn(
          "flex-1 min-w-0",
          !selectedNoteId && window.innerWidth < 768 ? "hidden md:block" : ""
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
            onBack={() => setNotesListOpen(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
