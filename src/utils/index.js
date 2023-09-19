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

function jsonToSQL(obj) {
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
              }\` ${field.type}${
                field.type === "VARCHAR"
                  ? `(${field.length})`
                  : field.type === "ENUM" || field.type === "SET"
                  ? `(${field.values.map((v) => `"${v}"`).join(", ")})`
                  : ""
              }${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " AUTO_INCREMENT" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== ""
                  ? ` DEFAULT ${
                      (field.type === "VARCHAR" || field.type === "ENUM") &&
                      field.default.toLowerCase() !== "null"
                        ? `"${field.default}"`
                        : `${field.default}`
                    }`
                  : ""
              }${field.check === "" ? "" : ` CHECK (${field.check})`}`
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

function arrayIsEqual(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

function checkDefault(field) {
  if (field.default === "") return true;

  switch (field.type) {
    case "INT":
    case "BIGINT":
    case "SMALLINT":
      return /^\d*$/.test(field.default);
    case "ENUM":
    case "SET":
      return field.values.includes(field.default);
    case "CHAR":
    case "VARCHAR":
      return field.default.length <= field.length;
    case "BOOLEAN":
      return (
        field.default.trim() === "false" || field.default.trim() === "true"
      );
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
            `"${field.name}" field of table "${table.name}" is of type ${field.type} but values have been specified`
          );
        }
      }

      if (!checkDefault(field)) {
        issues.push(
          `Default value for field "${field.name}" in table "${table.name}" does not match its type.`
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

  const duplicateFKName = {};
  diagram.relationships.forEach((relationship) => {
    if (duplicateFKName[relationship.name]) {
      issues.push(`Duplicate relationship by the name "${relationship.name}"`);
    } else {
      duplicateFKName[relationship.name] = true;
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
  jsonToSQL,
  validateDiagram,
  arrayIsEqual,
};
