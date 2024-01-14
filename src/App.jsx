import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Editor from "./pages/Editor";
import Survey from "./pages/Survey";
import BugReport from "./pages/BugReport";
import Shortcuts from "./pages/Shortcuts";
import Templates from "./pages/Templates";
import Home from "./pages/Home";
import { CookiesProvider } from "react-cookie";

function App() {
  return (
    <CookiesProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/shortcuts" element={<Shortcuts />} />
          <Route path="/bug_report" element={<BugReport />} />
          <Route path="/templates" element={<Templates />} />
        </Routes>
      </Router>
    </CookiesProvider>
  );
}

export default App;
