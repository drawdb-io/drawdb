import { DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import { isFunction, isKeyword, strHasQuotes } from "../utils";

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
