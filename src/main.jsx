import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import { Analytics } from "@vercel/analytics/react";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "./index.css";
import "./i18n/i18n.js";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocaleProvider locale={en_US}>
    <RouterProvider router={router} />
    <Analytics />
  </LocaleProvider>,
);
