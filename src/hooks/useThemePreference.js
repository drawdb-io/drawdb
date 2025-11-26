import { useEffect, useState } from "react";
import { getTheme, subscribe } from "../themeManager";

/**
 * React hook that mirrors the global landing-page theme.
 */
export default function useThemePreference() {
  const [theme, setTheme] = useState(() => getTheme());

  useEffect(() => {
    const unsubscribe = subscribe(setTheme);
    return unsubscribe;
  }, []);

  return theme;
}

