import { useLocation, Outlet } from "react-router-dom";
import { useLayoutEffect } from "react";
import SettingsContextProvider from "./context/SettingsContext";
import { useSettings } from "./hooks";

export default function App() {
  return (
    <SettingsContextProvider>
      <RestoreScroll />
      <ThemedPage>
        <Outlet />
      </ThemedPage>
    </SettingsContextProvider>
  );
}

function ThemedPage({ children }) {
  const { setSettings } = useSettings();

  useLayoutEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setSettings((prev) => ({ ...prev, mode: "dark" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "dark");
      }
    } else {
      setSettings((prev) => ({ ...prev, mode: "light" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "light");
      }
    }
  }, [setSettings]);

  return children;
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
