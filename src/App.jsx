import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import BugReport from "./pages/BugReport";
import Templates from "./pages/Templates";
import LandingPage from "./pages/LandingPage";
import SettingsContextProvider from "./context/SettingsContext";
import NotFound from "./pages/NotFound";
import ExtensionsContext from "./context/ExtensionsContext";
import {
  serverList,
  serverLoad,
  serverSave,
} from "./extensions/serverStorage";

const serverExtensions = { serverList, serverLoad, serverSave };

function EditorWithServer() {
  return (
    <ExtensionsContext.Provider value={serverExtensions}>
      <Editor />
    </ExtensionsContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsContextProvider>
        <RestoreScroll />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editor" element={<EditorWithServer />} />
          <Route path="/editor/diagrams/:id" element={<EditorWithServer />} />
          <Route path="/editor/templates/:id" element={<EditorWithServer />} />
          <Route path="/bug-report" element={<BugReport />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SettingsContextProvider>
    </BrowserRouter>
  );
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
