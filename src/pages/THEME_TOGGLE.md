Theme toggle (light / dark)
--------------------------------

The landing page header exposes a sun/moon toggle that persists the user choice in `localStorage` (`drawdb:theme`). We default to dark unless a stored preference or system preference (via `prefers-color-scheme`) is available. To avoid flashes of incorrect colors, an inline script in `index.html` applies the resolved theme before React renders.

Files:
- `index.html` — inline guard script that bootstraps the `data-theme` attribute prior to hydration.
- `src/themeManager.js` — theme helper (init, toggle, storage, matchMedia listener, subscribers).
- `src/components/ThemeToggle.jsx` — accessible switch UI (role="switch", keyboard support).
- `src/components/Navbar.jsx` — renders the toggle in the landing header.
- `src/index.css` — CSS variables (`:root` / `[data-theme='dark']`), landing-page specific surfaces, and animated transitions that respect `prefers-reduced-motion`.
