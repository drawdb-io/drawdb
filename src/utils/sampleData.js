import { dbToTypes } from "../data/datatypes";

const PRIME_LIKE_VALUES = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

function pickPrimeLike(index) {
  return PRIME_LIKE_VALUES[index % PRIME_LIKE_VALUES.length];
}

function generateValue(field, database, index) {
  const type = field.type?.toUpperCase() || "";

  if (field.default && typeof field.default === "string") {
    return field.default;
  }

  if (type === "MYPRIMETYPE") {
    return String(pickPrimeLike(index));
  }

  if (
    type === "BOOLEAN" ||
    type === "BOOL" ||
    (dbToTypes[database][type] && dbToTypes[database][type].color === "text-violet-500")
  ) {
    return index % 2 === 0 ? "true" : "false";
  }

  if (
    ["INT", "INTEGER", "SMALLINT", "BIGINT", "TINYINT", "MEDIUMINT", "NUMBER"].includes(
      type,
    )
  ) {
    if (field.increment || field.primary) {
      return String(index + 1);
    }
    return String((index + 1) * 10);
  }

  if (
    [
      "DECIMAL",
      "NUMERIC",
      "FLOAT",
      "DOUBLE",
      "REAL",
      "MONEY",
      "SMALLMONEY",
      "DOUBLE PRECISION",
    ].includes(type)
  ) {
    return (index + 1 + 0.5).toFixed(2);
  }

  if (
    [
      "CHAR",
      "NCHAR",
      "VARCHAR",
      "VARCHAR2",
      "NVARCHAR",
      "NVARCHAR2",
      "TEXT",
      "TINYTEXT",
      "MEDIUMTEXT",
      "LONGTEXT",
      "CLOB",
      "NCLOB",
    ].includes(type)
  ) {
    const base = field.name || type.toLowerCase();
    return `${base}_${index + 1}`;
  }

  if (type === "DATE") {
    const base = new Date(2024, 0, 1 + index);
    return base.toISOString().slice(0, 10);
  }

  if (type === "TIME") {
    const h = (index * 3) % 24;
    const m = (index * 7) % 60;
    const s = (index * 11) % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  if (type === "TIMESTAMP" || type === "DATETIME") {
    const base = new Date(2024, 0, 1, 9, 0, 0);
    base.setDate(base.getDate() + index);
    return base.toISOString().slice(0, 19).replace("T", " ");
  }

  if (type === "ENUM" && field.values && field.values.length > 0) {
    return field.values[index % field.values.length];
  }

  if (type === "SET" && field.values && field.values.length > 0) {
    const count = Math.max(1, Math.min(3, field.values.length));
    const start = index % field.values.length;
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(field.values[(start + i) % field.values.length]);
    }
    return selected.join(",");
  }

  if (type === "UUID" || type === "UNIQUEIDENTIFIER") {
    const hex = (n) => n.toString(16).padStart(4, "0");
    const part = hex(index + 1);
    return `00000000-0000-0000-0000-${part}${part}${part}${part.slice(0, 4)}`;
  }

  if (type === "JSON" || type === "JSONB") {
    return JSON.stringify({ example: field.name || "value", index: index + 1 });
  }

  const base = field.name || type.toLowerCase() || "value";
  return `${base}_${index + 1}`;
}

export function generateSampleData(
  { tables, relationships, database },
  rowsPerTable = 5,
) {
  const result = tables.map((table) => {
    const rows = [];
    for (let i = 0; i < rowsPerTable; i++) {
      const row = {};
      table.fields.forEach((field) => {
        const key = field.name || `field_${field.id || i}`;
        row[key] = generateValue(field, database, i);
      });
      rows.push(row);
    }
    return {
      table: table.name,
      rows,
    };
  });

  return JSON.stringify(
    {
      database,
      tables: result,
      relationships: relationships.map((r) => ({
        name: r.name,
        fromTableId: r.startTableId,
        fromFieldId: r.startFieldId,
        toTableId: r.endTableId,
        toFieldId: r.endFieldId,
      })),
    },
    null,
    2,
  );
}

