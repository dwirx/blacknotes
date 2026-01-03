import { Search, Plus, Star, Trash2, Archive, RotateCcw, MoreHorizontal, ArrowUpDown, LayoutGrid, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, memo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Virtuoso } from "react-virtuoso";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
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
  onReorderNotes?: (activeId: string, overId: string) => void;
  hideSearch?: boolean;
}

interface SortableNoteItemProps {
  note: Note;
  selectedNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchiveNote: (id: string) => void;
  activeSection: string;
  formatDate: (date: Date) => string;
  stripHtml: (html: string) => string;
}

const SortableNoteItem = ({
  note,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote,
  onRestoreNote,
  onToggleFavorite,
  onArchiveNote,
  activeSection,
  formatDate,
  stripHtml,
}: SortableNoteItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group w-full text-left px-2 py-2 rounded transition-colors cursor-pointer",
        selectedNoteId === note.id
          ? "bg-primary/10"
          : "hover:bg-muted/30",
        isDragging && "z-50 shadow-lg"
      )}
      onClick={() => onNoteSelect(note.id)}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle - touch friendly */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 p-2 -ml-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground active:text-primary transition-colors flex-shrink-0 touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

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
          <DropdownMenuContent align="end" className="w-44 bg-popover">
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
  );
};

export const NotesList = memo(({
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
  onReorderNotes,
  hideSearch = false,
}: NotesListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stripHtml = useCallback((html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorderNotes) {
      onReorderNotes(active.id as string, over.id as string);
    }
  }, [onReorderNotes]);

  return (
    <div className="w-full h-full bg-notesList flex flex-col border-r border-border">
      {/* Search Header - only show if hideSearch is false */}
      {!hideSearch && (
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
      )}

      {/* Section Header - only show if hideSearch is false */}
      {!hideSearch && (
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
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-hidden px-1">
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={notes.map(n => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <Virtuoso
                style={{ height: "100%" }}
                data={notes}
                itemContent={(index, note) => (
                  <SortableNoteItem
                    key={note.id}
                    note={note}
                    selectedNoteId={selectedNoteId}
                    onNoteSelect={onNoteSelect}
                    onDeleteNote={onDeleteNote}
                    onRestoreNote={onRestoreNote}
                    onToggleFavorite={onToggleFavorite}
                    onArchiveNote={onArchiveNote}
                    activeSection={activeSection}
                    formatDate={formatDate}
                    stripHtml={stripHtml}
                  />
                )}
              />
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
});

NotesList.displayName = 'NotesList';

