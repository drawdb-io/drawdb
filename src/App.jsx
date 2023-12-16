import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Editor from "./pages/Editor";
import LandingPage from "./pages/LandingPage";
import Survey from "./pages/Survey";
import BugReport from "./pages/BugReport";
import SignUp from "./pages/Signup";
import Shortcuts from "./pages/Shortcuts"
import Login from "./pages/Login";
import Templates from "./pages/Templates";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/shortcuts" element={<Shortcuts />} />
        <Route path="/bug_report" element={<BugReport />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/templates" element={<Templates />} />
      </Routes>
    </Router>
  );
}

export default App;
