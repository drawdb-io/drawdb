import { isFunction, strHasQuotes } from "./utils";
import {t} from "i18next";

function validateDateStr(str) {
  return /^(?!0000)(?!00)(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9]|3[01])|(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31))$/.test(
    str,
  );
}

function checkDefault(field) {
  if (field.default === "") return true;

  if (isFunction(field.default)) return true;

  if (!field.notNull && field.default.toLowerCase() === "null") return true;

  switch (field.type) {
    case "INT":
    case "BIGINT":
    case "SMALLINT":
      return /^-?\d*$/.test(field.default);
    case "SET": {
      const defaultValues = field.default.split(",");
      for (let i = 0; i < defaultValues.length; i++) {
        if (!field.values.includes(defaultValues[i].trim())) return false;
      }
      return true;
    }
    case "ENUM":
      return field.values.includes(field.default);
    case "CHAR":
    case "VARCHAR":
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    case "BINARY":
    case "VARBINARY":
      return (
        field.default.length <= field.size && /^[01]+$/.test(field.default)
      );
    case "BOOLEAN":
      return (
        field.default.trim().toLowerCase() === "false" ||
        field.default.trim().toLowerCase() === "true"
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
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
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
      issues.push(t("Page.editor.SidePanel.Issues.No issues were detected"));
    }

    if (duplicateTableNames[table.name]) {
      issues.push(t("Page.editor.SidePanel.Issues.Duplicate table by the name", {name: table.name}));
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
        issues.push(t("Page.editor.SidePanel.Issues.Empty field name in table", {name: table.name}));
      }

      if (field.type === "") {
        issues.push(t("Page.editor.SidePanel.Issues.Empty field type in table", {name: table.name}));
      } else if (field.type === "ENUM" || field.type === "SET") {
        if (!field.values || field.values.length === 0) {
          issues.push(
              t("Page.editor.SidePanel.Issues.noValues", {field: field, name: table.name})
          );
        }
      }

      if (!checkDefault(field)) {
        issues.push(
            t("Page.editor.SidePanel.Issues.typeNotMatch", {field: field.name, table: table.name})
        );
      }

      if (field.notNull && field.default.toLowerCase() === "null") {
        issues.push(
            t("Page.editor.SidePanel.Issues.valNowNull", {field: field.name, table: table.name})
        );
      }

      if (duplicateFieldNames[field.name]) {
        issues.push(t("Page.editor.SidePanel.Issues.Duplicate table fields in table", {name: table.name}));
      } else {
        duplicateFieldNames[field.name] = true;
      }
    });

    const duplicateIndices = {};
    table.indices.forEach((index) => {
      if (duplicateIndices[index.name]) {
        issues.push(t("Page.editor.SidePanel.Issues.Duplicate index by the name", {name: index.name}));
      } else {
        duplicateIndices[index.name] = true;
      }
    });

    table.indices.forEach((index) => {
      if (index.fields.length === 0) {
        issues.push(t("Page.editor.SidePanel.Issues.Empty index type in table", {name: table.name}));
      }
    });

    if (!hasPrimaryKey) {
      issues.push(t("Page.editor.SidePanel.Issues.noPrimaryKey", {name: table.name}));
    }
  });

  const duplicateTypeNames = {};
  diagram.types.forEach((type) => {
    if (type.name === "") {
      issues.push(t("Page.editor.SidePanel.Issues.TypeNoName"));
    }

    if (duplicateTypeNames[type.name]) {
      issues.push(t("Page.editor.SidePanel.Issues.TypeNameDuplicate", {name: type.name}));
    } else {
      duplicateTypeNames[type.name] = true;
    }

    if (type.fields.length === 0) {
      issues.push(t("Page.editor.SidePanel.Issues.EmptyType", {name: type.name}));
      return;
    }

    const duplicateFieldNames = {};
    type.fields.forEach((field) => {
      if (field.name === "") {
        issues.push(t("Page.editor.SidePanel.Issues.Empty field name in type", {name: type.name}));
      }

      if (field.type === "") {
        issues.push(t("Page.editor.SidePanel.Issues.Empty field type in", {name: type.name}));
      } else if (field.type === "ENUM" || field.type === "SET") {
        if (!field.values || field.values.length === 0) {
          issues.push(
              t("Page.editor.SidePanel.Issues.fieldNoVal", {field: field, name: type.name})
          );
        }
      }

      if (duplicateFieldNames[field.name]) {
        issues.push(t("Page.editor.SidePanel.Issues.Duplicate type fields in", {name: type.name}));
      } else {
        duplicateFieldNames[field.name] = true;
      }
    });
  });

  const duplicateFKName = {};
  diagram.relationships.forEach((r) => {
    if (duplicateFKName[r.name]) {
      issues.push(t("Page.editor.SidePanel.Issues.Duplicate reference by the name", {name: r.name}));
    } else {
      duplicateFKName[r.name] = true;
    }

    if (
      diagram.tables[r.startTableId].fields[r.startFieldId].type !==
      diagram.tables[r.endTableId].fields[r.endFieldId].type
    ) {
      issues.push(
          t("Page.editor.SidePanel.Issues.ReferencingColumnIncompatible",{
            "columA": diagram.tables[r.endTableId].fields[r.endFieldId].name,
            "columB": diagram.tables[r.startTableId].fields[r.startFieldId].name
          })
      );
    }
  });

  const visitedTables = new Set();

  function checkCircularRelationships(tableId, visited = []) {
    if (visited.includes(tableId)) {
      issues.push(
          t("Page.editor.SidePanel.Issues.Circular relationship involving table", {name: diagram.tables[tableId].name})
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
