import { createContext, useEffect, useState, useContext } from "react";
import { tableWidth } from "../data/constants";
import { getTheme, setTheme } from "../themeManager";

const defaultSettings = {
  strictMode: false,
  showFieldSummary: true,
  showGrid: true,
  snapToGrid: false,
  showDataTypes: true,
  mode: "light",
  autosave: true,
  showCardinality: true,
  showRelationshipLabels: true,
  tableWidth: tableWidth,
  showDebugCoordinates: false,
};

function getInitialMode() {
  try {
    const storedSettings = localStorage.getItem("settings");
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      if (parsed.mode) {
        return parsed.mode;
      }
    }
  } catch (e) {
    /* ignore and fall through */
  }

  return getTheme();
}

export const SettingsContext = createContext(defaultSettings);

export default function SettingsContextProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const initialMode = getInitialMode();
    return { ...defaultSettings, mode: initialMode };
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem("settings");
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  useEffect(() => {
    setTheme(settings.mode);
  }, [settings.mode]);

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}
