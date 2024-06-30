import { createContext, useState } from "react";
import { tableWidth } from "../data/constants";

export const SettingsContext = createContext({
  strictMode: false,
  showFieldSummary: true,
  showGrid: true,
  mode: "light",
  autosave: true,
  panning: true,
  showCardinality: true,
  tableWidth: tableWidth,
  showDebugCoordinates: false,
});

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
    showDebugCoordinates: false,
  });

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
