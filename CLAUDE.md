# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DrawDB is a React-based database entity relationship diagram (ERD) editor that runs in the browser. It supports multiple database types (MySQL, PostgreSQL, SQLite, MariaDB, SQL Server, Oracle) and provides features for creating, editing, and exporting database schemas.

## **标准工作流程**

 **每次开始一个新的复杂任务的时候，按如下工作流程进行**

1. 先理清问题，查阅代码库相关文件，把解决方案写成tasks/projectplan.md文档。
2. 文档里要列出具体待办事项，完成一项就勾掉一项。
3. 开工前先找我过一遍方案，我会把关确认。
4. 接着逐项处理待办事项，实时更新完成状态。
5. 每完成一个步骤，简单跟我同步下改了哪些内容。
6. 所有代码改动都要最小化。宁可多拆几个小改动，也别搞复杂的大改。能少动代码就少动，越简单越好。
7. 最后在tasks/projectplan.md补充"改动总结"章节，记录修改内容和相关说明。

## Development Commands

**Start development server:**
```bash
pnpm dev
```

**Build for production:**
```bash
pnpm build
```

**Lint code:**
```bash
pnpm lint
```

**Preview production build:**
```bash
pnpm preview
```

**Docker build:**
```bash
docker build -t drawdb .
docker run -p 3000:80 drawdb
```

## Architecture

### Core Structure
- **React 18** with **Vite** build system
- **React Router** for navigation between pages
- **Tailwind CSS** for styling with **Semi-UI** components
- **Framer Motion** for animations
- **i18next** for internationalization (40+ languages)

### Key Pages
- `/` - Landing page
- `/editor` - Main diagram editor
- `/templates` - Predefined templates
- `/bug-report` - Bug reporting form

### Context Architecture
The application uses React Context for state management with multiple specialized contexts:
- **DiagramContext** - Core diagram state and operations
- **CanvasContext** - Canvas rendering and interactions
- **SettingsContext** - User preferences and settings
- **UndoRedoContext** - History management
- **SelectContext** - Selection state management
- **TransformContext** - Canvas transformations (zoom, pan)
- **SaveStateContext** - Save/load state management

### Key Directories
- `src/components/` - Reusable UI components
- `src/context/` - React Context providers
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions for import/export
- `src/data/` - Constants, database schemas, data types
- `src/i18n/` - Internationalization files

### Database Support
- **Export formats:** SQL (multiple dialects), DBML, JSON
- **Import formats:** DBML, JSON, SQL
- **Supported databases:** MySQL, PostgreSQL, SQLite, MariaDB, SQL Server, Oracle SQL

### Key Features
- Visual table/relationship editor with drag-and-drop
- SQL generation for multiple database types
- Schema validation and issue detection
- Template system for common patterns
- Export to various formats (SQL, DBML, PNG, PDF)
- Collaborative sharing (with server setup)

## Code Conventions

### State Management
- Use appropriate context for feature-specific state
- Custom hooks in `src/hooks/` wrap context logic
- Avoid prop drilling by using contexts

### Styling
- Use Tailwind CSS classes
- Semi-UI components for complex UI elements
- Responsive design with mobile-first approach
- Custom breakpoints: 3xl, 2xl, xl, lg, md, sm

### Internationalization
- All user-facing strings must be internationalized
- Use `useTranslation` hook from react-i18next
- Translation files located in `src/i18n/locales/`

### Component Organization
- Components grouped by feature in subdirectories
- Reusable components in `src/components/`
- Page components in `src/pages/`
- Context providers in `src/context/`

## Development Notes

### Canvas System
The editor uses a custom canvas system with:
- SVG-based rendering for tables and relationships
- Custom transform matrix for zoom/pan
- Grid-based positioning system
- Drag-and-drop functionality via @dnd-kit

### Data Persistence
- Uses **Dexie** (IndexedDB wrapper) for local storage
- Schema validation with **jsonschema**
- Export utilities in `src/utils/exportAs/` and `src/utils/exportSQL/`

### Performance Considerations
- Large diagrams use virtualization techniques
- Debounced operations for frequent updates
- Memoization for expensive calculations
- Lazy loading for templates and assets

## Testing

No test suite is currently configured. When adding tests, consider:
- Unit tests for utility functions
- Integration tests for context providers
- E2E tests for critical user flows