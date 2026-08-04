import { dbToTypes } from "../../data/datatypes";

const IDENT_SAFE_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function quoteIdentifier(name) {
  const value = String(name ?? "");
  if (IDENT_SAFE_RE.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function isInlineEnumType(type) {
  return type === "ENUM" || type === "SET";
}

export function inlineEnumTypeName(field) {
  const values = Array.isArray(field.values) ? field.values : [];
  return `${field.name}_${values.join("_")}_t`;
}

export function typeTakesSize(type, database) {
  const meta = dbToTypes[database][type];
  return Boolean(meta && (meta.isSized || meta.hasPrecision));
}

export function dbmlTypeName(field, enumNamesByUpperCase) {
  const type = String(field.type ?? "");
  if (isInlineEnumType(type)) return inlineEnumTypeName(field);

  const declared = enumNamesByUpperCase?.get(type.toUpperCase());
  if (declared) return declared;

  if (type.toUpperCase() === "TIMESTAMP WITH TIME ZONE") return "timestamptz";

  return type.toLowerCase();
}

export function dbmlFieldSize(field, database) {
  if (!typeTakesSize(field.type, database)) return "";
  if (field.size === undefined || field.size === null || field.size === "") {
    return "";
  }
  return `(${field.size})`;
}
