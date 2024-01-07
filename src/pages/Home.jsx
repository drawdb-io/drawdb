import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";
import { useCookies } from "react-cookie";

export default function Home() {
  const [cookies] = useCookies(["logged_in"]);
  return <div>{cookies.logged_in ? <Dashboard /> : <LandingPage />}</div>;
}
