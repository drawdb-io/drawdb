function validateDateStr(str) {
  return /^(?!0000)(?!00)(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9]|3[01])|(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31))$/.test(
    str
  );
}

function checkDefault(field) {
  if (field.default === "") return true;

  switch (field.type) {
    case "INT":
    case "BIGINT":
    case "SMALLINT":
      return /^-?\d*$/.test(field.default);
    case "ENUM":
    case "SET":
      return field.values.includes(field.default);
    case "CHAR":
    case "VARCHAR":
      return field.default.length <= field.size;
    case "BINARY":
    case "VARBINARY":
      return (
        field.default.length <= field.size && /^[01]+$/.test(field.default)
      );
    case "BOOLEAN":
      return (
        field.default.trim() === "false" || field.default.trim() === "true"
      );
    case "FLOAT":
    case "DECIMAL":
    case "DOUBLE":
    case "NUMERIC":
    case "REAL":
      return /^-?\d*.?\d+$/.test(field.default);
    case "DATE":
      return validateDateStr(field.default);
    case "TIME":
      return /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/.test(field.default);
    case "TIMESTAMP": {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");

      return parseInt(date[0]) >= 1970 && parseInt(date[0]) <= 2038;
    }
    case "DATETIME": {
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");

      return parseInt(d[0]) >= 1000 && parseInt(d[0]) <= 9999;
    }
    default:
      return true;
  }
}

export function getIssues(diagram) {
  const issues = [];
  const duplicateTableNames = {};

  diagram.tables.forEach((table) => {
    if (table.name === "") {
      issues.push(`Declared a table with no name`);
    }

    if (duplicateTableNames[table.name]) {
      issues.push(`Duplicate table by the name "${table.name}"`);
    } else {
      duplicateTableNames[table.name] = true;
    }

    const duplicateFieldNames = {};
    let hasPrimaryKey = false;

    table.fields.forEach((field) => {
      if (field.primary) {
        hasPrimaryKey = true;
      }
      if (field.name === "") {
        issues.push(`Empty field name in table "${table.name}"`);
      }

      if (field.type === "") {
        issues.push(`Empty field type in table "${table.name}"`);
      } else if (field.type === "ENUM" || field.type === "SET") {
        if (!field.values || field.values.length === 0) {
          issues.push(
            `"${field.name}" field of table "${table.name}" is of type ${field.type} but no values have been specified`
          );
        }
      }

      if (!checkDefault(field)) {
        issues.push(
          `Default value for field "${field.name}" in table "${table.name}" does not match its type.`
        );
      }

      if (field.notNull && field.default.toLowerCase() === "null") {
        issues.push(
          `"${field.name}" field of table "${table.name}" is NOT NULL but has default NULL`
        );
      }

      if (field.type === "DOUBLE" && field.size !== "") {
        issues.push(
          `Specifying number of digits for floating point data types is deprecated.`
        );
      }

      if (duplicateFieldNames[field.name]) {
        issues.push(`Duplicate table fields in table "${table.name}"`);
      } else {
        duplicateFieldNames[field.name] = true;
      }
    });

    const duplicateIndices = {};
    table.indices.forEach((index) => {
      if (duplicateIndices[index.name]) {
        issues.push(`Duplicate index by the name "${index.name}"`);
      } else {
        duplicateIndices[index.name] = true;
      }
    });

    table.indices.forEach((index) => {
      if (index.fields.length === 0) {
        issues.push(`Empty index type in table "${table.name}"`);
      }
    });

    if (!hasPrimaryKey) {
      issues.push(`Table "${table.name}" has no primary key`);
    }
  });

  const duplicateTypeNames = {};
  diagram.types.forEach((type) => {
    if (type.name === "") {
      issues.push(`Declared a type with no name`);
    }

    if (duplicateTypeNames[type.name]) {
      issues.push(`Duplicate types by the name "${type.name}"`);
    } else {
      duplicateTypeNames[type.name] = true;
    }

    if (type.fields.length === 0) {
      issues.push(`Declared an empty type "${type.name}" with no fields`);
      return;
    }

    const duplicateFieldNames = {};
    type.fields.forEach((field) => {
      if (field.name === "") {
        issues.push(`Empty field name in type "${type.name}"`);
      }

      if (field.type === "") {
        issues.push(`Empty field type in "${type.name}"`);
      } else if (field.type === "ENUM" || field.type === "SET") {
        if (!field.values || field.values.length === 0) {
          issues.push(
            `"${field.name}" field of type "${type.name}" is of type ${field.type} but no values have been specified`
          );
        }
      }

      if (field.type === "DOUBLE" && field.size !== "") {
        issues.push(
          `Specifying number of digits for floating point data types is deprecated.`
        );
      }

      if (duplicateFieldNames[field.name]) {
        issues.push(`Duplicate type fields in "${type.name}"`);
      } else {
        duplicateFieldNames[field.name] = true;
      }
    });
  });

  const duplicateFKName = {};
  diagram.relationships.forEach((r) => {
    if (duplicateFKName[r.name]) {
      issues.push(`Duplicate reference by the name "${r.name}"`);
    } else {
      duplicateFKName[r.name] = true;
    }

    if (
      diagram.tables[r.startTableId].fields[r.startFieldId].type !==
      diagram.tables[r.endTableId].fields[r.endFieldId].type
    ) {
      issues.push(`Referencing column "${
        diagram.tables[r.endTableId].fields[r.endFieldId].name
      }" and referenced column "${
        diagram.tables[r.startTableId].fields[r.startFieldId].name
      }" are incompatible.
        `);
    }
  });

  const visitedTables = new Set();

  function checkCircularRelationships(tableId, visited = []) {
    if (visited.includes(tableId)) {
      issues.push(
        `Circular relationship involving table: "${diagram.tables[tableId].name}"`
      );
      return;
    }

    visited.push(tableId);
    visitedTables.add(tableId);

    diagram.relationships.forEach((r) => {
      if (r.startTableId === tableId && r.startTableId !== r.endTableId) {
        checkCircularRelationships(r.endTableId, [...visited]);
      }
    });
  }

  diagram.tables.forEach((table) => {
    if (!visitedTables.has(table.id)) {
      checkCircularRelationships(table.id);
    }
  });

  return issues;
}
