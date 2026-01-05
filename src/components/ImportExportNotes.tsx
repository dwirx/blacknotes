import { useState, useRef } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Download, 
  Upload, 
  FileText, 
  FileJson, 
  Archive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderDown,
  FileDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  preview?: string;
  createdAt: Date;
  updatedAt?: Date;
  tags: string[];
  isFavorite: boolean;
  section: string;
  notebookId?: string;
}

interface NotesImportExportProps {
  notes: Note[];
  onImportNotes: (notes: Note[]) => void;
  selectedNote?: Note | null;
  className?: string;
}

type ExportFormat = 'json' | 'md' | 'txt';

const NotesImportExport = ({ 
  notes, 
  onImportNotes, 
  selectedNote,
  className 
}: NotesImportExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Convert HTML content to Markdown
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    
    let md = html;
    
    // Handle headings (h1-h6) - remove id attributes
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
    
    // Handle bold
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    
    // Handle italic
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Handle underline (no standard MD, use HTML or just text)
    md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');
    
    // Handle strikethrough
    md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
    md = md.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~');
    md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
    
    // Handle code
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Handle code blocks
    md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '\n```\n$1\n```\n');
    md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '\n```\n$1\n```\n');
    
    // Handle blockquote
    md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
      return content.split('\n').map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n';
    });
    
    // Handle links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Handle images
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');
    
    // Handle unordered lists
    md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    });
    
    // Handle ordered lists
    let listCounter = 0;
    md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
      listCounter = 0;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
        listCounter++;
        return `${listCounter}. ` + arguments[1] + '\n';
      }) + '\n';
    });
    md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
      let num = 0;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, (_m: string, text: string) => {
        num++;
        return `${num}. ${text}\n`;
      }) + '\n';
    });
    
    // Handle horizontal rule
    md = md.replace(/<hr[^>]*\/?>/gi, '\n---\n\n');
    
    // Handle line breaks
    md = md.replace(/<br[^>]*\/?>/gi, '\n');
    
    // Handle paragraphs
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');
    
    // Handle divs (just extract content)
    md = md.replace(/<div[^>]*>(.*?)<\/div>/gis, '$1\n');
    
    // Handle spans (just extract content)
    md = md.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
    
    // Remove any remaining HTML tags
    md = md.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#39;/g, "'");
    
    // Clean up extra whitespace
    md = md.replace(/\n{3,}/g, '\n\n');
    md = md.trim();
    
    return md;
  };

  // Convert HTML to plain text
  const htmlToPlainText = (html: string): string => {
    if (!html) return '';
    
    let text = html;
    
    // Handle headings - add underlines for h1/h2
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, content) => {
      const clean = content.replace(/<[^>]+>/g, '');
      return `${clean}\n${'='.repeat(clean.length)}\n\n`;
    });
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, content) => {
      const clean = content.replace(/<[^>]+>/g, '');
      return `${clean}\n${'-'.repeat(clean.length)}\n\n`;
    });
    text = text.replace(/<h[3-6][^>]*>(.*?)<\/h[3-6]>/gi, '$1\n\n');
    
    // Handle lists
    text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n') + '\n';
    });
    text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
      let num = 0;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, (_m: string, txt: string) => {
        num++;
        return `${num}. ${txt}\n`;
      }) + '\n';
    });
    
    // Handle blockquote
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
      return content.split('\n').map((line: string) => `| ${line.trim()}`).join('\n') + '\n\n';
    });
    
    // Handle horizontal rule
    text = text.replace(/<hr[^>]*\/?>/gi, '\n' + '-'.repeat(40) + '\n\n');
    
    // Handle line breaks
    text = text.replace(/<br[^>]*\/?>/gi, '\n');
    
    // Handle paragraphs
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');
    
    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    
    return text;
  };

  const generateMarkdown = (note: Note): string => {
    const lines: string[] = [];
    lines.push(`# ${note.title || 'Untitled'}`);
    lines.push('');
    lines.push(`> Created: ${new Date(note.createdAt).toLocaleString()}`);
    if (note.updatedAt) {
      lines.push(`> Updated: ${new Date(note.updatedAt).toLocaleString()}`);
    }
    if (note.tags.length > 0) {
      lines.push(`> Tags: ${note.tags.map(t => `#${t}`).join(' ')}`);
    }
    lines.push('');
    // Convert HTML content to Markdown
    lines.push(htmlToMarkdown(note.content));
    return lines.join('\n');
  };

  const generatePlainText = (note: Note): string => {
    const lines: string[] = [];
    lines.push(note.title || 'Untitled');
    lines.push('='.repeat((note.title || 'Untitled').length));
    lines.push('');
    lines.push(`Created: ${new Date(note.createdAt).toLocaleString()}`);
    if (note.updatedAt) {
      lines.push(`Updated: ${new Date(note.updatedAt).toLocaleString()}`);
    }
    if (note.tags.length > 0) {
      lines.push(`Tags: ${note.tags.join(', ')}`);
    }
    lines.push('');
    // Convert HTML content to plain text
    lines.push(htmlToPlainText(note.content));
    return lines.join('\n');
  };

  const exportSingleNote = (note: Note, format: ExportFormat) => {
    const filename = `${note.title || 'untitled'}-${new Date().toISOString().split('T')[0]}`;
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'md':
        content = generateMarkdown(note);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'txt':
        content = generatePlainText(note);
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      default:
        content = JSON.stringify(note, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
    }

    downloadFile(content, `${filename}.${extension}`, mimeType);
    toast({
      title: 'Note exported',
      description: `"${note.title || 'Untitled'}" exported as ${extension.toUpperCase()}`,
    });
  };

  const exportAllNotes = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const filename = `hadesnotes-export-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'json') {
        const exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          noteCount: notes.length,
          notes: notes,
        };
        downloadFile(JSON.stringify(exportData, null, 2), `${filename}.json`, 'application/json');
      } else {
        let content = '';
        if (format === 'md') {
          content = notes.map(note => generateMarkdown(note)).join('\n\n---\n\n');
        } else {
          content = notes.map(note => generatePlainText(note)).join('\n\n========================================\n\n');
        }
        const extension = format === 'md' ? 'md' : 'txt';
        downloadFile(content, `${filename}.${extension}`, format === 'md' ? 'text/markdown' : 'text/plain');
      }

      toast({
        title: 'Export complete',
        description: `${notes.length} notes exported successfully`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export notes.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const content = await file.text();
      let importedNotes: Note[] = [];

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        if (data.notes && Array.isArray(data.notes)) {
          importedNotes = data.notes.map((note: Note) => ({
            ...note,
            id: crypto.randomUUID(),
            createdAt: new Date(note.createdAt),
            updatedAt: note.updatedAt ? new Date(note.updatedAt) : undefined,
          }));
        } else if (Array.isArray(data)) {
          importedNotes = data.map((note: Note) => ({
            ...note,
            id: crypto.randomUUID(),
            createdAt: new Date(note.createdAt || new Date()),
          }));
        }
      } else {
        const title = file.name.replace(/\.(md|txt)$/, '');
        importedNotes = [{
          id: crypto.randomUUID(),
          title,
          content,
          preview: content.substring(0, 100),
          createdAt: new Date(),
          tags: [],
          isFavorite: false,
          section: 'notes',
        }];
      }

      if (importedNotes.length > 0) {
        onImportNotes(importedNotes);
        setImportResult({ success: true, message: `Imported ${importedNotes.length} note(s)` });
        toast({ title: 'Import complete', description: `${importedNotes.length} note(s) imported` });
      }
    } catch (error) {
      setImportResult({ success: false, message: 'Failed to import file' });
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
          {selectedNote && (
            <>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Export Current Note</div>
              <DropdownMenuItem onClick={() => exportSingleNote(selectedNote, 'md')} className="text-gray-300 focus:bg-gray-800">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSingleNote(selectedNote, 'txt')} className="text-gray-300 focus:bg-gray-800">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSingleNote(selectedNote, 'json')} className="text-gray-300 focus:bg-gray-800">
                <FileJson className="w-4 h-4 mr-2 text-yellow-500" />JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
            </>
          )}
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Export All ({notes.length})</div>
          <DropdownMenuItem onClick={() => exportAllNotes('json')} className="text-gray-300 focus:bg-gray-800">
            <Archive className="w-4 h-4 mr-2 text-green-500" />All as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAllNotes('md')} className="text-gray-300 focus:bg-gray-800">
            <FolderDown className="w-4 h-4 mr-2 text-blue-500" />All as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAllNotes('txt')} className="text-gray-300 focus:bg-gray-800">
            <FileDown className="w-4 h-4 mr-2 text-gray-500" />All as Text
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Upload className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">Import</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />Import Notes
            </DialogTitle>
            <DialogDescription className="text-gray-400">Import from JSON, Markdown, or Text files</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer border-gray-700 hover:border-gray-600"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".json,.md,.txt" onChange={handleFileImport} className="hidden" />
              {isImporting ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-300">Click to select file</p>
                  <p className="text-xs text-gray-500">.json, .md, .txt</p>
                </>
              )}
            </div>
            {importResult && (
              <Alert className={importResult.success ? "bg-green-950/30 border-green-900" : "bg-red-950/30 border-red-900"}>
                {importResult.success ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                <AlertDescription className={importResult.success ? "text-green-200 ml-2" : "text-red-200 ml-2"}>{importResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesImportExport;
