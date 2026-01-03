# 📝 HadesNotes

> A powerful, fast, and beautiful note-taking application built with modern web technologies.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)

## ✨ Features

### 📌 Core Features
- **Rich Text Editor** - Powered by TipTap with full formatting support
- **Auto-Save** - Never lose your work with intelligent auto-saving
- **Offline-First** - All data stored locally in IndexedDB
- **Fast Search** - Debounced search across all notes
- **Table of Contents** - Auto-generated TOC from headings
- **Tags & Notebooks** - Organize notes with tags and notebooks
- **Multiple Sections** - Notes, Favorites, Reminders, Monographs, Archive, Trash
- **Dark/Light Theme** - Beautiful themes with system preference support

### 🎨 UI/UX Features
- **Resizable Panels** - Customize your workspace
- **Virtual Scrolling** - Handle thousands of notes smoothly
- **Drag & Drop** - Reorder notes with ease
- **Keyboard Shortcuts** - Boost productivity
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Empty States** - Helpful guidance when starting
- **Toast Notifications** - Clear feedback for actions

### ⚡ Performance Features
- **Debounced Search** - 300ms delay for smooth searching
- **Debounced Auto-Save** - 500ms delay to reduce writes
- **React.memo** - Optimized component re-renders
- **Virtual Scrolling** - Only render visible items
- **IndexedDB** - Fast local database
- **Lazy Loading** - Load data on demand

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hadesnotes.git
   cd hadesnotes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   App will be available at `http://localhost:8080`

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

---

## 📖 Documentation

### Project Structure

```
hadesnotes/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AppSettings.tsx # Settings panel
│   │   ├── NoteEditor.tsx  # TipTap editor
│   │   ├── NotesList.tsx   # Virtual list
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   └── TableOfContents.tsx # TOC component
│   ├── hooks/              # Custom React hooks
│   │   ├── useDB.ts        # IndexedDB hooks
│   │   ├── useDebounce.ts  # Debounce hook
│   │   └── use-toast.ts    # Toast notifications
│   ├── lib/                # Utilities
│   │   ├── db.ts           # IndexedDB service
│   │   ├── utils.ts        # Utility functions
│   │   ├── tiptap-extensions.ts # Custom TipTap extensions
│   │   └── tiptap-heading-id.ts # Heading ID extension
│   ├── pages/              # Page components
│   │   └── Index.tsx       # Main app page
│   ├── App.tsx             # App root
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── dist/                   # Build output
└── package.json           # Dependencies
```

### Tech Stack

#### Core
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite 5** - Build tool & dev server

#### UI Components
- **shadcn/ui** - Component library
- **Radix UI** - Headless components
- **Lucide Icons** - Icon library
- **Tailwind CSS** - Styling

#### Editor
- **TipTap** - Rich text editor
- **ProseMirror** - Editor framework

#### Features
- **@dnd-kit** - Drag and drop
- **react-virtuoso** - Virtual scrolling
- **next-themes** - Theme management
- **react-resizable-panels** - Resizable layout

#### State & Storage
- **Zustand** - State management (prepared)
- **IndexedDB** - Local database
- **React Hooks** - Local state

---

## 💾 Data Storage

### IndexedDB Schema

HadesNotes uses IndexedDB for offline-first data storage:

```typescript
Database: HadesNotesDB (version 1)

Stores:
  - notes          # Note documents
  - notebooks      # Notebook collections
  - tags           # Tag metadata
  - settings       # App preferences
```

### Data Models

#### Note
```typescript
{
  id: string            // Unique identifier
  title: string         // Note title
  content: string       // HTML content
  preview: string       // Text preview
  createdAt: Date       // Creation timestamp
  updatedAt: Date       // Last modified timestamp
  tags: string[]        // Associated tags
  isFavorite: boolean   // Favorite status
  section: string       // Section (notes/favorites/etc)
  notebookId?: string   // Parent notebook
  order: number         // Display order
}
```

#### Notebook
```typescript
{
  id: string           // Unique identifier
  name: string         // Notebook name
  noteCount: number    // Number of notes
  createdAt: Date      // Creation timestamp
}
```

#### Tag
```typescript
{
  id: string           // Unique identifier
  name: string         // Tag name
  noteCount: number    // Number of notes
  createdAt: Date      // Creation timestamp
}
```

### Auto-Save

