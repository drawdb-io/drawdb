import { createContext, useEffect, useState } from "react";
import { tableWidth, DB } from "../data/constants"; 

const defaultSettings = {
  strictMode: false,
  showFieldSummary: true,
  showGrid: true,
  mode: "light",
  autosave: true,
  panning: true,
  showCardinality: true,
  showRelationshipLabels: true,
  tableWidth: tableWidth,
  showDebugCoordinates: false,
  
  databaseType: DB.MYSQL,
  fkConstraintNaming: {
    template: "{table1}_{table2}_{field1}_{field2}_fk",
  },
  indexNaming: {
    template: "{table}_{indexType}_{fields}_idx",
  },
  defaultNewTableFieldProps: {
    type: "VARCHAR",
    size: 255,
    default: null,
    notNull: false,
    primary: false,
    unique: false,
    increment: false,
    comment: "",
    foreignK: false,
  },
};

export const SettingsContext = createContext(defaultSettings);

export default function SettingsContextProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const settings = localStorage.getItem("settings");
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setSettings(prevSettings => ({
        ...defaultSettings, // Start with all default properties
        ...parsedSettings, 
        fkConstraintNaming: {
          ...defaultSettings.fkConstraintNaming,
          ...(parsedSettings.fkConstraintNaming || {})
        },
        indexNaming: {
          ...defaultSettings.indexNaming,
          ...(parsedSettings.indexNaming || {})
        },
        defaultNewTableFieldProps: {
          ...defaultSettings.defaultNewTableFieldProps,
          ...(parsedSettings.defaultNewTableFieldProps || {})
        }
      }));
      //setSettings(JSON.parse(settings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
