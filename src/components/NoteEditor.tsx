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
  Grid3X3
} from "lucide-react";
import { useState, useEffect } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

interface NoteEditorProps {
  note: Note | null;
  onNoteChange: (note: Note) => void;
  onClose: () => void;
}

export const NoteEditor = ({ note, onNoteChange, onClose }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tagInput, setTagInput] = useState("");
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
  }, [note]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (note) {
      onNoteChange({ ...note, title: newTitle });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (note) {
      onNoteChange({ ...note, content: newContent });
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex-1 h-screen bg-editor flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
            <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs">📄</span>
            </div>
            <span className="text-sm text-foreground">Untitled</span>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            <CheckSquare className="w-4 h-4" />
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
      <div className="flex items-center gap-1 px-4 py-2 bg-toolbar border-b border-border">
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <Bold className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <Italic className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <Underline className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-sm text-muted-foreground px-2">{fontSize}px</span>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
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
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <List className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
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
          <input
            type="text"
            placeholder="Add a tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none mb-6"
          />
          <textarea
            placeholder="Start writing your note..."
            value={content}
            onChange={handleContentChange}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none min-h-[400px] leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-end gap-4 px-4 py-2 bg-background border-t border-border text-xs text-muted-foreground">
        <span>100%</span>
        <button className="hover:text-foreground transition-colors">
          <Minus className="w-3 h-3" />
        </button>
        <button className="hover:text-foreground transition-colors">
          <Plus className="w-3 h-3" />
        </button>
        <span>{wordCount} words</span>
      </div>
    </div>
  );
};
