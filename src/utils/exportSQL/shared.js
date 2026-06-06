import { isFunction, isKeyword } from "../utils";

import { Cardinality, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";

export function parseDefault(field, database = DB.GENERIC) {
  if (
    isFunction(field.default) ||
    isKeyword(field.default) ||
    !dbToTypes[database][field.type].hasQuotes
  ) {
    return field.default;
  }

  return `'${escapeQuotes(field.default)}'`;
}

export function escapeQuotes(str) {
  return str.replace(/[']/g, "'$&");
}

export function exportFieldComment(comment) {
  if (comment === "") {
    return "";
  }

  return comment
    .split("\n")
    .map((commentLine) => `\t-- ${commentLine}\n`)
    .join("");
}

export function resolveFKDirection(r) {
  const isInverted = r.cardinality === Cardinality.ONE_TO_MANY;
  return {
    fkTableId: isInverted ? r.endTableId : r.startTableId,
    fkFieldId: isInverted ? r.endFieldId : r.startFieldId,
    refTableId: isInverted ? r.startTableId : r.endTableId,
    refFieldId: isInverted ? r.startFieldId : r.endFieldId,
  };
}

export function getInlineFK(table, obj) {
  let fks = [];
  obj.references.forEach((r) => {
    const { fkTableId, fkFieldId, refTableId, refFieldId } = resolveFKDirection(r);
    if (fkTableId === table.id) {
      fks.push(
        `\tFOREIGN KEY ("${table.fields.find((f) => f.id === fkFieldId)?.name}") REFERENCES "${
          obj.tables.find((t) => t.id === refTableId)?.name
        }"("${
          obj.tables
            .find((t) => t.id === refTableId)
            .fields.find((f) => f.id === refFieldId)?.name
        }")\n\tON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()}`,
      );
    }
  });
  return fks.join(",\n");
}
