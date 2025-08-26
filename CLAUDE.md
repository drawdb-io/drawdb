# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` - Starts Vite dev server on localhost
- **Build for production**: `npm run build` - Creates optimized production build
- **Lint code**: `npm run lint` - Runs ESLint with React plugins, max 0 warnings
- **Preview build**: `npm run preview` - Serves production build locally

## Project Architecture

This is a React-based database schema designer (fork of drawDB) built with Vite, using a multi-context architecture for state management.

### Core Technology Stack
- **Frontend**: React 18 + Vite
- **UI Framework**: @douyinfe/semi-ui (primary UI components)
- **Styling**: TailwindCSS with custom responsive breakpoints
- **Database**: Dexie (IndexedDB wrapper) for local storage
- **Drag & Drop**: @dnd-kit for canvas interactions
- **Code Editor**: Monaco Editor for SQL/DBML editing
- **Internationalization**: i18next with 30+ language support
- **Export**: html-to-image, jspdf, jszip for diagram exports

### Application Structure

The app follows a context-heavy architecture with nested providers in `src/pages/Editor.jsx`:

1. **LayoutContext** - Canvas layout and viewport management
2. **TransformContext** - Zoom, pan, canvas transformations
3. **UndoRedoContext** - History management for all actions
4. **SelectContext** - Selection state for tables, relationships, etc.
5. **TasksContext** - Todo/task management within diagrams
6. **AreasContext** - Visual grouping areas on canvas
7. **NotesContext** - Sticky notes functionality
8. **TypesContext** - Custom data types
9. **EnumsContext** - Enum definitions
10. **DiagramContext** (TablesContextProvider) - Core tables and relationships
11. **SaveStateContext** - Auto-save and persistence

### Key Components

- **Workspace** (`src/components/Workspace.jsx`) - Main editor orchestrator
- **Canvas** (`src/components/EditorCanvas/Canvas.jsx`) - Interactive diagram canvas
- **SidePanel** - Tabbed interface for tables, relationships, areas, notes, types, enums
- **ControlPanel** - Header with export, import, share, language controls

### Database Support

Multi-database SQL export via `src/utils/exportSQL/`:
- PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, Oracle SQL
- Each database has dedicated export logic in separate modules
- DBML import/export support via `@dbml/core`

### Data Flow

1. **Local Storage**: Dexie stores diagrams and templates in IndexedDB
2. **State Management**: React Context for real-time collaboration on canvas
3. **Export Pipeline**: Canvas → HTML → Image/PDF/SQL generation
4. **Import Pipeline**: SQL/DBML → AST parsing → Context state updates

### Canvas Architecture

The canvas uses SVG for relationships and HTML elements for tables/notes:
- Tables are draggable HTML divs with absolute positioning
- Relationships are SVG paths calculated dynamically
- Areas are SVG rectangles for visual grouping
- Grid system with 24px base unit (`gridSize` in constants)

### Custom Hooks Pattern

All contexts expose custom hooks (e.g., `useDiagram`, `useCanvas`, `useLayout`) for clean component integration. Import from `src/hooks/index.js`.

### Internationalization

RTL language support in `src/i18n/utils/rtl.js`. Language files in `src/i18n/locales/` with translation keys organized by feature area.

### Environment Variables

Optional backend integration via `VITE_BACKEND_URL` for diagram sharing functionality (GitHub Gists API integration).

## Development Notes

- Tables, relationships, and canvas elements use absolute positioning with transform-based zoom
- Color system defined in `src/data/constants.js` with consistent theming
- Export functionality supports PNG (4x pixel ratio), PDF, and multiple SQL dialects
- The codebase prioritizes performance with efficient re-rendering through context separation