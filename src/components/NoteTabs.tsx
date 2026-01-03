import { Plus, ChevronLeft, ChevronRight, Image, Undo, Redo, Maximize2, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteTabsProps {
  onAddNote: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onCollapseList?: () => void;
}

export const NoteTabs = ({
  onAddNote,
  onNavigateBack,
  onNavigateForward,
  canGoBack,
  canGoForward,
  onCollapseList,
}: NoteTabsProps) => {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-background border-b border-border">
      {/* Left side - Add button and navigation */}
      <div className="flex items-center gap-1 flex-shrink-0">
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

      {/* Right side - Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
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
        {onCollapseList && (
          <button 
            onClick={onCollapseList}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" 
            title="Hide notes list"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
