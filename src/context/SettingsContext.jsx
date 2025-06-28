import { createContext, useEffect, useState } from "react";
import { tableWidth } from "../data/constants";

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
  defaultFieldType: 'INTEGER',
  defaultTextSize: 40,
  upperCaseFields: false,
  defaultNotNull: false,
  defaultTypeSizes: {
    mysql: {
      VARCHAR: 255,
      CHAR: 1,
      TEXT: 65535,
      BINARY: 255,
      VARBINARY: 255,
      DECIMAL: { precision: 10, scale: 2 },
      NUMERIC: { precision: 10, scale: 2 },
      FLOAT: { precision: 7 },
      DOUBLE: { precision: 15 }
    },
    postgresql: {
      VARCHAR: 255,
      CHAR: 1,
      TEXT: 65535,
      BYTEA: 255,
      DECIMAL: { precision: 10, scale: 2 },
      NUMERIC: { precision: 10, scale: 2 },
      REAL: { precision: 7 },
      DOUBLE_PRECISION: { precision: 15 }
    },
    oracledb: {
      VARCHAR2: 255,
      VARCHAR: 255,
      CHAR: 1,
      RAW: 255,
      NUMBER: { precision: 10, scale: 2 },
      FLOAT: { precision: 7 }
    },
    sqlite: {
      VARCHAR: 255,
      CHAR: 1,
      TEXT: 65535,
      BLOB: 255
    },
    transactsql: {
      VARCHAR: 255,
      CHAR: 1,
      TEXT: 65535,
      BINARY: 255,
      VARBINARY: 255,
      DECIMAL: { precision: 10, scale: 2 },
      NUMERIC: { precision: 10, scale: 2 },
      FLOAT: { precision: 7 },
      REAL: { precision: 7 }
    },
    mariadb: {
      VARCHAR: 255,
      CHAR: 1,
      TEXT: 65535,
      BINARY: 255,
      VARBINARY: 255,
      DECIMAL: { precision: 10, scale: 2 },
      NUMERIC: { precision: 10, scale: 2 },
      FLOAT: { precision: 7 },
      DOUBLE: { precision: 15 }
    },
    generic: {
      VARCHAR: 255,
      CHAR: 1,
      TEXT: 65535,
      DECIMAL: { precision: 10, scale: 2 },
      NUMERIC: { precision: 10, scale: 2 },
      FLOAT: { precision: 7 }
    }
  }
};

export const SettingsContext = createContext(defaultSettings);

export default function SettingsContextProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Migrate settings to include defaultTypeSizes
        const migratedSettings = {
          ...defaultSettings,
          ...parsed,
          defaultTypeSizes: {
            ...defaultSettings.defaultTypeSizes,
            ...(parsed.defaultTypeSizes || {})
          }
        };
        // Verify that all databases have their settings
        Object.keys(defaultSettings.defaultTypeSizes).forEach(dbKey => {
          if (!migratedSettings.defaultTypeSizes[dbKey]) {
            migratedSettings.defaultTypeSizes[dbKey] = defaultSettings.defaultTypeSizes[dbKey];
          }
        });
        setSettings(migratedSettings);
      } catch (error) {
        console.warn("Error parsing saved settings, using defaults:", error);
        setSettings(defaultSettings);
      }
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
