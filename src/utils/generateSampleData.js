import { DB } from "../data/constants";
import { dbToTypes } from "../data/datatypes";

const SAMPLE_ROW_COUNT = 5;

/**
 * Generate a sample value for a field based on its type and row index
 */
function generateSampleValue(field, rowIndex, database) {
  const typeInfo = dbToTypes[database]?.[field.type] || dbToTypes[DB.GENERIC]?.[field.type];

  if (field.default && field.default !== "") {
    return field.default;
  }

  if (field.increment && field.primary) {
    return rowIndex + 1;
  }

  const type = (field.type || "").toUpperCase();

  // Integer types
  if (
    [
      "INT",
      "INTEGER",
      "SMALLINT",
      "BIGINT",
      "TINYINT",
      "MEDIUMINT",
      "SERIAL",
      "SMALLSERIAL",
      "BIGSERIAL",
      "NUMBER",
      "LONG",
    ].includes(type)
  ) {
    return rowIndex + 1;
  }

  // Decimal/float types
  if (
    ["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "MONEY", "SMALLMONEY"].includes(type)
  ) {
    return (rowIndex + 1) * 10.5;
  }

  // Boolean
  if (["BOOLEAN", "BIT"].includes(type)) {
    return rowIndex % 2 === 0 ? 1 : 0;
  }

  // Date types
  if (type === "DATE") {
    return `'${2024}-01-${String(rowIndex + 1).padStart(2, "0")}'`;
  }
  if (["DATETIME", "TIMESTAMP", "SMALLDATETIME", "DATETIME2", "DATETIMEOFFSET"].includes(type)) {
    return `'${2024}-01-${String(rowIndex + 1).padStart(2, "0")} 10:00:00'`;
  }
  if (["TIME", "TIMETZ"].includes(type)) {
    return `'${String(10 + rowIndex).padStart(2, "0")}:00:00'`;
  }
  if (type === "YEAR") {
    return 2024;
  }

  // UUID
  if (type === "UUID" || type === "UNIQUEIDENTIFIER") {
    const hex = (rowIndex + 1).toString(16).padStart(12, "0");
    return `'${"00000000-0000-0000-0000-".padEnd(36, "0").slice(0, -12) + hex}'`;
  }

  // ENUM
  if (type === "ENUM" && field.values?.length > 0) {
    const val = field.values[rowIndex % field.values.length];
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  // SET
  if (type === "SET" && field.values?.length > 0) {
    const val = field.values[0];
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  // String types (default)
  const stringSamples = [
    "Sample",
    "Example",
    "Test",
    "Demo",
    "Sample data",
  ];
  const str = stringSamples[rowIndex % stringSamples.length];
  return `'${str} ${rowIndex + 1}'`;
}

/**
 * Escape value for SQL - handles null and already-quoted values
 */
function formatValueForSQL(value, field, database) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string" && value.startsWith("'") && value.endsWith("'")) {
    return value;
  }
  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Generate sample INSERT statements for all tables in a diagram
 */
export function generateSampleData(diagram, options = {}) {
  const { rowCount = SAMPLE_ROW_COUNT, database } = options;
  const db = database || diagram.database || DB.MYSQL;
  const references = diagram.references || diagram.relationships || [];

  const lines = [];
  const tableOrder = getTableInsertOrder(diagram.tables, references);

  for (const table of tableOrder) {
    if (!table.fields || table.fields.length === 0) continue;

    const columns = table.fields
      .filter((f) => !f.increment || !f.primary)
      .map((f) => `\`${f.name}\``);

    if (columns.length === 0) continue;

    for (let i = 0; i < rowCount; i++) {
      const values = table.fields
        .filter((f) => !f.increment || !f.primary)
        .map((f) => {
          const val = generateSampleValue(f, i, db);
          return formatValueForSQL(val, f, db);
        });

      lines.push(
        `INSERT INTO \`${table.name}\` (${columns.join(", ")}) VALUES (${values.join(", ")});`,
      );
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Determine table order for insertion (parents before children for FK integrity)
 */
function getTableInsertOrder(tables, references) {
  if (!references || references.length === 0) {
    return [...tables];
  }

  const tableIds = new Set(tables.map((t) => t.id));
  const childToParent = new Map();
  for (const ref of references) {
    childToParent.set(ref.startTableId, ref.endTableId);
  }

  const ordered = [];
  const visited = new Set();

  function visit(tableId) {
    if (visited.has(tableId)) return;
    const parentId = childToParent.get(tableId);
    if (parentId && tableIds.has(parentId)) {
      visit(parentId);
    }
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      ordered.push(table);
      visited.add(tableId);
    }
  }

  for (const table of tables) {
    visit(table.id);
  }

  return ordered;
}
