import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";
import { useToast } from "@/hooks/use-toast";

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
      // Permanent delete
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
      toast({
        title: "Note deleted permanently",
        description: "The note has been permanently deleted.",
      });
    } else {
      // Move to trash
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
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        noteCounts={noteCounts}
      />
      <NotesList
        notes={filteredNotes}
        selectedNoteId={selectedNoteId}
        onNoteSelect={setSelectedNoteId}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onRestoreNote={handleRestoreNote}
        onToggleFavorite={handleToggleFavorite}
        onArchiveNote={handleArchiveNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeSection={activeSection}
      />
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
      />
    </div>
  );
};

export default Index;
