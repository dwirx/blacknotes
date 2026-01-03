import {
  FileText,
  Star,
  Bell,
  BookOpen,
  Trash2,
  Archive,
  Hash,
  Settings,
  X,
  Home,
  FolderOpen,
  SlidersHorizontal,
  Plus,
  Notebook,
  PanelLeftClose,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { AppSettings } from "./AppSettings";
import { BlackNotesLogo } from "./BlackNotesLogo";

type SidebarTab = "home" | "notebooks" | "tags";

interface NotebookItem {
  id: string;
  name: string;
  noteCount: number;
}

interface TagItem {
  id: string;
  name: string;
  noteCount: number;
}

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  noteCounts: Record<string, number>;
  onClose?: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  notebooks: NotebookItem[];
  tags: TagItem[];
  selectedNotebookId: string | null;
  selectedTagId: string | null;
  onNotebookSelect: (id: string) => void;
  onTagSelect: (id: string) => void;
  onAddNotebook: () => void;
  onAddTag: () => void;
  onCollapse?: () => void;
  isCollapsible?: boolean;
}

const navItems = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "monographs", label: "Monographs", icon: BookOpen },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "archive", label: "Archive", icon: Archive },
];

export const Sidebar = ({ 
  activeSection, 
  onSectionChange, 
  noteCounts, 
  onClose,
  activeTab,
  onTabChange,
  notebooks,
  tags,
  selectedNotebookId,
  selectedTagId,
  onNotebookSelect,
  onTagSelect,
  onAddNotebook,
  onAddTag,
  onCollapse,
  isCollapsible = false,
}: SidebarProps) => {
  const [notebookFilter, setNotebookFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const filteredNotebooks = notebooks.filter(nb => 
    nb.name.toLowerCase().includes(notebookFilter.toLowerCase())
  );

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(tagFilter.toLowerCase())
  );

  return (
    <aside className="w-full h-full bg-sidebar flex flex-col border-r border-border min-w-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="flex-1 min-w-0">
          <BlackNotesLogo size="sm" />
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {isCollapsible && onCollapse && (
            <button 
              onClick={onCollapse}
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors p-1.5 rounded"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Icons - Home, Notebooks, Tags */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button 
          onClick={() => onTabChange("home")}
          className={cn(
            "p-2 rounded-md transition-colors",
            activeTab === "home" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted"
          )}
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onTabChange("notebooks")}
          className={cn(
            "p-2 rounded-md transition-colors",
            activeTab === "notebooks" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted"
          )}
          title="Notebooks"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onTabChange("tags")}
          className={cn(
            "p-2 rounded-md transition-colors",
            activeTab === "tags" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted"
          )}
          title="Tags"
        >
          <Hash className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        {(activeTab === "notebooks" || activeTab === "tags") && (
          <button 
            onClick={activeTab === "notebooks" ? onAddNotebook : onAddTag}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={activeTab === "notebooks" ? "Add notebook" : "Add tag"}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        <button className="p-2 rounded-md text-muted-foreground hover:bg-muted transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "home" && (
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const count = noteCounts[item.id] || 0;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                    isActive 
                      ? "bg-primary-foreground/20 text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {activeTab === "notebooks" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Notebooks List */}
          <div className="flex-1 px-2 py-2 overflow-y-auto">
            {filteredNotebooks.length === 0 && notebookFilter === "" ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  TIP
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Hold Ctrl/Cmd & click on multiple items to select them.
                </p>
                <button
                  onClick={onAddNotebook}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm py-2 px-3"
                >
                  Add a notebook <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : filteredNotebooks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No notebooks found</p>
            ) : (
              <div className="space-y-1">
                {filteredNotebooks.map((notebook) => (
                  <button
                    key={notebook.id}
                    onClick={() => onNotebookSelect(notebook.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
                      selectedNotebookId === notebook.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Notebook className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{notebook.name}</span>
                    <span className={cn(
                      "text-xs min-w-[20px] text-center",
                      selectedNotebookId === notebook.id 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    )}>
                      {notebook.noteCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Filter at bottom */}
          <div className="px-3 py-2 border-t border-border">
            <input
              type="text"
              placeholder="Filter notebooks..."
              value={notebookFilter}
              onChange={(e) => setNotebookFilter(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      )}

      {activeTab === "tags" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tags List */}
          <div className="flex-1 px-2 py-2 overflow-y-auto">
            {filteredTags.length === 0 && tagFilter === "" ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  TIP
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Hold Ctrl/Cmd & click on multiple items to select them.
                </p>
                <button
                  onClick={onAddTag}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm py-2 px-3"
                >
                  Add a tag <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : filteredTags.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tags found</p>
            ) : (
              <div className="space-y-1">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onTagSelect(tag.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
                      selectedTagId === tag.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Hash className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{tag.name}</span>
                    <span className={cn(
                      "text-xs min-w-[20px] text-center",
                      selectedTagId === tag.id 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    )}>
                      {tag.noteCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Filter at bottom */}
          <div className="px-3 py-2 border-t border-border">
            <input
              type="text"
              placeholder="Filter tags..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Footer - consistent for all tabs */}
      <div className="px-3 py-2.5 border-t border-border bg-sidebar/50 backdrop-blur-sm">
        {/* Sync Status */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-muted-foreground">All changes saved</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AppSettings autoSaveDelay={500} searchDelay={300} />

          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
