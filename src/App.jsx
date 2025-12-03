import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import BugReport from "./pages/BugReport";
import Templates from "./pages/Templates";
import LandingPage from "./pages/LandingPage";
import SettingsContextProvider from "./context/SettingsContext";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <SettingsContextProvider>
      <BrowserRouter>
        <a
          href="#main-content"
          className="skip-to-main"
          style={{
            position: "absolute",
            left: "-9999px",
            zIndex: 999,
            padding: "1em",
            backgroundColor: "var(--semi-color-bg-2)",
            color: "var(--semi-color-text-0)",
            textDecoration: "none",
            borderRadius: "4px",
          }}
          onFocus={(e) => (e.target.style.left = "10px")}
          onBlur={(e) => (e.target.style.left = "-9999px")}
        >
          Skip to main content
        </a>
        <RestoreScroll />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/bug-report" element={<BugReport />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SettingsContextProvider>
  );
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
