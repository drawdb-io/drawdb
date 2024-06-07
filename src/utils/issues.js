import i18n from "../i18n/i18n";
import { isFunction, strHasQuotes } from "./utils";

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
      issues.push(i18n.t("table_w_no_name"));
    }

    if (duplicateTableNames[table.name]) {
      issues.push(i18n.t("duplicate_table_by_name", { tableName: table.name }));
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
        issues.push(i18n.t("empty_field_name", { tableName: table.name }));
      }

      if (field.type === "") {
        issues.push(i18n.t("empty_field_type", { tableName: table.name }));
      } else if (field.type === "ENUM" || field.type === "SET") {
        if (!field.values || field.values.length === 0) {
          issues.push(
            i18n.t("no_values_for_field", {
              tableName: table.name,
              fieldName: field.name,
              type: field.type,
            }),
          );
        }
      }

      if (!checkDefault(field)) {
        issues.push(
          i18n.t("default_doesnt_match_type", {
            tableName: table.name,
            fieldName: field.name,
          }),
        );
      }

      if (field.notNull && field.default.toLowerCase() === "null") {
        issues.push(
          i18n.t("not_null_is_null", {
            tableName: table.name,
            fieldName: field.name,
          }),
        );
      }

      if (duplicateFieldNames[field.name]) {
        issues.push(
          i18n.t("duplicate_fields", {
            tableName: table.name,
            fieldName: field.name,
          }),
        );
      } else {
        duplicateFieldNames[field.name] = true;
      }
    });

    const duplicateIndices = {};
    table.indices.forEach((index) => {
      if (duplicateIndices[index.name]) {
        issues.push(
          i18n.t("duplicate_index", {
            tableName: table.name,
            indexName: index.name,
          }),
        );
      } else {
        duplicateIndices[index.name] = true;
      }
    });

    table.indices.forEach((index) => {
      if (index.name.trim() === "") {
        issues.push(
          i18n.t("empty_index_name", {
            tableName: table.name,
          }),
        );
      }
      if (index.fields.length === 0) {
        issues.push(
          i18n.t("empty_index", {
            tableName: table.name,
          }),
        );
      }
    });

    if (!hasPrimaryKey) {
      issues.push(i18n.t("no_primary_key", { tableName: table.name }));
    }
  });

  const duplicateTypeNames = {};
  diagram.types.forEach((type) => {
    if (type.name === "") {
      issues.push(i18n.t("type_with_no_name"));
    }

    if (duplicateTypeNames[type.name]) {
      issues.push(i18n.t("duplicate_types", { typeName: type.name }));
    } else {
      duplicateTypeNames[type.name] = true;
    }

    if (type.fields.length === 0) {
      issues.push(i18n.t("type_w_no_fields", { typeName: type.name }));
      return;
    }

    const duplicateFieldNames = {};
    type.fields.forEach((field) => {
      if (field.name === "") {
        issues.push(
          i18n.t("empty_type_field_name", {
            typeName: type.name,
          }),
        );
      }

      if (field.type === "") {
        issues.push(
          i18n.t("empty_type_field_type", {
            typeName: type.name,
          }),
        );
      } else if (field.type === "ENUM" || field.type === "SET") {
        if (!field.values || field.values.length === 0) {
          issues.push(
            i18n.t("no_values_for_type_field", {
              typeName: type.name,
              fieldName: field.name,
              type: field.type,
            }),
          );
        }
      }

      if (duplicateFieldNames[field.name]) {
        i18n.t("duplicate_type_fields", {
          typeName: type.name,
          fieldName: field.name,
        });
      } else {
        duplicateFieldNames[field.name] = true;
      }
    });
  });

  const duplicateFKName = {};
  diagram.relationships.forEach((r) => {
    if (duplicateFKName[r.name]) {
      issues.push(
        i18n.t("duplicate_reference", {
          refName: r.name,
        }),
      );
    } else {
      duplicateFKName[r.name] = true;
    }
  });

  const visitedTables = new Set();

  function checkCircularRelationships(tableId, visited = []) {
    if (visited.includes(tableId)) {
      issues.push(
        i18n.t("circular_dependency", {
          refName: diagram.tables[tableId].name,
        }),
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
