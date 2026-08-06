# Repository Guidelines

## Dos and Don’ts

- Do run `npm install` before linting or building; scripts expect local `node_modules`.
- Do follow the existing React context and hook pattern (`src/context`, `src/hooks`) instead of introducing ad-hoc globals.
- Do run `npm run lint` and `npm run build` locally before opening a PR; CI (`.github/workflows/build.yml`) blocks on them.
- Do keep sharing features conditional on `VITE_BACKEND_URL`; handle the unset case gracefully as in `src/api/gists.js`.
- Don't reformat, rename, or move unrelated files; let Prettier format only the lines you touch.
- Don't add dependencies, commit `.env` values, or check in generated output (`dist`, `node_modules`).

## Project Structure and Module Organization

DrawDB is a Vite-powered React app for designing database diagrams and exporting SQL.

- `src/` holds production code: routing in `App.jsx`, the entry point in `main.jsx`, and Tailwind styles in `index.css`.
- `src/pages/` contains top-level routes (Editor, LandingPage, Templates, BugReport, NotFound).
- `src/context/` and `src/hooks/` expose per-domain state (diagram, settings, undo/redo, etc.); components consume these rather than manual prop chains.
- `src/components/` contains UI modules (canvas, headers, panels); `src/utils/` and `src/data/` consolidate helpers and static data.
- `src/i18n/locales/` stores locale objects; `src/i18n/i18n.js` wires i18next.
- `public/` holds static assets; `index.html`, `vite.config.js`, `tailwind.config.js`, and `postcss.config.js` define the build surface.
- CI workflows live in `.github/workflows/`; Docker artefacts sit in `Dockerfile` and `compose.yml`.

## Build, Test, and Development Commands

Use Node 18 or 20 (matching `.github/workflows/build.yml`) and npm v9+.

- Install dependencies: `npm install`.
- Start the dev server: `npm run dev` (append `-- --host` when sharing the server, as in `compose.yml`).
- Lint the codebase: `npm run lint`; for targeted checks, `npx eslint src/components/FloatingControls.jsx`.
- Produce a production bundle: `npm run build`; preview it via `npm run preview`.
- Container builds rely on the provided `Dockerfile`; adjust tags in `.github/workflows/docker.yml` rather than inventing new scripts.

## Coding Style and Naming Conventions

- Prettier (`.prettierrc.json`) enforces 2-space indentation, double quotes, trailing commas, and semicolons; do not override these defaults.
- ESLint (`.eslintrc.cjs`) extends the React recommended rules; fix `react-refresh` warnings by keeping component exports pure.
- Favor functional React components with PascalCase filenames; hooks must start with `use` and live in `src/hooks`.
- Keep module paths relative to `src/`; extend existing barrel files (e.g., `src/hooks/index.js`) when adding exports.
- Styling relies on Tailwind via `src/index.css`; prefer utility classes and theme tokens over bespoke CSS.
- Comments, variable names, and new translations stay in English unless you are working inside `src/i18n/locales`.

## Testing Guidelines

- The repo currently has no automated test suite; regressions are caught through linting and production builds.
- Reproduce fixes through `npm run dev` and targeted manual checks (e.g., validate diagram interactions or exports touched by your change).
- When adding automated coverage, align with Vite/Vitest conventions (co-locate `*.test.jsx` near the module) and confirm the approach with maintainers before introducing new tooling.
- Document manual verification steps in the PR description so reviewers can replay them.

## Commit and Pull Request Guidelines

- Base changes off `main`; keep diffs focused and self-contained.
- Follow CONTRIBUTING.md: imperative, capitalized subject lines with an empty line before the body; reference issues when relevant.
- Ensure `npm run lint` and `npm run build` succeed locally; the Build workflow runs both on Node 18 and 20.
- Explain behavioral changes, screenshots, or recordings for UI updates; include locale notes when editing `src/i18n/locales`.
- Use English in commit messages and reviews, matching recent history (e.g., `Update and improve zh-TW Traditional Chinese locale`).

## Safety and Permissions

- Ask before adding dependencies, renaming/moving files, or changing build/CI configuration.
- It is safe to read files, inspect history, run scoped lint/build commands, and create small focused patches without prior approval.
- Never commit secrets or share tokens; populate `.env` locally from `.env.sample`, and keep `VITE_BACKEND_URL` unset when backend sharing is not configured.
- Avoid force pushes to shared branches and do not delete user data, diagrams, or locale files without coordination.

## Architecture Overview

- Editor state is centralized in contexts under `src/context` (diagram structure, layout, undo/redo, tasks); hooks in `src/hooks` expose domain-specific selectors and mutations.
- API interactions live in `src/api/` (`gists.js`, `email.js`) and depend on `VITE_BACKEND_URL`; ensure features degrade gracefully when the backend is unavailable.
- Export/import workflows sit under `src/utils/exportAs`, `src/utils/importFrom`, and SQL helpers; reuse these helpers instead of duplicating logic in components.
- Templates and seed data live in `src/templates/` and `src/data/`; reference them when adding onboarding or sample content.

## Security and Configuration Tips

- Use `.env.sample` as the single source for environment variables; document new keys there when needed.
- When enabling sharing or analytics features locally, supply `VITE_BACKEND_URL` via `.env`, and clear the value before committing.
- Keep dependencies updated via npm; Docker and CI already rely on `npm ci`/`npm install`, so do not introduce alternate package managers.
