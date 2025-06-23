import { useLayoutEffect } from "react";
import useSettings from "./useSettings";

/**
 * Adds the `theme-mode` attribute to the body element for semi-ui dark theme
 */
export default function useThemedPage() {
  const { settings } = useSettings();

  useLayoutEffect(() => {
    document.body.setAttribute("theme-mode", settings.mode);

    const removeClass = settings.mode === "light" ? "dark" : "light";

    document.documentElement.classList.remove(removeClass);
    document.documentElement.classList.add(settings.mode);
  }, [settings]);
}
