import {
  FileText,
  Star,
  Bell,
  BookOpen,
  Trash2,
  Archive,
  Hash,
  Settings,
  Home,
  FolderOpen,
  Menu,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { AppSettings } from "./AppSettings";
import { LogoutButton } from "./LogoutButton";

type SidebarTab = "home" | "notebooks" | "tags";

interface MiniSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onExpand: () => void;
}

const navItems = [
  { id: "notes", icon: FileText, tab: "home" as SidebarTab },
  { id: "favorites", icon: Star, tab: "home" as SidebarTab },
  { id: "reminders", icon: Bell, tab: "home" as SidebarTab },
  { id: "monographs", icon: BookOpen, tab: "home" as SidebarTab },
  { id: "trash", icon: Trash2, tab: "home" as SidebarTab },
  { id: "archive", icon: Archive, tab: "home" as SidebarTab },
];

export const MiniSidebar = ({ 
  activeSection, 
  onSectionChange, 
  activeTab,
  onTabChange,
  onExpand 
}: MiniSidebarProps) => {
  return (
    <aside className="w-12 h-full bg-sidebar flex flex-col border-r border-border">
      {/* Expand Button */}
      <div className="flex flex-col items-center py-2">
        <button 
          onClick={onExpand}
          className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Expand sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Separator */}
      <div className="mx-2 border-t border-border" />

      {/* Tab Icons */}
      <div className="flex flex-col items-center gap-1 py-3">
        <button 
          onClick={() => onTabChange("home")}
          className={cn(
            "p-2.5 rounded-md transition-colors",
            activeTab === "home" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onTabChange("notebooks")}
          className={cn(
            "p-2.5 rounded-md transition-colors",
            activeTab === "notebooks" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Notebooks"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onTabChange("tags")}
          className={cn(
            "p-2.5 rounded-md transition-colors",
            activeTab === "tags" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Tags"
        >
          <Hash className="w-4 h-4" />
        </button>
      </div>

      {/* Separator */}
      <div className="mx-2 border-t border-border" />

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "p-2.5 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={item.id.charAt(0).toUpperCase() + item.id.slice(1)}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col items-center gap-1 py-2.5 px-1 border-t border-border bg-sidebar/50">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" title="All changes saved" />
        <ThemeToggle className="p-2" />
        <AppSettings autoSaveDelay={500} searchDelay={300} />
        <LogoutButton variant="icon" showLabel={false} />
      </div>
    </aside>
  );
};
