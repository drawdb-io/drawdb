// Theme helper for landing page
// Responsibilities:
// - read/write `drawdb:theme` from localStorage (safely)
// - apply `.theme-dark` or `.theme-light` class to document element
// - provide toggle function
// - listen to system preference changes and notify

const STORAGE_KEY = "drawdb:theme";

function safeGetStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch (e) {
    return null;
  }
}

function getStoredTheme() {
  const s = safeGetStorage();
  try {
    return s ? s.getItem(STORAGE_KEY) : null;
  } catch (e) {
    return null;
  }
}

function setStoredTheme(value) {
  const s = safeGetStorage();
  try {
    if (s) s.setItem(STORAGE_KEY, value);
  } catch (e) {
    // ignore storage errors (e.g., private mode)
  }
}

function isSystemDark() {
  try {
    if (typeof window === "undefined" || !window.matchMedia) return true; // fallback to dark
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    return true;
  }
}

function applyThemeClass(theme) {
  try {
    const root = document.documentElement || document.body;
    if (!root) return;
    root.classList.remove("theme-dark", "theme-light");
    if (theme === "dark") root.classList.add("theme-dark");
    else root.classList.add("theme-light");
  } catch (e) {
    // no-op
  }
}

// Determine active theme: stored > system > default dark
export function getTheme() {
  const stored = getStoredTheme();
  if (stored === "dark" || stored === "light") return stored;
  const sys = isSystemDark() ? "dark" : "light";
  return sys || "dark";
}

export function applyTheme(theme) {
  applyThemeClass(theme);
}

// toggle and persist
export function toggleTheme() {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  try {
    setStoredTheme(next);
  } catch (e) {
    // ignore
  }
  applyThemeClass(next);
  return next;
}

// Initialize on page load: apply stored or system preference, defaulting to dark
export function initTheme() {
  const stored = getStoredTheme();
  const theme = stored === "dark" || stored === "light" ? stored : (isSystemDark() ? "dark" : "light");
  applyThemeClass(theme);
}

// Listen to system preference changes and call callback(prefersDark)
// Returns an unsubscribe function
export function onSystemPrefChange(cb) {
  try {
    if (typeof window === "undefined" || !window.matchMedia) return () => {};
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (ev) => cb(!!ev.matches);
    // modern API
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener && mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener && mq.removeListener(handler);
    };
  } catch (e) {
    return () => {};
  }
}

// Auto-init if running in browser
if (typeof window !== "undefined") {
  try {
    initTheme();
  } catch (e) {
    // ignore
  }
}

export default {
  getTheme,
  applyTheme,
  toggleTheme,
  initTheme,
  onSystemPrefChange,
};
