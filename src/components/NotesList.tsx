import { Search, Plus, ChevronLeft, ChevronRight, Star, Trash2, Archive, RotateCcw, MoreHorizontal, ArrowUpDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchiveNote: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeSection: string;
}

export const NotesList = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onAddNote,
  onDeleteNote,
  onRestoreNote,
  onToggleFavorite,
  onArchiveNote,
  searchQuery,
  onSearchChange,
  activeSection,
}: NotesListProps) => {
  // Strip HTML tags from preview text
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '-');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full bg-notesList flex flex-col border-r border-border">
      {/* Search Header */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search in Notes"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-muted/30 border border-border rounded-md py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-primary uppercase tracking-wide">Recent</span>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add Note & Navigation */}
      <div className="flex items-center gap-2 px-3 py-1">
        <button 
          onClick={onAddNote}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
        >
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
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              TIP
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {activeSection === "trash" 
                ? "Trash is empty"
                : activeSection === "archive"
                ? "No archived notes"
                : activeSection === "favorites"
                ? "No favorite notes yet"
                : "We value your feedback so join us on Discord and share your experiences and ideas."}
            </p>
            {activeSection !== "trash" && activeSection !== "archive" && (
              <button
                onClick={onAddNote}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm py-2 px-3"
              >
                Add a note <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {notes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "group w-full text-left px-3 py-2 rounded transition-colors cursor-pointer",
                  selectedNoteId === note.id
                    ? "bg-primary/10"
                    : "hover:bg-muted/30"
                )}
                onClick={() => onNoteSelect(note.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Date */}
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] text-primary font-medium">
                        {formatDate(note.createdAt)}
                      </span>
                      {note.isFavorite && (
                        <Star className="w-3 h-3 text-primary fill-primary" />
                      )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {note.title || "Untitled"}
                    </h3>
                    
                    {/* Preview */}
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {stripHtml(note.preview) || "No content"}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {activeSection === "trash" ? (
                        <>
                          <DropdownMenuItem onClick={() => onRestoreNote(note.id)}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteNote(note.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Forever
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => onToggleFavorite(note.id)}>
                            <Star className={cn("w-4 h-4 mr-2", note.isFavorite && "fill-current")} />
                            {note.isFavorite ? "Remove Favorite" : "Add to Favorites"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onArchiveNote(note.id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteNote(note.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Move to Trash
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
