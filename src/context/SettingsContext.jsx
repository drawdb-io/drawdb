import { createContext, useState } from "react";
import { tableWidth } from "../data/constants";

export const SettingsContext = createContext(null);

export default function SettingsContextProvider({ children }) {
  const [settings, setSettings] = useState({
    strictMode: false,
    showFieldSummary: true,
    showGrid: true,
    mode: "light",
    autosave: true,
    panning: true,
    showCardinality: true,
    tableWidth: tableWidth,
  });

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
