import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import Editor from "../pages/Editor";
import Survey from "../pages/Survey";
import Shortcuts from "../pages/Shortcuts";
import BugReport from "../pages/BugReport";
import Templates from "../pages/Templates";
import NotFound from "../pages/NotFound";
import App from "../App";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path="/" index={true} element={<LandingPage />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/survey" element={<Survey />} />
      <Route path="/shortcuts" element={<Shortcuts />} />
      <Route path="/bug-report" element={<BugReport />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default router;