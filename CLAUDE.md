# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HadesNotes is a note-taking application built with React, TypeScript, Vite, and shadcn-ui components. It follows a Notion/Obsidian-inspired architecture with a multi-panel layout featuring sidebar navigation, notes list, and rich text editor.

## Development Commands

### Essential Commands

```bash
# Install dependencies
npm i

# Start development server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture

### State Management

The application uses **Zustand** for centralized state management:

- **Primary Store**: `src/stores/notesStore.ts` - Manages all notes, notebooks, tags, navigation history, and UI state
- Uses `subscribeWithSelector` middleware for fine-grained subscriptions
- However, note that `src/pages/Index.tsx` currently uses **local component state** instead of the Zustand store, suggesting a migration in progress or dual approach

### Application Structure

**Entry Point**: `src/main.tsx` → `src/App.tsx` → `src/pages/Index.tsx`

**Provider Hierarchy** (defined in App.tsx):
1. `QueryClientProvider` (TanStack Query)
2. `ThemeProvider` (next-themes) - defaults to dark mode
3. `TooltipProvider`
4. `BrowserRouter` (React Router)

### Layout System

The application has two distinct layouts:

**Desktop Layout** (`lg:` breakpoint and up):
- Uses `ResizablePanelGroup` with three collapsible panels:
  1. **Sidebar Panel** (15% default, 10-25% range) - Navigation, notebooks, tags
  2. **Notes List Panel** (25% default, 15-40% range) - Filterable list of notes
  3. **Editor Panel** (60% default, 30%+ min) - TipTap rich text editor
- Features a unified global tabs bar at the top showing open notes
- Panels can collapse to mini/hidden state with expand controls

**Mobile/Tablet Layout** (`< lg` breakpoint):
- Fixed sidebar drawer overlay (220px wide)
- Single-view switching between notes list and editor
- Mobile header with menu toggle and add button

### Key Components

**Main Views**:
- `Sidebar.tsx` - Navigation with three tabs: home (sections), notebooks, tags
- `MiniSidebar.tsx` - Collapsed sidebar for desktop
- `NotesList.tsx` - Virtual scrolling list of notes with drag-and-drop reordering (@dnd-kit)
- `NoteEditor.tsx` - TipTap-based rich text editor
- `NoteTabs.tsx` - Tab management for open notes

**View Components**:
- `NotebooksView.tsx` - Notebook management interface
- `TagsView.tsx` - Tag management interface

### Rich Text Editor

Uses **TipTap** (ProseMirror-based) with extensions:
- StarterKit (basic formatting)
- Custom `FontSize` extension (`src/lib/tiptap-extensions.ts`)
- Heading, Link, Underline, Placeholder
- FontFamily, TextAlign, TextStyle

### Data Model

**Note Interface**:
```typescript
{
  id: string
  title: string
  content: string
  preview: string
  createdAt: Date
  tags: string[]
  isFavorite: boolean
  section: 'notes' | 'favorites' | 'reminders' | 'monographs' | 'trash' | 'archive'
  notebookId?: string
  order: number  // for drag-and-drop ordering
}
```

**Sections**: Notes are organized into hardcoded sections (notes, favorites, reminders, monographs, trash, archive)

**Navigation History**: Tracks note selection with back/forward navigation (browser-style)

### Theming

- Uses **next-themes** with Tailwind CSS custom properties
- Theme system defined in `tailwind.config.ts` with extensive HSL color tokens
- Custom colors for: sidebar, editor, notesList, toolbar backgrounds
- Dark mode is the default theme

### Path Aliases

TypeScript and Vite configured with `@/*` alias pointing to `src/*`:
- Always use `@/components/...` instead of relative paths
- Configured in `tsconfig.json` and `vite.config.ts`

### TypeScript Configuration

- `noImplicitAny: false`
- `noUnusedLocals: false`
- `noUnusedParameters: false`
- `strictNullChecks: false`

These relaxed settings mean type safety is not strictly enforced.

## Important Patterns

### Note Operations

- **Create**: New notes default to current section (except trash/archive/favorites → "notes")
- **Delete**: First delete moves to trash, second delete is permanent
- **Tabs**: Notes open in tabs, with close buttons and selection tracking
- **Search**: Client-side filtering across title and content

### Responsive Behavior

- Desktop: Resizable three-panel layout with collapsible sections
- Mobile: Drawer sidebar + single-panel view switching
- `window.innerWidth < 768` checks determine mobile behavior in Index.tsx

### Component Library

Extensive **shadcn-ui** component library in `src/components/ui/`:
- Pre-built accessible components (Radix UI + Tailwind)
- Custom-styled with the theme system
- Add new components via shadcn CLI if needed

## Development Notes

- The project was scaffolded from Lovable (a UI builder platform)
- Uses Vite's React SWC plugin for fast builds
- Development server binds to IPv6 `::` on port 8080
- No test suite is currently present (no test commands in package.json)
