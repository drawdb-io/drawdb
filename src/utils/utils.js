import { dbToTypes } from "../data/datatypes";

import {
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
} from "../data/constants";

export function dataURItoBlob(dataUrl) {
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], { type: mimeString });
}

export function arrayIsEqual(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function strHasQuotes(str) {
  if (str.length < 2) return false;

  return (
    (str[0] === str[str.length - 1] && str[0] === "'") ||
    (str[0] === str[str.length - 1] && str[0] === '"') ||
    (str[0] === str[str.length - 1] && str[0] === "`")
  );
}

const keywords = ["CURRENT_TIMESTAMP", "NULL"];

export function isKeyword(str) {
  return keywords.includes(str.toUpperCase());
}

export function isFunction(str) {
  return /\w+\([^)]*\)$/.test(str);
}

export function areFieldsCompatible(db, field1Type, field2Type) {
  const same = field1Type === field2Type;
  const isCompatible =
    dbToTypes[db][field1Type].compatibleWith &&
    dbToTypes[db][field1Type].compatibleWith.includes(field2Type);
  return same || isCompatible;
}

export function getTableHeight(table) {
  return (
    table.fields.length * tableFieldHeight +
    tableHeaderHeight +
    tableColorStripHeight
  );
}
