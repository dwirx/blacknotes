import { 
  FileText, 
  Star, 
  Bell, 
  BookOpen, 
  Trash2, 
  Archive, 
  Hash, 
  Copy, 
  Settings, 
  X, 
  Home, 
  FolderOpen,
  SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarTab = "home" | "notebooks" | "tags";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  noteCounts: Record<string, number>;
  onClose?: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
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
}: SidebarProps) => {
  return (
    <aside className="w-[200px] h-full bg-sidebar flex flex-col border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">N</span>
        </div>
        <span className="text-foreground font-semibold">Notesnook</span>
        <div className="ml-auto flex items-center gap-1">
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <Settings className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Icons - Home, Notebooks, Tags */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
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
        <div className="flex-1 px-2 py-2 text-sm text-muted-foreground">
          <p className="text-center py-8">Switch to notebooks view</p>
        </div>
      )}

      {activeTab === "tags" && (
        <div className="flex-1 px-2 py-2 text-sm text-muted-foreground">
          <p className="text-center py-8">Switch to tags view</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-muted-foreground">Synced</span>
        <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
