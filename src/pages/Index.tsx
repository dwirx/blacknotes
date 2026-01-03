import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";

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

  const filteredNotes = notes.filter((note) => {
    const matchesSection = note.section === activeSection;
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const noteCounts = {
    notes: notes.filter((n) => n.section === "notes").length,
    favorites: notes.filter((n) => n.isFavorite).length,
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
      section: activeSection === "trash" || activeSection === "archive" ? "notes" : activeSection,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  }, [activeSection]);

  const handleNoteChange = useCallback((updatedNote: { id: string; title: string; content: string; tags: string[] }) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === updatedNote.id
          ? {
              ...note,
              ...updatedNote,
              preview: updatedNote.content.substring(0, 100),
            }
          : note
      )
    );
  }, []);

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <NoteEditor
        note={selectedNote ? {
          id: selectedNote.id,
          title: selectedNote.title,
          content: selectedNote.content,
          tags: selectedNote.tags,
        } : null}
        onNoteChange={handleNoteChange}
        onClose={handleCloseNote}
      />
    </div>
  );
};

export default Index;
