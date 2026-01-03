import { Plus, ChevronLeft, ChevronRight, Undo, Redo, Cloud, Search, MoreVertical, X, FileText, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenNote {
  id: string;
  title: string;
}

interface NoteTabsProps {
  onAddNote: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onCollapseList?: () => void;
  openNotes?: OpenNote[];
  selectedNoteId?: string | null;
  onTabSelect?: (id: string) => void;
  onTabClose?: (id: string) => void;
}

export const NoteTabs = ({
  onAddNote,
  onNavigateBack,
  onNavigateForward,
  canGoBack,
  canGoForward,
  onCollapseList,
  openNotes = [],
  selectedNoteId,
  onTabSelect,
  onTabClose,
}: NoteTabsProps) => {
  return (
    <div className="flex items-center bg-background border-b border-border min-h-[40px]">
      {/* Left side - Add button and navigation */}
      <div className="flex items-center gap-0.5 px-2 flex-shrink-0 border-r border-border">
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
              ? "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              ? "text-muted-foreground hover:text-foreground hover:bg-muted"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          title="Go forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Area */}
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
            onClick={() => onTabSelect?.(note.id)}
          >
            <FileText className="w-4 h-4 flex-shrink-0 text-primary" />
            <span className="text-sm truncate">{note.title || "Untitled"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose?.(note.id);
              }}
              className="p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Close tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-0.5 px-2 flex-shrink-0 border-l border-border">
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Fullscreen">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Undo">
          <Undo className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Redo">
          <Redo className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Sync">
          <Cloud className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Search">
          <Search className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="More options">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
