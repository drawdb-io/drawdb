import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Editor from "./pages/editor";
import LandingPage from "./pages/landing_page";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editor" element={<Editor name="Untitled" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
