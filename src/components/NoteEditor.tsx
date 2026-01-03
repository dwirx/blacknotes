import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from '@/lib/tiptap-extensions';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  MoreVertical, 
  Plus, 
  Minus,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  CheckSquare,
  Search,
  X,
  Maximize2,
  Grid3X3,
  Star,
  Trash2,
  Strikethrough,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Type
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const fontFamilies = [
  { name: 'Sans-serif', value: 'Inter, system-ui, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Mono', value: 'ui-monospace, monospace' },
];
const headingOptions = [
  { name: 'Paragraph', level: 0 },
  { name: 'Heading 1', level: 1 },
  { name: 'Heading 2', level: 2 },
  { name: 'Heading 3', level: 3 },
];

interface ToolbarProps {
  editor: Editor | null;
  fontSize: string;
  setFontSize: (size: string) => void;
}

const Toolbar = ({ editor, fontSize, setFontSize }: ToolbarProps) => {
  if (!editor) return null;

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    editor.chain().focus().setFontSize(size).run();
  };

  const handleFontFamilyChange = (family: string) => {
    editor.chain().focus().setFontFamily(family).run();
  };

  const handleHeadingChange = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-toolbar border-b border-border flex-wrap">
      {/* Undo/Redo */}
      <button 
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.can().undo() 
            ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
            : "text-muted-foreground/30"
        )}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.can().redo() 
            ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
            : "text-muted-foreground/30"
        )}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
      
      <div className="w-px h-5 bg-border mx-1" />

      {/* Text formatting */}
      <button 
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('bold') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('italic') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('underline') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('strike') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('code') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Font Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex items-center gap-1 min-w-[60px]">
            {fontSize}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-20">
          {fontSizes.map((size) => (
            <DropdownMenuItem 
              key={size} 
              onClick={() => handleFontSizeChange(size)}
              className={cn(fontSize === size && "bg-primary/10 text-primary")}
            >
              {size}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Heading/Paragraph */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex items-center gap-1">
            <Type className="w-4 h-4 mr-1" />
            Paragraph
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-32">
          {headingOptions.map((option) => (
            <DropdownMenuItem 
              key={option.level} 
              onClick={() => handleHeadingChange(option.level)}
              className={cn(
                (option.level === 0 && editor.isActive('paragraph')) ||
                (option.level > 0 && editor.isActive('heading', { level: option.level }))
                  ? "bg-primary/10 text-primary"
                  : ""
              )}
            >
              {option.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Family */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex items-center gap-1">
            Sans-serif
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-32">
          {fontFamilies.map((font) => (
            <DropdownMenuItem 
              key={font.name} 
              onClick={() => handleFontFamilyChange(font.value)}
            >
              <span style={{ fontFamily: font.value }}>{font.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Text Align */}
      <button 
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive({ textAlign: 'left' }) 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive({ textAlign: 'center' }) 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive({ textAlign: 'right' }) 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive({ textAlign: 'justify' }) 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Lists */}
      <button 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('bulletList') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('orderedList') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Blockquote & Link */}
      <button 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('blockquote') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button 
        onClick={setLink}
        className={cn(
          "p-1.5 rounded transition-colors",
          editor.isActive('link') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export const NoteEditor = ({ note, onNoteChange, onClose, onToggleFavorite, onDelete }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [fontSize, setFontSize] = useState("16px");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),
      TextStyle,
      FontFamily,
      FontSize,
    ],
    content: note?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] text-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      if (note) {
        onNoteChange({
          id: note.id,
          title,
          content: editor.getHTML(),
          tags,
        });
      }
    },
  });

  useEffect(() => {
    setTitle(note?.title || "");
    setTags(note?.tags || []);
    if (editor && note) {
      const currentContent = editor.getHTML();
      if (currentContent !== note.content) {
        editor.commands.setContent(note.content || '');
      }
    }
  }, [note?.id]);

  useEffect(() => {
    if (note && editor) {
      onNoteChange({
        id: note.id,
        title,
        content: editor.getHTML(),
        tags,
      });
    }
  }, [title, tags]);

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

  const wordCount = editor ? editor.storage.characterCount?.words?.() || editor.getText().trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = editor ? editor.getText().length : 0;

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
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar editor={editor} fontSize={fontSize} setFontSize={setFontSize} />

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-4xl font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none mb-2"
          />
          
          {/* Tags */}
          <div className="flex items-center flex-wrap gap-2 mb-6">
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
          
          <EditorContent editor={editor} className="prose-editor" />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="text-primary">● Saved</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
};
