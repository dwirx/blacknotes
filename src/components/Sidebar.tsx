import { FileText, Star, Bell, BookOpen, Trash2, Archive, Hash, Copy, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  noteCounts: Record<string, number>;
}

const navItems = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "monographs", label: "Monographs", icon: BookOpen },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "archive", label: "Archive", icon: Archive },
];

export const Sidebar = ({ activeSection, onSectionChange, noteCounts }: SidebarProps) => {
  return (
    <aside className="w-[200px] h-screen bg-sidebar flex flex-col border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">N</span>
        </div>
        <span className="text-foreground font-semibold">Notesnook</span>
        <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button className="p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <FileText className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:bg-muted transition-colors">
          <Copy className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:bg-muted transition-colors">
          <Hash className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
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
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200",
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
