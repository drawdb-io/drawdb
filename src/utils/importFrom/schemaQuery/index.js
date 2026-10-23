import { DB } from "../../../data/constants";
import { reconcileDbml } from "../../dbml/reconcile";
import { mariadb } from "./mariadb";
import { mssql } from "./mssql";
import { mysql } from "./mysql";
import { oraclesql } from "./oraclesql";
import { postgres } from "./postgres";
import { sqlite } from "./sqlite";

export const schemaQueries = {
  [DB.MYSQL]: mysql,
  [DB.POSTGRES]: postgres,
  [DB.SQLITE]: sqlite,
  [DB.MARIADB]: mariadb,
  [DB.MSSQL]: mssql,
  [DB.ORACLESQL]: oraclesql,
};

const structuralKeys = new Set([
  "tables",
  "fields",
  "indices",
  "relationships",
  "enums",
  "values",
  "startFieldNames",
  "endFieldNames",
  "skipped",
]);
const flagKeys = new Set([
  "primary",
  "unique",
  "notNull",
  "increment",
  "isArray",
  "unsigned",
]);
const textKeys = new Set(["comment", "default", "size"]);

function reviver(key, value) {
  if (flagKeys.has(key)) {
    return value === true || value === 1 || value === "1" || value === "true";
  }
  if (textKeys.has(key)) return value == null ? "" : String(value);
  if (
    structuralKeys.has(key) &&
    typeof value === "string" &&
    /^\s*[[{]/.test(value)
  ) {
    return JSON.parse(value, reviver);
  }
  return value;
}

export function fromSchemaQuery(raw, database) {
  const src = raw.replace(/[\r\n]/g, "");
  const start = src.indexOf("{");
  if (start === -1) throw new Error("invalid");

  let depth = 0;
  let inString = false;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      end = i;
      break;
    }
  }

  let text = src.slice(start, end === -1 ? src.lastIndexOf("}") + 1 : end + 1);
  let parsed;
  try {
    parsed = JSON.parse(text, reviver);
  } catch {
    text = text.replace(/""/g, '"');
    try {
      parsed = JSON.parse(text, reviver);
    } catch {
      throw new Error(end === -1 ? "truncated" : "invalid");
    }
  }

  if (!Array.isArray(parsed?.tables) || !Array.isArray(parsed?.relationships)) {
    throw new Error("invalid");
  }

  return {
    ...reconcileDbml({ enums: [], ...parsed }, null, database),
    types: [],
    skipped: parsed.skipped ?? {},
  };
}
