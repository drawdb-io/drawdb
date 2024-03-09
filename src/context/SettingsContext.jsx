import { createContext, useState } from "react";

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
  });

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
