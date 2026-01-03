import { 
  Bold, 
  Italic, 
  Underline, 
  MoreVertical, 
  Plus, 
  Minus,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  Undo,
  Redo,
  CheckSquare,
  Search,
  X,
  Maximize2,
  Grid3X3,
  Star,
  Trash2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
}

interface NoteEditorProps {
  note: Note | null;
  onNoteChange: (note: { id: string; title: string; content: string; tags: string[] }) => void;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NoteEditor = ({ note, onNoteChange, onClose, onToggleFavorite, onDelete }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [fontSize, setFontSize] = useState(14);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setTags(note?.tags || []);
  }, [note?.id]);

  // Auto-save with debounce
  useEffect(() => {
    if (!note) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onNoteChange({ 
        id: note.id, 
        title, 
        content, 
        tags 
      });
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, tags, note?.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const applyFormatting = (format: string) => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = "";
    let cursorOffset = 0;
    
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case "underline":
        formattedText = `_${selectedText}_`;
        cursorOffset = 1;
        break;
      case "list":
        formattedText = `\n- ${selectedText}`;
        cursorOffset = 3;
        break;
      case "orderedList":
        formattedText = `\n1. ${selectedText}`;
        cursorOffset = 4;
        break;
      case "link":
        formattedText = `[${selectedText}](url)`;
        cursorOffset = 1;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectedText.length);
    }, 0);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  if (!note) {
    return (
      <div className="flex-1 h-screen bg-editor flex flex-col items-center justify-center">
        <div className="text-center px-8">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium text-foreground mb-2">No note selected</h2>
          <p className="text-muted-foreground text-sm">
            Select a note from the list or create a new one to start editing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen bg-editor flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
            <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs">📄</span>
            </div>
            <span className="text-sm text-foreground truncate max-w-[150px]">
              {title || "Untitled"}
            </span>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onToggleFavorite(note.id)}
            className={cn(
              "p-1.5 transition-colors rounded",
              note.isFavorite 
                ? "text-primary hover:text-primary/80" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Star className={cn("w-4 h-4", note.isFavorite && "fill-current")} />
          </button>
          <button 
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Redo className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-toolbar border-b border-border flex-wrap">
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button 
          onClick={() => applyFormatting("bold")}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button 
          onClick={() => applyFormatting("italic")}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button 
          onClick={() => applyFormatting("underline")}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button 
          onClick={() => setFontSize(Math.max(10, fontSize - 2))}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-sm text-muted-foreground px-2 min-w-[40px] text-center">{fontSize}px</span>
        <button 
          onClick={() => setFontSize(Math.min(32, fontSize + 2))}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex items-center gap-1">
          Paragraph
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex items-center gap-1">
          Sans-serif
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={() => applyFormatting("list")}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          <List className="w-4 h-4" />
        </button>
        <button 
          onClick={() => applyFormatting("orderedList")}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button 
          onClick={() => applyFormatting("link")}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          <Link className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <Image className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={handleTitleChange}
            className="w-full bg-transparent text-4xl font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none mb-2"
          />
          
          {/* Tags */}
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
              >
                #{tag}
                <button 
                  onClick={() => removeTag(tag)}
                  className="hover:text-primary/70 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={tags.length === 0 ? "Add a tag" : ""}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 min-w-[100px] bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>
          
          <textarea
            ref={contentRef}
            placeholder="Start writing your note..."
            value={content}
            onChange={handleContentChange}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none min-h-[400px] leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Saved</span>
        </div>
        <div className="flex items-center gap-4">
          <span>100%</span>
          <button 
            onClick={() => setFontSize(Math.max(10, fontSize - 2))}
            className="hover:text-foreground transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button 
            onClick={() => setFontSize(Math.min(32, fontSize + 2))}
            className="hover:text-foreground transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
};
