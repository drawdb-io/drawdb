import { DB } from "../data/constants.js";
import { ddbDiagramIsValid, jsonDiagramIsValid } from "./validateSchema.js";

export const IMPORT_FORMAT = Object.freeze({
  JSON: "json",
  DDB: "ddb",
});

export function getDiagramImportFormat(file) {
  return file.name?.toLowerCase().endsWith(".ddb")
    ? IMPORT_FORMAT.DDB
    : IMPORT_FORMAT.JSON;
}

export function validateImportedDiagram(
  diagram,
  { format = IMPORT_FORMAT.JSON, expectedDatabase } = {},
) {
  const schemaIsValid =
    format === IMPORT_FORMAT.DDB
      ? ddbDiagramIsValid(diagram)
      : jsonDiagramIsValid(diagram);

  if (!schemaIsValid) {
    return {
      ok: false,
      message: "The file is missing necessary properties for a diagram.",
    };
  }

  const database = diagram.database || DB.GENERIC;
  if (expectedDatabase && database !== expectedDatabase) {
    return {
      ok: false,
      message:
        "The imported diagram and the open diagram don't use matching databases.",
    };
  }

  const fieldsByTableId = new Map();
  for (const table of diagram.tables) {
    fieldsByTableId.set(
      table.id,
      new Set((table.fields ?? []).map((field) => field.id)),
    );
  }

  for (const relationship of diagram.relationships) {
    const startFields = fieldsByTableId.get(relationship.startTableId);
    const endFields = fieldsByTableId.get(relationship.endTableId);
    if (!startFields || !endFields) {
      return {
        ok: false,
        message: "A relationship references a table that does not exist.",
      };
    }

    if (
      !startFields.has(relationship.startFieldId) ||
      !endFields.has(relationship.endFieldId)
    ) {
      return {
        ok: false,
        message: "A relationship references a field that does not exist.",
      };
    }
  }

  return {
    ok: true,
    database,
    counts: {
      tables: diagram.tables.length,
      relationships: diagram.relationships.length,
      notes: diagram.notes?.length ?? 0,
      areas: diagram.subjectAreas?.length ?? 0,
      fields: diagram.tables.reduce(
        (total, table) => total + (table.fields?.length ?? 0),
        0,
      ),
    },
  };
}
