import { createContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tableWidth } from "../data/constants";

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
  showComments: false,
};

export const SettingsContext = createContext(defaultSettings);

export default function SettingsContextProvider({ children }) {
  const [searchParams] = useSearchParams();

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("settings");
    let baseSettings = savedSettings
      ? { ...defaultSettings, ...JSON.parse(savedSettings) }
      : defaultSettings;

    const theme = searchParams.get("theme");
    if (theme === "light" || theme === "dark") {
      baseSettings = { ...baseSettings, mode: theme };
    }

    return baseSettings;
  });

  useEffect(() => {
    document.body.setAttribute("theme-mode", settings.mode);
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
