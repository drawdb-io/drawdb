import { isFunction, isKeyword } from "../utils";

import { DB } from "../../data/constants";
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

export function getInlineFK(table, obj) {
  let fks = [];
  obj.references.forEach((r) => {
    if (r.startTableId === table.id) {
      fks.push(
        `\tFOREIGN KEY ("${table.fields.find((f) => f.id === r.startFieldId)?.name}") REFERENCES "${
          obj.tables.find((t) => t.id === r.endTableId)?.name
        }"("${
          obj.tables
            .find((t) => t.id === r.endTableId)
            .fields.find((f) => f.id === r.endFieldId)?.name
        }")\n\tON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()}`,
      );
    }
  });
  return fks.join(",\n");
}
