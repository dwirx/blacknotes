import { memo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Clock,
  FileText,
  Calendar,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  tags: string[];
}

interface StatsCardProps {
  notes: Note[];
  className?: string;
}

export const StatsCard = memo(({ notes, className }: StatsCardProps) => {
  const totalNotes = notes.length;
  const totalWords = notes.reduce((acc, note) => {
    const words = note.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
    return acc + words;
  }, 0);

  const allTags = notes.reduce((acc, note) => {
    note.tags.forEach(tag => acc.add(tag));
    return acc;
  }, new Set<string>());

  const recentNotes = notes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      icon: FileText,
      label: 'Total Notes',
      value: totalNotes,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Total Words',
      value: totalWords.toLocaleString(),
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Tag,
      label: 'Tags',
      value: allTags.size,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', stat.bgColor)}>
                <Icon className={cn('w-4 h-4', stat.color)} />
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      {recentNotes.length > 0 && (
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {note.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tip */}
      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1">Pro Tip</h3>
            <p className="text-xs text-muted-foreground">
              Use headings (H1, H2, H3) to organize your notes and enable automatic Table of Contents!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';
