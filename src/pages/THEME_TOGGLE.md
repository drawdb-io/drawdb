Theme toggle (light / dark)
--------------------------------

The landing page includes a theme toggle in the top-right header. It persists the user's choice in localStorage using the key `drawdb:theme` and falls back to the system preference; if neither is available the default is dark.

Files:
- `src/theme.js` — theme helper (init, toggle, storage, system listener)
- `src/components/Navbar.jsx` — toggle button UI and ARIA attributes
- `src/index.css` — CSS variables and `.theme-dark` / `.theme-light` classes
