# drawDB AI Agent Instructions

## Purpose
This file helps AI coding agents understand the drawDB repository, how to build and test it, and where to make changes.

## Key project details
- Frontend-only React application built with Vite and Tailwind CSS.
- Uses ECMAScript modules (`type: module` in `package.json`).
- No TypeScript; code is JavaScript/JSX with React 18.
- Primary state is managed through React context providers in `src/context/`.
- UI is composed from `src/components/` and route-level pages in `src/pages/`.
- Important domain logic lives in `src/utils/`, `src/hooks/`, and `src/data/`.
- Translations use `i18next` via `src/i18n/`.

## Build and run
Use npm commands from `package.json`:
- `npm install`
- `npm run dev` — local development server
- `npm run build` — production build
- `npm run preview` — preview the built site
- `npm run lint` — ESLint check for JavaScript and JSX

## Coding conventions
- Keep code in English, including comments, identifiers, and UI text.
- Format code with Prettier and satisfy ESLint before committing.
- Prefer React function components and hooks.
- Use the existing folder structure for similar feature areas.
- Avoid adding backend-only code; this repository is the browser client.

## Important folders
- `src/components/` — reusable UI components and feature widgets.
- `src/context/` — app state providers and shared state logic.
- `src/hooks/` — custom hooks for areas, canvas, layout, selection, etc.
- `src/pages/` — page-level route components.
- `src/utils/` — helpers for export/import, validation, layout, SQL generation, and canvas math.
- `src/data/` — static constants, seed data, schemas, and editor configuration.
- `public/` — static assets served by Vite.

## Known repository conventions
- The project is a client-side app; avoid changes that require a server unless clearly documented.
- Docker support exists, but the main developer workflow is via Vite.
- Use `README.md` for project overview and setup, and `CONTRIBUTING.md` for contribution guidelines.

## References
- [README.md](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
