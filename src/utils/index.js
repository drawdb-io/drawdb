import { Validator } from "jsonschema";
import { ddbSchema, jsonSchema } from "../schemas";

function enterFullscreen() {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function jsonDiagramIsValid(obj) {
  return new Validator().validate(obj, jsonSchema).valid;
}

function ddbDiagramIsValid(obj) {
  return new Validator().validate(obj, ddbSchema).valid;
}

function dataURItoBlob(dataUrl) {
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], { type: mimeString });
}

function getTypeString(field, dbms = "mysql") {
  if (dbms === "mysql") {
    if (field.type === "UUID") {
      return `VARCHAR(36)`;
    }
    if (isSized(field.type)) {
      return `${field.type}(${field.size})`;
    }
    if (hasPrecision(field.type) && field.size !== "") {
      return `${field.type}${field.size}`;
    }
    if (field.type === "SET" || field.type === "ENUM") {
      return `${field.type}(${field.values.map((v) => `"${v}"`).join(", ")})`;
    }
    return field.type;
  } else if (dbms === "postgres") {
    if (field.type === "SMALLINT" && field.increment) {
      return "smallserial";
    }
    if (field.type === "INT" && field.increment) {
      return "serial";
    }
    if (field.type === "BIGINT" && field.increment) {
      return "bigserial";
    }
    if (field.type === "ENUM") {
      return `${field.name}_t`;
    }
    if (field.type === "SET") {
      return `${field.name}_t[]`;
    }
    if (field.type === "TIMESTAMP") {
      return "TIMESTAMPTZ";
    }
    if (field.type === "DATETIME") {
      return `timestamp`;
    }
    if (isSized(field.type)) {
      const type =
        field.type === "BINARY"
          ? "bit"
          : field.type === "VARBINARY"
          ? "bit varying"
          : field.type.toLowerCase();
      return `${type}(${field.size})`;
    }
    if (hasPrecision(field.type) && field.size !== "") {
      return `${field.type}${field.size}`;
    }
    return field.type.toLowerCase();
  }
}

function hasQuotes(type) {
  return [
    "CHAR",
    "VARCHAR",
    "BINARY",
    "VARBINARY",
    "ENUM",
    "DATE",
    "TIME",
    "TIMESTAMP",
    "DATETIME",
  ].includes(type);
}

