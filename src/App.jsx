import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Editor from "./pages/Editor";
import Survey from "./pages/Survey";
import BugReport from "./pages/BugReport";
import Shortcuts from "./pages/Shortcuts";
import Templates from "./pages/Templates";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LayoutContextProvider from "./context/LayoutContext";

const Wrapper = ({ children }) => {
  const location = useLocation();
  useEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Wrapper>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/editor"
            element={
              <LayoutContextProvider>
                <Editor />
              </LayoutContextProvider>
            }
          />
          <Route path="/survey" element={<Survey />} />
          <Route path="/shortcuts" element={<Shortcuts />} />
          <Route path="/bug_report" element={<BugReport />} />
          <Route path="/templates" element={<Templates />} />
        </Routes>
      </Wrapper>
    </BrowserRouter>
  );
}

export default App;
