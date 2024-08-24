import { isFunction, isKeyword, strHasQuotes } from "../utils";

import { DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";

export function parseDefault(field, database = DB.GENERIC) {
  if (
    strHasQuotes(field.default) ||
    isFunction(field.default) ||
    isKeyword(field.default) ||
    !dbToTypes[database][field.type].hasQuotes
  ) {
    return field.default;
  }

  return `'${field.default}'`;
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
        `\tFOREIGN KEY ("${table.fields[r.startFieldId].name}") REFERENCES "${
          obj.tables[r.endTableId].name
        }"("${
          obj.tables[r.endTableId].fields[r.endFieldId].name
        }")\n\tON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()}`,
      );
    }
  });
  return fks.join(",\n");
}
