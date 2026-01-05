/**
 * Note Export Dialog
 * Allows users to export a single note in various formats
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  FileCode, 
  FileJson,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadNote, ExportableNote, ExportFormat } from '@/lib/noteExport';
import { useToast } from '@/hooks/use-toast';

interface NoteExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: ExportableNote | null;
}

const formats = [
  {
    id: 'md' as ExportFormat,
    name: 'Markdown',
    description: 'Format dengan styling, cocok untuk dokumentasi',
    icon: FileCode,
    extension: '.md',
  },
  {
    id: 'txt' as ExportFormat,
    name: 'Plain Text',
    description: 'Teks biasa tanpa formatting',
    icon: FileText,
    extension: '.txt',
  },
  {
    id: 'json' as ExportFormat,
    name: 'JSON',
    description: 'Data lengkap termasuk metadata',
    icon: FileJson,
    extension: '.json',
  },
];

export function NoteExportDialog({ open, onOpenChange, note }: NoteExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    if (!note) return;
    
    setIsExporting(true);
    try {
      downloadNote(note, selectedFormat);
      toast({
        title: 'Berhasil diexport!',
        description: `Note "${note.title || 'Untitled'}" telah didownload`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Export gagal',
        description: 'Terjadi kesalahan saat mengexport note',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            Export Note
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Pilih format untuk mengexport "{note?.title || 'Untitled'}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {formats.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;
            
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={cn(
                  "w-full p-4 rounded-lg border transition-all text-left",
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-800 hover:border-gray-700 bg-gray-950/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isSelected ? "bg-blue-500/20" : "bg-gray-800"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isSelected ? "text-blue-500" : "text-gray-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        isSelected ? "text-white" : "text-gray-300"
                      )}>
                        {format.name}
                      </span>
                      <span className="text-xs text-gray-500">{format.extension}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {format.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-gray-700 hover:bg-gray-800"
          >
            Batal
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Mengexport...' : 'Download'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