function jsonToMySQL(obj) {
  return `${obj.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/* ${table.comment} */\n`
        }CREATE TABLE \`${table.name}\` (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t\`${
                field.name
              }\` ${getTypeString(field)}${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " AUTO_INCREMENT" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== ""
                  ? ` DEFAULT ${
                      hasQuotes(field.type) &&
                      field.default.toLowerCase() !== "null"
                        ? `"${field.default}"`
                        : `${field.default}`
                    }`
                  : ""
              }${
                field.check === "" || !hasCheck(field.type)
                  ? ""
                  : ` CHECK(${field.check})`
              }`
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `\`${f.name}\``)
                .join(", ")})`
            : ""
        }\n);\n${
          table.indices.length > 0
            ? `\n${table.indices.map(
                (i) =>
                  `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX \`${
                    i.name
                  }\`\nON \`${table.name}\` (${i.fields
                    .map((f) => `\`${f}\``)
                    .join(", ")});`
              )}`
            : ""
        }`
    )
    .join("\n")}\n${obj.references
    .map(
      (r) =>
        `ALTER TABLE \`${
          obj.tables[r.startTableId].name
        }\`\nADD FOREIGN KEY(\`${
          obj.tables[r.startTableId].fields[r.startFieldId].name
        }\`) REFERENCES \`${obj.tables[r.endTableId].name}\`(\`${
          obj.tables[r.endTableId].fields[r.endFieldId].name
        }\`)\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`
    )
    .join("\n")}`;
}

function jsonToPostgreSQL(obj) {
  return `${obj.types.map(
    (type) =>
      `${type.fields
        .filter((f) => f.type === "ENUM" || f.type === "SET")
        .map(
          (f) =>
            `CREATE TYPE "${f.name}_t" AS ENUM (${f.values
              .map((v) => `'${v}'`)
              .join(", ")});\n`
        )}CREATE TYPE ${type.name} AS (\n${type.fields
        .map((f) => `\t${f.name} ${getTypeString(f, "postgres")}`)
        .join("\n")}\n);`
  )}\n${obj.tables
    .map(
      (table) =>
        `${table.comment === "" ? "" : `/**\n${table.comment}\n*/\n`}${
          table.fields.filter((f) => f.type === "ENUM" || f.type === "SET")
            .length > 0
            ? `${table.fields
                .filter((f) => f.type === "ENUM" || f.type === "SET")
                .map(
                  (f) =>
                    `CREATE TYPE "${f.name}_t" AS ENUM (${f.values
                      .map((v) => `'${v}'`)
                      .join(", ")});\n\n`
                )}`
            : ""
        }CREATE TABLE "${table.name}" (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
                field.name
              }" ${getTypeString(field, "postgres")}${
                field.notNull ? " NOT NULL" : ""
              }${
                field.default !== ""
                  ? ` DEFAULT ${
                      hasQuotes(field.type) &&
                      field.default.toLowerCase() !== "null"
                        ? `'${field.default}'`
                        : `${field.default}`
                    }`
                  : ""
              }${
                field.check === "" || !hasCheck(field.type)
                  ? ""
                  : ` CHECK(${field.check})`
              }`
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `"${f.name}"`)
                .join(", ")})`
            : ""
        }\n);\n${
          table.indices.length > 0
            ? `${table.indices.map(
                (i) =>
                  `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX "${
                    i.name
                  }"\nON "${table.name}" (${i.fields
                    .map((f) => `"${f}"`)
                    .join(", ")});`
              )}`
            : ""
        }`
    )
    .join("\n")}\n${obj.references
    .map(
      (r) =>
        `ALTER TABLE "${obj.tables[r.startTableId].name}"\nADD FOREIGN KEY("${
          obj.tables[r.startTableId].fields[r.startFieldId].name
        }") REFERENCES "${obj.tables[r.endTableId].name}"("${
          obj.tables[r.endTableId].fields[r.endFieldId].name
        }")\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`
    )
    .join("\n")}`;
}

function arrayIsEqual(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

function isSized(type) {
  return ["CHAR", "VARCHAR", "BINARY", "VARBINARY", "TEXT", "FLOAT"].includes(
    type
  );
}

function hasPrecision(type) {
  return ["DOUBLE", "NUMERIC", "DECIMAL"].includes(type);
}

function hasCheck(type) {
  return [
    "INT",
    "SMALLINT",
    "BIGINT",
    "CHAR",
    "VARCHAR",
    "FLOAT",
    "DECIMAL",
    "DOUBLE",
    "NUMERIC",
    "REAL",
  ].includes(type);
}

function getSize(type) {
  switch (type) {
    case "CHAR":
    case "BINARY":
      return 1;
    case "VARCHAR":
    case "VARBINARY":
      return 255;
    case "TEXT":
      return 65535;
    default:
      return "";
  }
}

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
    case "TIMESTAMP":
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");

      return parseInt(date[0]) >= 1970 && parseInt(date[0]) <= 2038;
    case "DATETIME":
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");

      return parseInt(d[0]) >= 1000 && parseInt(d[0]) <= 9999;
    default:
      return true;
  }
}

function validateDiagram(diagram) {
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

    diagram.relationships.forEach((relationship) => {
      if (relationship.startTableId === tableId) {
        checkCircularRelationships(relationship.endTableId, [...visited]);
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

export {
  enterFullscreen,
  exitFullscreen,
  jsonDiagramIsValid,
  ddbDiagramIsValid,
  dataURItoBlob,
  jsonToMySQL,
  jsonToPostgreSQL,
  validateDiagram,
  arrayIsEqual,
  isSized,
  getSize,
  hasPrecision,
  validateDateStr,
  hasCheck,
};
