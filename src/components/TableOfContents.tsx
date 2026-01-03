import { useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { List, ChevronRight, Hash } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  onHeadingClick?: (id: string) => void;
}

export const TableOfContents = memo(({ content, className, onHeadingClick }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Parse HTML content to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const extractedHeadings: Heading[] = [];
    headingElements.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent || '';
      // Get ID from heading or generate one
      let id = heading.getAttribute('id') || heading.id;

      if (!id) {
        // Generate ID from text
        id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `heading-${index}`;
      }

      extractedHeadings.push({ id, text, level });
    });

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    // Track active heading based on scroll position
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  const handleHeadingClick = (id: string, text: string) => {
    // Try to find heading by ID first
    let element = document.getElementById(id);

    // If not found by ID, try to find by text content
    if (!element) {
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      allHeadings.forEach((heading) => {
        if (heading.textContent?.trim() === text.trim()) {
          element = heading as HTMLElement;
        }
      });
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Set active manually
      setActiveId(id);
    }
    onHeadingClick?.(id);
  };

  if (headings.length === 0) {
    return (
      <div className={cn('flex flex-col bg-sidebar border-l border-border', className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar/50">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Table of Contents
            </span>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Hash className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No headings found</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Add headings to your note to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-sidebar border-l border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Table of Contents
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {headings.length}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronRight
            className={cn('w-4 h-4 transition-transform duration-200', !isCollapsed && 'rotate-90')}
          />
        </button>
      </div>

      {/* TOC List */}
      {!isCollapsed && (
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {headings.map((heading, index) => {
              const isActive = activeId === heading.id;
              return (
                <li key={heading.id}>
                  <button
                    onClick={() => handleHeadingClick(heading.id, heading.text)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200',
                      'hover:bg-muted/70 group relative',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={{
                      paddingLeft: `${(heading.level - 1) * 16 + 12}px`,
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}

                    {/* Level indicator */}
                    <span className={cn(
                      'inline-block w-5 h-5 rounded mr-2 text-[10px] font-bold flex items-center justify-center',
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'
                    )}>
                      H{heading.level}
                    </span>

                    {/* Heading text */}
                    <span className="line-clamp-2 flex-1">
                      {heading.text}
                    </span>

                    {/* Hover indicator */}
                    {!isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-sidebar/50">
        <p className="text-[10px] text-muted-foreground text-center">
          {headings.length} heading{headings.length !== 1 ? 's' : ''} • Auto-updated
        </p>
      </div>
    </div>
  );
});

TableOfContents.displayName = 'TableOfContents';
