import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { LocaleProvider } from "@douyinfe/semi-ui";
import { Analytics } from "@vercel/analytics/react";

import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <LocaleProvider locale={en_US}>
    <App />
    <Analytics />
  </LocaleProvider>
  // </React.StrictMode>
);
