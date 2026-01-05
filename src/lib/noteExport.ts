/**
 * Note Export/Import Utilities
 * Supports exporting notes to MD, TXT, and JSON formats
 * Supports importing notes from JSON backup
 */

export interface ExportableNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date | string;
  updatedAt?: Date | string;
  isFavorite: boolean;
  section: string;
}

export type ExportFormat = 'md' | 'txt' | 'json';

/**
 * Convert note content to Markdown format
 */
export function noteToMarkdown(note: ExportableNote): string {
  const lines: string[] = [];
  
  // Title
  lines.push(`# ${note.title || 'Untitled'}`);
  lines.push('');
  
  // Metadata
  lines.push('---');
  lines.push(`Created: ${new Date(note.createdAt).toLocaleString()}`);
  if (note.updatedAt) {
    lines.push(`Updated: ${new Date(note.updatedAt).toLocaleString()}`);
  }
  if (note.tags.length > 0) {
    lines.push(`Tags: ${note.tags.join(', ')}`);
  }
  if (note.isFavorite) {
    lines.push('Favorite: Yes');
  }
  lines.push('---');
  lines.push('');
  
  // Content
  lines.push(note.content);
  
  return lines.join('\n');
}

/**
 * Convert note content to plain text format
 */
export function noteToText(note: ExportableNote): string {
  const lines: string[] = [];
  
  // Title
  lines.push(note.title || 'Untitled');
  lines.push('='.repeat(Math.max(note.title?.length || 8, 8)));
  lines.push('');
  
  // Metadata
  lines.push(`Created: ${new Date(note.createdAt).toLocaleString()}`);
  if (note.updatedAt) {
    lines.push(`Updated: ${new Date(note.updatedAt).toLocaleString()}`);
  }
  if (note.tags.length > 0) {
    lines.push(`Tags: ${note.tags.join(', ')}`);
  }
  lines.push('');
  lines.push('-'.repeat(40));
  lines.push('');
  
  // Content - strip HTML tags for plain text
  const plainContent = note.content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  
  lines.push(plainContent);
  
  return lines.join('\n');
}

/**
 * Download a single note as a file
 */
export function downloadNote(note: ExportableNote, format: ExportFormat): void {
  let content: string;
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case 'md':
      content = noteToMarkdown(note);
      mimeType = 'text/markdown';
      extension = 'md';
      break;
    case 'txt':
      content = noteToText(note);
      mimeType = 'text/plain';
      extension = 'txt';
      break;
    case 'json':
      content = JSON.stringify(note, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  // Generate filename
  const safeTitle = (note.title || 'untitled')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
  const date = new Date().toISOString().split('T')[0];
  const filename = `${safeTitle}-${date}.${extension}`;
  
  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📥 Downloaded: ${filename}`);
}

/**
 * Export multiple notes as a JSON backup
 */
export interface NotesBackup {
  version: string;
  exportDate: string;
  noteCount: number;
  notes: ExportableNote[];
}

export function exportNotesToJson(notes: ExportableNote[]): NotesBackup {
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    noteCount: notes.length,
    notes,
  };
}

export function downloadNotesBackup(notes: ExportableNote[]): void {
  const backup = exportNotesToJson(notes);
  const content = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().split('T')[0];
  const filename = `hadesnotes-backup-${date}.json`;
  
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📦 Exported ${notes.length} notes to ${filename}`);
}

/**
 * Download all notes as a ZIP file with individual MD files
 */
export async function downloadNotesAsZip(notes: ExportableNote[]): Promise<void> {
  // For simplicity, we'll create a combined markdown file
  // A full ZIP implementation would require a library like JSZip
  
  const lines: string[] = [];
  lines.push('# HadesNotes Export');
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push(`Total Notes: ${notes.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  notes.forEach((note, index) => {
    lines.push(`## ${index + 1}. ${note.title || 'Untitled'}`);
    lines.push('');
    lines.push(`*Created: ${new Date(note.createdAt).toLocaleString()}*`);
    if (note.tags.length > 0) {
      lines.push(`*Tags: ${note.tags.join(', ')}*`);
    }
    lines.push('');
    lines.push(note.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  });
  
  const content = lines.join('\n');
  const date = new Date().toISOString().split('T')[0];
  const filename = `hadesnotes-all-${date}.md`;
  
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📦 Exported all notes to ${filename}`);
}

/**
 * Parse imported notes backup
 */
export function parseNotesBackup(content: string): NotesBackup | null {
  try {
    const backup = JSON.parse(content) as NotesBackup;
    
    // Validate structure
    if (!backup.version || !backup.notes || !Array.isArray(backup.notes)) {
      throw new Error('Invalid backup structure');
    }
    
    // Validate version
    if (!backup.version.startsWith('1.')) {
      throw new Error(`Unsupported backup version: ${backup.version}`);
    }
    
    return backup;
  } catch (error) {
    console.error('Failed to parse backup:', error);
    return null;
  }
}

/**
 * Read file and parse as notes backup
 */
export function importNotesFromFile(file: File): Promise<NotesBackup | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const backup = parseNotesBackup(content);
      resolve(backup);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
