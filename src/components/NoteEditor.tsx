import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from '@/lib/tiptap-extensions';
import { HeadingId } from '@/lib/tiptap-heading-id';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
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
  Star,
  Trash2,
  Strikethrough,
  Code,
  Quote,
  Type,
  ChevronLeft,
  MoreVertical,
  Monitor,
  PanelLeft,
  RefreshCw,
  Minus,
  Plus
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { TableOfContents } from "@/components/TableOfContents";
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
  onBack?: () => void;
  onAddNote?: () => void;
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

const Toolbar = memo(({ editor, fontSize, setFontSize }: ToolbarProps) => {
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
    <div className="flex items-center gap-0.5 md:gap-1 px-2 md:px-4 py-2 bg-toolbar border-b border-border overflow-x-auto scrollbar-none">
      {/* Undo/Redo */}
      <button 
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={cn(
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0",
          editor.can().redo() 
            ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
            : "text-muted-foreground/30"
        )}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
      
      <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

      {/* Text formatting */}
      <button 
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden md:block",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden md:block",
          editor.isActive('code') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1 flex-shrink-0 hidden md:block" />

      {/* Font Size - Hidden on mobile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex-shrink-0 items-center gap-1 min-w-[50px] hidden md:flex">
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

      {/* Heading/Paragraph - Hidden on mobile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex-shrink-0 items-center gap-1 hidden md:flex">
            <Type className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">Paragraph</span>
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

      {/* Font Family - Hidden on mobile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex-shrink-0 items-center gap-1 hidden lg:flex">
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

      <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

      {/* Text Align */}
      <button 
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={cn(
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden md:block",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden md:block",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden lg:block",
          editor.isActive({ textAlign: 'justify' }) 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

      {/* Lists */}
      <button 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden md:block",
          editor.isActive('orderedList') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1 flex-shrink-0 hidden md:block" />

      {/* Blockquote & Link - Hidden on small screens */}
      <button 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden md:block",
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
          "p-2 md:p-1.5 rounded transition-colors flex-shrink-0 hidden md:block",
          editor.isActive('link') 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {/* More options dropdown for mobile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 md:hidden rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0">
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="w-4 h-4 mr-2" />
            Strikethrough
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="w-4 h-4 mr-2" />
            Code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="w-4 h-4 mr-2" />
            Numbered List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="w-4 h-4 mr-2" />
            Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={setLink}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Add Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export const NoteEditor = ({ note, onNoteChange, onClose, onToggleFavorite, onDelete, onBack, onAddNote }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [fontSize, setFontSize] = useState("16px");
  const [editorContent, setEditorContent] = useState(note?.content || '');
  const [showTOC, setShowTOC] = useState(false);

  // Debounce editor content and title to reduce parent re-renders
  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(editorContent, 500);
  const debouncedTags = useDebounce(tags, 500);

  // Track if we're updating from external source to avoid feedback loops
  const isExternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      HeadingId.configure({
        types: ['heading'],
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
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] md:min-h-[400px] text-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isExternalUpdate.current) {
        setEditorContent(editor.getHTML());
      }
    },
  });

  // Update editor when note changes (external update)
  useEffect(() => {
    if (note?.id) {
      isExternalUpdate.current = true;
      setTitle(note.title || "");
      setTags(note.tags || []);
      setEditorContent(note.content || '');

      if (editor && note.content !== editor.getHTML()) {
        editor.commands.setContent(note.content || '', false);
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isExternalUpdate.current = false;
      }, 100);
    }
  }, [note?.id]);

  // Auto-save: Only call onNoteChange when debounced values change
  useEffect(() => {
    if (note && !isExternalUpdate.current) {
      onNoteChange({
        id: note.id,
        title: debouncedTitle,
        content: debouncedContent,
        tags: debouncedTags,
      });
    }
  }, [debouncedTitle, debouncedContent, debouncedTags, note?.id]);

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
      <div className="flex-1 h-full bg-editor flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-10 h-10 text-primary" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">No note selected</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Select a note from the list or create a new one to start editing.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onAddNote}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm hover:shadow-md"
            >
              Create New Note
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium text-sm"
            >
              Browse Notes
            </button>
          </div>

          {/* Tips */}
          <div className="pt-6 border-t border-border mt-8">
            <p className="text-xs text-muted-foreground mb-3">Quick Tips:</p>
            <div className="grid gap-2 text-left">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary">•</span>
                <span>Use <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">Ctrl+N</kbd> to create a new note</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary">•</span>
                <span>Add headings to enable Table of Contents</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary">•</span>
                <span>Auto-save is enabled - your work is always safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-editor flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar - directly without separate header */}
        <Toolbar editor={editor} fontSize={fontSize} setFontSize={setFontSize} />

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-3xl md:text-4xl lg:text-5xl font-light text-foreground placeholder:text-muted-foreground/40 focus:outline-none mb-3"
            />

            {/* Tags */}
            <div className="flex items-center flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary"
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
                className="flex-1 min-w-[80px] bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none py-1"
              />
            </div>

            <EditorContent editor={editor} className="prose-editor" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-background border-t border-border text-xs text-muted-foreground">
          {/* Left side - Sync status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </div>

          {/* Right side - View mode, zoom, word count, date */}
          <div className="flex items-center gap-2">
            {/* TOC Toggle */}
            <button
              onClick={() => setShowTOC(!showTOC)}
              className={cn(
                "p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
                showTOC && "bg-primary/10 text-primary"
              )}
              title="Toggle Table of Contents"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* View mode icons */}
            <div className="hidden sm:flex items-center gap-0.5">
              <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Focus mode">
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Split view">
                <PanelLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-4 bg-border" />

            {/* Zoom controls */}
            <div className="hidden sm:flex items-center gap-0">
              <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Zoom out">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs min-w-[40px] text-center text-muted-foreground">100%</span>
              <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Zoom in">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Word count */}
            <span className="text-muted-foreground">{wordCount} words</span>

            {/* Date & Time */}
            <span className="hidden md:inline text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              }).replace(/\//g, '-')} {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Table of Contents Panel */}
      {showTOC && (
        <TableOfContents
          content={editorContent}
          className="w-64 flex-shrink-0 hidden lg:flex"
        />
      )}
    </div>
  );
};
