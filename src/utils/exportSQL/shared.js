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
