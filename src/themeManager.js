const THEME_STORAGE_KEY = "drawdb:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const VALID_THEMES = new Set(["light", "dark"]);

const subscribers = new Set();
let currentTheme = null;
let mediaQueryList = null;
let hasExplicitPreference = false;
const isBrowser = typeof window !== "undefined";

function readStoredTheme() {
  if (!isBrowser) return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return VALID_THEMES.has(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore storage errors */
  }
}

function getSystemPreference() {
  if (!isBrowser || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root?.setAttribute("data-theme", theme);
  root?.style?.setProperty("color-scheme", theme === "dark" ? "dark" : "light");
  document.body?.setAttribute("data-theme", theme);
}

function notify(theme) {
  subscribers.forEach((listener) => {
    try {
      listener(theme);
    } catch (error) {
      console.warn("[themeManager] subscriber error", error);
    }
  });
}

function handleSystemPreferenceChange(event) {
  if (hasExplicitPreference) return;
  setTheme(event.matches ? "dark" : "light", { persist: false });
}

function ensureMediaListener() {
  if (!isBrowser || typeof window.matchMedia !== "function") return;
  if (mediaQueryList) return;
  mediaQueryList = window.matchMedia(DARK_QUERY);
  mediaQueryList.addEventListener("change", handleSystemPreferenceChange);
}

function resolveTheme() {
  const stored = readStoredTheme();
  if (stored) {
    hasExplicitPreference = true;
    return stored;
  }
  const system = getSystemPreference();
  if (system) return system;
  return "dark";
}

export function initTheme() {
  if (currentTheme) return currentTheme;
  currentTheme = resolveTheme();
  applyTheme(currentTheme);
  ensureMediaListener();
  return currentTheme;
}

export function getTheme() {
  if (currentTheme) return currentTheme;
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (VALID_THEMES.has(attr)) {
      currentTheme = attr;
      return currentTheme;
    }
  }
  return initTheme();
}

export function setTheme(theme, options = {}) {
  const next = VALID_THEMES.has(theme) ? theme : "dark";
  const shouldPersist = options.persist !== false;

  if (currentTheme === next) {
    if (shouldPersist) {
      writeStoredTheme(next);
      hasExplicitPreference = true;
    }
    return next;
  }

  currentTheme = next;
  applyTheme(next);

  if (shouldPersist) {
    writeStoredTheme(next);
    hasExplicitPreference = true;
  } else {
    hasExplicitPreference = false;
  }

  notify(next);
  return next;
}

export function toggleTheme() {
  return setTheme(getTheme() === "dark" ? "light" : "dark");
}

export function subscribe(listener) {
  if (typeof listener !== "function") return () => {};
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

// Backwards compatibility exports
export const initializeTheme = initTheme;
export const getCurrentTheme = getTheme;
export const subscribeToThemeChanges = subscribe;

export { THEME_STORAGE_KEY };

