import { useCallback, useEffect, useState } from "react";
import { getTheme, subscribe, toggleTheme } from "../themeManager";

export default function ThemeToggle({ className = "" }) {
  const [theme, setThemeState] = useState(() => getTheme());

  useEffect(() => {
    const unsubscribe = subscribe(setThemeState);
    return unsubscribe;
  }, []);

  const handleToggle = useCallback(() => {
    toggleTheme();
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle color theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`theme-toggle inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent transition-all duration-200 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 motion-reduce:transition-none ${className}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <span className="relative flex items-center justify-center">
        {/* Sun icon (visible in light) */}
        <svg
          className={`h-5 w-5 transition-opacity duration-200 ${isDark ? "opacity-0" : "opacity-100"} motion-reduce:transition-none`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5 19 19M19 5l1.5-1.5M4.5 19.5 6 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Moon icon (visible in dark) */}
        <svg
          className={`absolute h-5 w-5 transition-opacity duration-200 ${isDark ? "opacity-100" : "opacity-0"} motion-reduce:transition-none`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

