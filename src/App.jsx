import { BrowserRouter, HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import Survey from "./pages/Survey";
import BugReport from "./pages/BugReport";
import Shortcuts from "./pages/Shortcuts";
import Templates from "./pages/Templates";
import LandingPage from "./pages/LandingPage";
import SettingsContextProvider from "./context/SettingsContext";
import { useSettings } from "./hooks";
import NotFound from "./pages/NotFound";

function isElectron() {
  if (
    typeof window !== "undefined" &&
    typeof window.process === "object" &&
    window.process.type === "renderer"
  ) {
    return true;
  }

  if (
    typeof process !== "undefined" &&
    typeof process.versions === "object" &&
    !!process.versions.electron
  ) {
    return true;
  }

  if (
    typeof navigator === "object" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.indexOf("Electron") >= 0
  ) {
    return true;
  }

  return false;
}

const Router = isElectron() ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <SettingsContextProvider>
      <Router>
        <RestoreScroll />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/editor"
            element={
              <ThemedPage>
                <Editor />
              </ThemedPage>
            }
          />
          <Route
            path="/survey"
            element={
              <ThemedPage>
                <Survey />
              </ThemedPage>
            }
          />
          <Route
            path="/shortcuts"
            element={
              <ThemedPage>
                <Shortcuts />
              </ThemedPage>
            }
          />
          <Route
            path="/bug-report"
            element={
              <ThemedPage>
                <BugReport />
              </ThemedPage>
            }
          />
          <Route path="/templates" element={<Templates />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
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
