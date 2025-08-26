import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import BugReport from "./pages/BugReport";
import Templates from "./pages/Templates";
import SchemaFlowLanding from "./pages/SchemaFlowLanding";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SettingsContextProvider from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { ProjectsProvider } from "./context/ProjectsContext";
import { ChatProvider } from "./context/ChatContext";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <SettingsContextProvider>
      <AuthProvider>
        <ProjectsProvider>
          <ChatProvider>
            <BrowserRouter>
              <RestoreScroll />
              <Routes>
                <Route path="/" element={<SchemaFlowLanding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/editor" element={<Editor />} />
                <Route path="/bug-report" element={<BugReport />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ChatProvider>
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
