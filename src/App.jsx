import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import BugReport from "./pages/BugReport";
import Templates from "./pages/Templates";
import LandingPage from "./pages/LandingPage";
import SettingsContextProvider from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { ProjectsProvider } from "./context/ProjectsContext";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <SettingsContextProvider>
      <AuthProvider>
        <ProjectsProvider>
          <BrowserRouter>
            <RestoreScroll />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/bug-report" element={<BugReport />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProjectsProvider>
      </AuthProvider>
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
