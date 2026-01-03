import { X, Plus, ChevronLeft, ChevronRight, FileText, Image, Undo, Redo, Maximize2, List, Search, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenNote {
  id: string;
  title: string;
}

interface NoteTabsProps {
  openNotes: OpenNote[];
  activeNoteId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onAddNote: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export const NoteTabs = ({
  openNotes,
  activeNoteId,
  onTabSelect,
  onTabClose,
  onAddNote,
  onNavigateBack,
  onNavigateForward,
  canGoBack,
  canGoForward,
}: NoteTabsProps) => {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-background border-b border-border">
      {/* Left side - Add button and navigation */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={onAddNote}
          className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
          title="Add new note"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onNavigateBack}
          disabled={!canGoBack}
          className={cn(
            "p-1.5 rounded transition-colors",
            canGoBack
              ? "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          title="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNavigateForward}
          disabled={!canGoForward}
          className={cn(
            "p-1.5 rounded transition-colors",
            canGoForward
              ? "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          title="Go forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
        {openNotes.map((note) => (
          <div
            key={note.id}
            className={cn(
              "group flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors max-w-[140px] flex-shrink-0",
              activeNoteId === note.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => onTabSelect(note.id)}
          >
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span className="truncate flex-1">{note.title || "Untitled"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(note.id);
              }}
              className={cn(
                "flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors",
                activeNoteId === note.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              title="Close tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Insert image">
          <Image className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Undo">
          <Undo className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Redo">
          <Redo className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Fullscreen">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="View options">
          <List className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Search">
          <Search className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="More options">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
