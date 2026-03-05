import { DB } from "../../data/constants";

function quoteIdentifier(identifier, database) {
  if (database === DB.MYSQL || database === DB.MARIADB) {
    return `\`${identifier}\``;
  }
  if (database === DB.MSSQL) {
    return `[${identifier}]`;
  }
  return `"${identifier}"`;
}

function escapeString(value) {
  return value.replace(/[']/g, "''");
}

function toSqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "string" && value.startsWith("__RAW__:")) {
    return value.slice("__RAW__:".length);
  }
  return `'${escapeString(String(value))}'`;
}

function stringMaxLength(size) {
  if (!size) return null;
  const parsed = Number.parseInt(String(size).split(",")[0], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function withSizeLimit(value, field) {
  const max = stringMaxLength(field.size);
  if (!max || typeof value !== "string") return value;
  return value.slice(0, max);
}

function isIntegerType(type) {
  const t = type.toUpperCase();
  return (
    t.includes("INT") ||
    t === "SERIAL" ||
    t === "BIGSERIAL" ||
    t === "SMALLSERIAL" ||
    t === "NUMBER" ||
    t === "LONG"
  );
}

function isDecimalType(type) {
  const t = type.toUpperCase();
  return (
    t.includes("DECIMAL") ||
    t.includes("NUMERIC") ||
    t.includes("FLOAT") ||
    t.includes("DOUBLE") ||
    t.includes("REAL") ||
    t.includes("MONEY")
  );
}

function generateDate(index) {
  const day = ((index % 28) + 1).toString().padStart(2, "0");
  return `2024-01-${day}`;
}

function generateTime(index) {
  const hour = (9 + (index % 10)).toString().padStart(2, "0");
  const minute = ((index * 7) % 60).toString().padStart(2, "0");
  return `${hour}:${minute}:00`;
}

function generateUUID(index) {
  const n = (index + 1).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${n}`;
}

function valueForField(field, table, rowIndex) {
  const type = (field.type || "").toUpperCase();

  if (field.increment || isIntegerType(type)) return rowIndex + 1;
  if (isDecimalType(type)) return rowIndex + 1.25;
  if (type === "BOOLEAN") return rowIndex % 2 === 0;
  if (type === "BIT") return rowIndex % 2;
  if (type === "DATE") return generateDate(rowIndex);
  if (
    type === "DATETIME" ||
    type === "DATETIME2" ||
    type === "DATETIMEOFFSET" ||
    type === "SMALLDATETIME" ||
    type === "TIMESTAMP"
  ) {
    return `${generateDate(rowIndex)} ${generateTime(rowIndex)}`;
  }
  if (type === "TIME") return generateTime(rowIndex);
  if (type === "YEAR") return "2024";
  if (type === "UUID" || type === "UNIQUEIDENTIFIER") {
    return generateUUID(rowIndex);
  }
  if (type === "JSON" || type === "JSONB") {
    return JSON.stringify({
      sample: rowIndex + 1,
      table: table.name,
      field: field.name,
    });
  }
  if (type === "XML") {
    return `<row id="${rowIndex + 1}">${table.name}</row>`;
  }
  if (type === "ENUM" && Array.isArray(field.values) && field.values.length) {
    return field.values[rowIndex % field.values.length];
  }
  if (type === "SET" && Array.isArray(field.values) && field.values.length) {
    const first = field.values[rowIndex % field.values.length];
    const second = field.values[(rowIndex + 1) % field.values.length];
    return first === second ? first : `${first},${second}`;
  }
  if (
    type.includes("BINARY") ||
    type.includes("BLOB") ||
    type === "RAW" ||
    type === "VARBIT"
  ) {
    return "1010";
  }

  return withSizeLimit(`${table.name}_${field.name}_${rowIndex + 1}`, field);
}

function buildTableOrder(tables, references) {
  const tableIds = new Set(tables.map((table) => table.id));
  const indegree = new Map(tables.map((table) => [table.id, 0]));
  const edges = new Map(tables.map((table) => [table.id, new Set()]));

  references.forEach((ref) => {
    const parentId = ref.endTableId;
    const childId = ref.startTableId;
    if (!tableIds.has(parentId) || !tableIds.has(childId) || parentId === childId)
      return;
    if (edges.get(parentId).has(childId)) return;
    edges.get(parentId).add(childId);
    indegree.set(childId, indegree.get(childId) + 1);
  });

  const queue = tables.filter((table) => indegree.get(table.id) === 0);
  const ordered = [];

  while (queue.length) {
    const current = queue.shift();
    ordered.push(current);
    edges.get(current.id).forEach((nextId) => {
      indegree.set(nextId, indegree.get(nextId) - 1);
      if (indegree.get(nextId) === 0) {
        const nextTable = tables.find((table) => table.id === nextId);
        if (nextTable) queue.push(nextTable);
      }
    });
  }

  if (ordered.length === tables.length) return ordered;

  const visitedIds = new Set(ordered.map((table) => table.id));
  return [...ordered, ...tables.filter((table) => !visitedIds.has(table.id))];
}

export function generateSampleDataSQL(
  diagram,
  { rowsPerTable = 5 } = {},
) {
  const tables = diagram?.tables ?? [];
  const references = diagram?.references ?? [];
  const database = diagram?.database ?? DB.GENERIC;

  if (tables.length === 0) {
    return "-- No tables found. Add tables to generate sample data.";
  }

  const referencesByChildField = new Map();
  references.forEach((reference) => {
    referencesByChildField.set(
      `${reference.startTableId}:${reference.startFieldId}`,
      reference,
    );
  });

  const rowsByTableId = new Map();
  const orderedTables = buildTableOrder(tables, references);

  const statements = orderedTables.map((table) => {
    const tableRows = [];

    for (let rowIndex = 0; rowIndex < rowsPerTable; rowIndex += 1) {
      const row = {};

      table.fields.forEach((field) => {
        const ref = referencesByChildField.get(`${table.id}:${field.id}`);
        if (ref && rowsByTableId.has(ref.endTableId)) {
          const parentRows = rowsByTableId.get(ref.endTableId);
          const parentRow = parentRows[rowIndex % parentRows.length];
          row[field.id] = parentRow[ref.endFieldId];
          return;
        }

        row[field.id] = valueForField(field, table, rowIndex);
      });

      tableRows.push(row);
    }

    rowsByTableId.set(table.id, tableRows);

    const columns = table.fields
      .map((field) => quoteIdentifier(field.name, database))
      .join(", ");

    const values = tableRows
      .map(
        (row) =>
          `(${table.fields
            .map((field) => toSqlLiteral(row[field.id]))
            .join(", ")})`,
      )
      .join(",\n");

    return `INSERT INTO ${quoteIdentifier(table.name, database)} (${columns}) VALUES\n${values};`;
  });

  return `-- Sample data generated from diagram tables\n${statements.join("\n\n")}`;
}
