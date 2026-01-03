import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  tags: string[];
  isFavorite: boolean;
}

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onAddNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const NotesList = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onAddNote,
  searchQuery,
  onSearchChange,
}: NotesListProps) => {
  return (
    <div className="w-[300px] h-screen bg-notesList flex flex-col border-r border-border">
      {/* Search Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search in Notes"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-md py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              TIP
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Hold Ctrl/Cmd & click on multiple items to select them.
            </p>
            <button
              onClick={onAddNote}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
            >
              Add a note <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onNoteSelect(note.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md transition-colors",
                  selectedNoteId === note.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50"
                )}
              >
                <h3 className="text-sm font-medium text-foreground truncate">
                  {note.title || "Untitled"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {note.preview || "No content"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {note.createdAt.toLocaleDateString()}
                  </span>
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
