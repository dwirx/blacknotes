import { Hash, Plus, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Tag {
  id: string;
  name: string;
  noteCount: number;
}

interface TagsViewProps {
  tags: Tag[];
  selectedTagId: string | null;
  onTagSelect: (id: string) => void;
  onAddTag: () => void;
  onDeleteTag: (id: string) => void;
  onRenameTag: (id: string) => void;
}

export const TagsView = ({
  tags,
  selectedTagId,
  onTagSelect,
  onAddTag,
  onDeleteTag,
  onRenameTag,
}: TagsViewProps) => {
  return (
    <div className="w-full h-full bg-sidebar flex flex-col border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">Tags</span>
        <button
          onClick={onAddTag}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Add tag"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Filter tags..."
          className="w-full bg-muted/50 border border-border rounded-md py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Tags List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              TIP
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Hold Ctrl/Cmd & click on multiple items to select them.
            </p>
            <button
              onClick={onAddTag}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm py-2 px-4"
            >
              Add a tag <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                  selectedTagId === tag.id
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                onClick={() => onTagSelect(tag.id)}
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-sm truncate">{tag.name}</span>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                    selectedTagId === tag.id
                      ? "bg-primary-foreground/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tag.noteCount}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "p-1 rounded hover:bg-muted/50 transition-all",
                        selectedTagId === tag.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => onRenameTag(tag.id)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteTag(tag.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