- **Trigger**: Any change to notes, notebooks, or tags
- **Delay**: Changes are saved automatically after you stop typing
- **Debounce**: 500ms for notes, instant for notebooks/tags
- **Feedback**: Green checkmark in sidebar footer

### Data Management

#### Export Data
```typescript
// In AppSettings > About tab
// Click "Export Data" button
// Downloads: hadesnotes-backup-YYYY-MM-DD.json
```

#### Import Data
```typescript
// In AppSettings > About tab
// Click "Import Data" button
// Select JSON backup file
// Page refreshes with imported data
```

#### Clear All Data
```typescript
// In AppSettings > About tab
// Click "Clear All Data" button
// Confirms action, then clears database
```

---

## ⌨️ Keyboard Shortcuts

### Editor
| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Note |
| `Ctrl+F` | Search |
| `Ctrl+\` | Toggle Sidebar |

---

## 🎨 Customization

### Theme

Access theme settings in **Settings > Appearance**:

- **Light Mode** - Clean, bright interface
- **Dark Mode** - Easy on the eyes (default)
- **System** - Follow OS preference

### Performance

Adjust performance settings in **Settings > Performance**:

- **Search Delay** - 100-1000ms (default: 300ms)
- **Auto-Save Delay** - 200-2000ms (default: 500ms)

### Appearance

Customize appearance in **Settings > Appearance**:

- **Font Size** - 12-24px (default: 16px)
- **Show TOC** - Auto-show Table of Contents
- **Compact Mode** - Reduce spacing

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm run build:dev    # Development build

# Preview
npm run preview      # Preview production build

# Lint
npm run lint         # Run ESLint
```

### Adding Features

#### 1. Create a Component

```tsx
// src/components/MyComponent.tsx
import { memo } from 'react';

export const MyComponent = memo(() => {
  return <div>My Component</div>;
});

MyComponent.displayName = 'MyComponent';
```

#### 2. Use IndexedDB

```tsx
import { useNotesDB } from '@/hooks/useDB';

function MyComponent() {
  const { loadNotes, saveNote } = useNotesDB();

  // Load notes
  useEffect(() => {
    const notes = await loadNotes();
  }, []);

  // Save note
  const handleSave = async (note) => {
    await saveNote(note);
  };
}
```

#### 3. Add a TipTap Extension

```tsx
// src/lib/tiptap-extensions.ts
import { Extension } from '@tiptap/core';

export const MyExtension = Extension.create({
  name: 'myExtension',
  // ... extension code
});
```

---

## 🐛 Troubleshooting

### Data Not Persisting

1. Check browser console for IndexedDB errors
2. Ensure browser supports IndexedDB
3. Check browser storage settings
4. Try clearing browser cache

### Performance Issues

1. Reduce search delay in settings
2. Enable compact mode
3. Archive old notes
4. Clear browser cache

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## 📊 Performance

### Build Size

```
CSS:  69.70 KB (gzipped: 12.32 KB)
JS:   957.52 KB (gzipped: 298.11 KB)
```

### Optimizations

- ✅ **React.memo** on all major components
- ✅ **useMemo** for expensive computations
- ✅ **useCallback** for function stability
- ✅ **Debounced** search and auto-save
- ✅ **Virtual scrolling** for large lists
- ✅ **Code splitting** ready
- ✅ **Lazy loading** prepared

### Browser Support

- ✅ Chrome/Edge >= 90
- ✅ Firefox >= 88
- ✅ Safari >= 14
- ✅ Opera >= 76

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use TypeScript
- Follow existing code style
- Add comments for complex logic
- Use meaningful variable names
- Write clean, readable code

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful component library
- **TipTap** - Powerful rich text editor
- **Radix UI** - Accessible primitives
- **Lucide** - Icon library
- **Tailwind CSS** - Utility-first CSS

---

## 📬 Contact

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Email**: your.email@example.com

---

## 🗺️ Roadmap

### v1.1.0
- [ ] Markdown export/import
- [ ] PDF export
- [ ] Note templates
- [ ] Advanced search filters
- [ ] Note linking

### v1.2.0
- [ ] Cloud sync
- [ ] Collaborative editing
- [ ] Mobile app
- [ ] Browser extension
- [ ] API for integrations

### v2.0.0
- [ ] Plugin system
- [ ] Custom themes
- [ ] AI-powered features
- [ ] End-to-end encryption
- [ ] Version history

---

<div align="center">

**Made with ❤️ using React, TypeScript, and TipTap**

[⬆ back to top](#-hadesnotes)

</div>
