import { dbToTypes } from "../data/datatypes";
import i18n from "../i18n/i18n";
import { isFunction } from "./utils";

function checkDefault(field, database) {
  if (field.default === "") return true;
  if (isFunction(field.default)) return true;
  if (!field.notNull && field.default.toLowerCase() === "null") return true;
  if (!dbToTypes[database][field.type].checkDefault) return true;

  return dbToTypes[database][field.type].checkDefault(field);
}

export function getIssues(diagram) {
  const issues = [];
  const duplicateTableNames = {};

  diagram.tables.forEach((table) => {
    // ... (table issue checks)
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

    const inheritedFields =
      table.inherits
        ?.map((parentName) => {
          const parent = diagram.tables.find((t) => t.name === parentName);
          return parent ? parent.fields.map((f) => f.name) : [];
        })
        .flat() || [];

    table.fields.forEach((field) => {
      if (field.primary) hasPrimaryKey = true;

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

      if (!checkDefault(field, diagram.database)) {
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

      if (inheritedFields.includes(field.name)) {
        issues.push(
          i18n.t("merging_column_w_inherited_definition", {
            fieldName: field.name,
            tableName: table.name,
          }),
        );
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
        issues.push(i18n.t("empty_index_name", { tableName: table.name }));
      }
      if (index.fields.length === 0) {
        issues.push(i18n.t("empty_index", { tableName: table.name }));
      }
    });

    if (!hasPrimaryKey) {
      issues.push(i18n.t("no_primary_key", { tableName: table.name }));
    }
  });

  const duplicateTypeNames = {};
  diagram.types.forEach((type) => {
    // ... (Existing type issue checks)
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
        issues.push(i18n.t("empty_type_field_name", { typeName: type.name }));
      }

      if (field.type === "") {
        issues.push(i18n.t("empty_type_field_type", { typeName: type.name }));
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
        issues.push(
          i18n.t("duplicate_type_fields", {
            typeName: type.name,
            fieldName: field.name,
          }),
        );
      } else {
        duplicateFieldNames[field.name] = true;
      }
    });
  }); // =========================================================================
  // START: Logic to check for Circular Type References (DFS)
  // =========================================================================
  // MODIFIED: Normalize the type name to UPPERCASE when creating the map keys

  const typeMap = new Map(diagram.types.map((t) => [t.name.toUpperCase(), t]));
  const visitedTypes = new Set();
  let cycleFound = false;

  function checkCircularTypeReferences(
    currentTypeName, // This name will now be UPPERCASE
    recursionStack = new Set(),
  ) {
    if (cycleFound) return; // 1. Cycle Detected

    if (recursionStack.has(currentTypeName)) {
      // Use the original (potentially lowercase) type name for the message
      issues.push(
        i18n.t("circular_type_dependency", {
          typeName: typeMap.get(currentTypeName)?.name || currentTypeName,
        }),
      );
      cycleFound = true;
      return;
    } // 2. Already Fully Visited

    if (visitedTypes.has(currentTypeName)) {
      return;
    }

    const currentType = typeMap.get(currentTypeName);
    if (!currentType) return;

    recursionStack.add(currentTypeName);
    visitedTypes.add(currentTypeName); // 3. Traverse neighbors (fields that reference other types)

    for (const field of currentType.fields) {
      // MODIFIED: Normalize the referenced type name to UPPERCASE
      const referencedTypeName = field.type.toUpperCase().trim(); // Check if the normalized name exists in our normalized map

      if (typeMap.has(referencedTypeName)) {
        // Pass the normalized (UPPERCASE) name for the recursive call
        checkCircularTypeReferences(
          referencedTypeName,
          new Set(recursionStack),
        );

        if (cycleFound) return;
      }
    }
  } // Check every custom type as a starting point.

  diagram.types.forEach((type) => {
    // Call the DFS with the normalized (UPPERCASE) name.
    const normalizedName = type.name.toUpperCase();
    if (!visitedTypes.has(normalizedName) && !cycleFound) {
      checkCircularTypeReferences(normalizedName);
    }
  }); // =========================================================================
  // END: Logic to check for Circular Type References
  // =========================================================================
  const duplicateEnumNames = {}; // ... (Rest of the file)
  diagram.enums.forEach((e) => {
    if (e.name === "") {
      issues.push(i18n.t("enum_w_no_name"));
    }
    //... (Rest of the getIssues function)
    if (duplicateEnumNames[e.name]) {
      issues.push(i18n.t("duplicate_enums", { enumName: e.name }));
    } else {
      duplicateEnumNames[e.name] = true;
    }

    if (e.values.length === 0) {
      issues.push(i18n.t("enum_w_no_values", { enumName: e.name }));
      return;
    }
  });

  const duplicateFKName = {};
  diagram.relationships.forEach((r) => {
    if (duplicateFKName[r.name]) {
      issues.push(i18n.t("duplicate_reference", { refName: r.name }));
    } else {
      duplicateFKName[r.name] = true;
    }
  });

  const visitedTables = new Set();

  function checkCircularRelationships(tableId, visited = []) {
    if (visited.includes(tableId)) {
      issues.push(
        i18n.t("circular_dependency", {
          refName: diagram.tables.find((t) => t.id === tableId)?.name,
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
