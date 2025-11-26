import { useLayoutEffect } from "react";
import useSettings from "./useSettings";
import { setTheme } from "../themeManager";

/**
 * Keeps the rendered page in sync with the current editor theme.
 */
export default function useThemedPage() {
  const { settings } = useSettings();

  useLayoutEffect(() => {
    setTheme(settings.mode);
  }, [settings.mode]);
}
