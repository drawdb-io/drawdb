import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Editor from "./pages/Editor";
import Survey from "./pages/Survey";
import BugReport from "./pages/BugReport";
import Shortcuts from "./pages/Shortcuts";
import Templates from "./pages/Templates";
import { useEffect, useLayoutEffect } from "react";
import LandingPage from "./pages/LandingPage";
import SettingsContextProvider from "./context/SettingsContext";
import useSettings from "./hooks/useSettings";

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
  useEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <SettingsContextProvider>
      <BrowserRouter>
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
            path="/bug_report"
            element={
              <ThemedPage>
                <BugReport />
              </ThemedPage>
            }
          />
          <Route path="/templates" element={<Templates />} />
        </Routes>
      </BrowserRouter>
    </SettingsContextProvider>
  );
}

export default App;
