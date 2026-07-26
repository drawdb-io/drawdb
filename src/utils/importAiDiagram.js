import { dbToTypes } from "../data/datatypes";
import { arrangeTables } from "./arrangeTables";
import { jsonDiagramIsValid } from "./validateSchema";

const TYPE_ALIASES = {
  INT: ["INTEGER"],
  INTEGER: ["INT"],
  BOOL: ["BOOLEAN"],
  BOOLEAN: ["BOOL", "BIT"],
  "CHARACTER VARYING": ["VARCHAR"],
  "CHARACTER": ["CHAR"],
  "TIMESTAMP WITH TIME ZONE": ["TIMESTAMPTZ", "TIMESTAMP"],
  "TIMESTAMP WITHOUT TIME ZONE": ["TIMESTAMP", "DATETIME"],
  "TIME WITH TIME ZONE": ["TIMETZ", "TIME"],
  "TIME WITHOUT TIME ZONE": ["TIME"],
  "DOUBLE PRECISION": ["DOUBLE", "FLOAT"],
  DOUBLE: ["DOUBLE PRECISION", "FLOAT"],
  SERIAL: ["INTEGER", "INT"],
  BIGSERIAL: ["BIGINT"],
  UUID: ["VARCHAR", "TEXT"],
  JSONB: ["JSON"],
  BYTEA: ["BLOB", "BINARY"],
  BLOB: ["BYTEA", "BINARY"],
  CLOB: ["TEXT"],
  NUMBER: ["NUMERIC", "DECIMAL"],
  STRING: ["VARCHAR", "TEXT"],
};

const FALLBACK_TYPES = ["VARCHAR", "TEXT", "BLOB", "BYTEA", "CHAR"];

export function allowedTypesFor(database) {
  const types = dbToTypes[database];
  return types ? Object.keys(types) : [];
}

function resolveType(rawType, validTypes, declaredNames) {
  const trimmed = String(rawType ?? "").trim();
  const upper = trimmed.toUpperCase();

  if (validTypes[upper]) return { type: upper };

  const declared = declaredNames.get(upper);
  if (declared) return { type: declared };

  for (const alias of TYPE_ALIASES[upper] ?? []) {
    if (validTypes[alias]) return { type: alias };
  }

  const fallback = FALLBACK_TYPES.find((candidate) => validTypes[candidate]);
  return {
    type: fallback ?? upper,
    warning: trimmed
      ? `Type "${trimmed}" is not available for this database, imported as ${fallback}.`
      : `A column had no type, imported as ${fallback}.`,
  };
}

export function normalizeAiDiagram(raw, database) {
  if (!raw || !Array.isArray(raw.tables) || !raw.tables.length) {
    throw new Error("The AI import returned no tables.");
  }

  const warnings = [];
  const validTypes = dbToTypes[database] || {};
  const enums = Array.isArray(raw.enums) ? raw.enums : [];
  const types = Array.isArray(raw.types) ? raw.types : [];

  const declaredNames = new Map();
  for (const entry of [...enums, ...types]) {
    if (entry?.name) declaredNames.set(String(entry.name).toUpperCase(), entry.name);
  }

  const tables = raw.tables.map((table) => ({
    ...table,
    fields: (table.fields ?? []).map((field) => {
      const { type, warning } = resolveType(field.type, validTypes, declaredNames);
      if (warning) warnings.push(warning);
      return { ...field, type };
    }),
  }));

  const relationships = (
    Array.isArray(raw.relationships) ? raw.relationships : []
  ).filter((relationship) => {
    const startTable = tables.find((t) => t.id === relationship.startTableId);
    const endTable = tables.find((t) => t.id === relationship.endTableId);
    const resolves =
      startTable?.fields.some((f) => f.id === relationship.startFieldId) &&
      endTable?.fields.some((f) => f.id === relationship.endFieldId);
    if (!resolves) {
      warnings.push(
        `Skipped relationship "${relationship.name}" because it did not resolve to a column.`,
      );
    }
    return resolves;
  });

  const diagram = {
    tables,
    relationships: relationships.map((relationship, id) => ({
      ...relationship,
      id,
    })),
    enums,
    types,
  };

  if (!jsonDiagramIsValid({ ...diagram, notes: [], subjectAreas: [] })) {
    throw new Error(
      "The AI import produced a diagram we could not read. Please try again.",
    );
  }

  arrangeTables(diagram);

  return { diagram, warnings };
}
