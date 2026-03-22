import { Validator } from "jsonschema";
import { DB } from "../data/constants";
import { customTypeEntrySchema } from "../data/schemas";
import { dbToTypes } from "../data/datatypes";

const STORAGE_KEY = "custom_types";
const validator = new Validator();
const validDatabases = new Set(Object.values(DB));

function isValidEntry(entry) {
  return validator.validate(entry, customTypeEntrySchema).valid;
}

function migrateIfNeeded(parsed) {
  if (Array.isArray(parsed)) {
    const result = {};
    for (const item of parsed) {
      if (!item.type || !item.database) continue;
      const db = item.database;
      const name = item.type.toUpperCase();
      if (!validDatabases.has(db)) continue;
      if (!result[db]) result[db] = {};
      result[db][name] = { type: name, color: item.color || "#ccc" };
    }
    return result;
  }
  return parsed;
}

export function getCustomTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = migrateIfNeeded(JSON.parse(raw));
    if (typeof parsed !== "object" || parsed === null) return {};
    const result = {};
    for (const [db, types] of Object.entries(parsed)) {
      if (!validDatabases.has(db)) continue;
      if (typeof types !== "object" || types === null) continue;
      for (const [name, entry] of Object.entries(types)) {
        if (!isValidEntry(entry)) continue;
        if (!result[db]) result[db] = {};
        result[db][name] = { type: entry.type, color: entry.color };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function getCustomTypesForDb(database) {
  const all = getCustomTypes();
  const dbTypes = all[database];
  if (!dbTypes) return {};
  const result = {};
  for (const [name, entry] of Object.entries(dbTypes)) {
    result[name] = {
      type: entry.type,
      color: entry.color,
      checkDefault: () => true,
      hasCheck: false,
      isSized: false,
      hasPrecision: false,
      canIncrement: false,
      noDefault: false,
      isCustom: true,
    };
  }
  return result;
}

export function saveCustomTypes(types) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

const BLOB_FALLBACK = {
  type: "BLOB",
  color: "",
  checkDefault: () => true,
  hasCheck: false,
  isSized: false,
  hasPrecision: false,
  canIncrement: false,
  noDefault: true,
  isCustom: false,
};

export function resolveType(database, typeName) {
  const builtIn = dbToTypes[database][typeName];
  if (builtIn) return builtIn;

  const customDb = getCustomTypesForDb(database);
  if (customDb[typeName]) return customDb[typeName];

  return dbToTypes[database]["BLOB"] || BLOB_FALLBACK;
}

export function mergeCustomTypes(incoming) {
  if (typeof incoming !== "object" || incoming === null) return;
  const existing = getCustomTypes();
  for (const [db, types] of Object.entries(incoming)) {
    if (!validDatabases.has(db)) continue;
    if (typeof types !== "object" || types === null) continue;
    if (!existing[db]) existing[db] = {};
    for (const [name, entry] of Object.entries(types)) {
      if (!isValidEntry(entry)) continue;
      if (!existing[db][name]) {
        existing[db][name] = { type: entry.type, color: entry.color };
      }
    }
  }
  saveCustomTypes(existing);
}
