import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Editor from "./pages/editor";
import LandingPage from "./pages/landing_page";
import Survey from "./pages/survey";
import Shortcuts from "./pages/shortcuts";
import BugReport from "./pages/bug_report";
import SignUp from "./pages/signup";
import Login from "./pages/login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<Editor name="Untitled" />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/shortcuts" element={<Shortcuts />} />
        <Route path="/bug_report" element={<BugReport />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
