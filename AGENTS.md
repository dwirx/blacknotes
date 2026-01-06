# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains application code.
  - `src/components/` UI components (shadcn/ui in `src/components/ui/`)
  - `src/hooks/` custom hooks (example: `useDB.ts`)
  - `src/lib/` utilities and TipTap extensions
  - `src/pages/` route-level pages (example: `Index.tsx`)
  - `src/stores/` Zustand stores
  - Entry points: `src/main.tsx` and `src/App.tsx`
- `public/` holds static assets; `index.html` is the Vite entry.
- `dist/` is generated build output.

## Build, Test, and Development Commands
- `npm install` installs dependencies and updates `package-lock.json`.
- `npm run dev` starts the Vite dev server at `http://localhost:8080`.
- `npm run build` produces a production build in `dist/`.
- `npm run build:dev` builds with development mode settings.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint across the codebase.

## Coding Style & Naming Conventions
- TypeScript + React function components; keep existing formatting (2-space indent, semicolons).
- Use the `@/` alias for imports from `src` (example: `@/components/Sidebar`).
- Components use PascalCase (`NoteEditor.tsx`), hooks use `useX` (`useDebounce.ts`), stores use `*Store` in `src/stores/`.
- Styling is Tailwind-first with shared styles in `src/index.css` and `src/App.css`.

## Testing Guidelines
- No automated test runner or coverage requirements are configured.
- Validate changes manually with `npm run dev` and `npm run build`; add a test setup + script if you introduce tests.

## Commit & Pull Request Guidelines
- Follow the existing commit style: short, imperative, sentence case (examples: `Add dark mode toggle`, `Improve BlackNotes branding`).
- PRs should include a clear description, link related issues, and add screenshots or short clips for UI changes.
- Call out any data model or IndexedDB changes explicitly.

## Additional Notes
- See `CLAUDE.md` for architectural details and state-management patterns.
- If you use Bun, keep `bun.lockb` in sync with `package-lock.json`.
