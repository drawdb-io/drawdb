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

const keywords = [
  "NULL",
  "TRUE",
  "FALSE",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "CURRENT_TIMESTAMP",
  "LOCALTIME",
  "LOCALTIMESTAMP",
];

export function isKeyword(str) {
  if (typeof str !== "string") return false;

  return keywords.includes(str.toUpperCase());
}

export function isFunction(str) {
  return /\w+\([^)]*\)$/.test(str);
}

export function areFieldsCompatible(db, field1Type, field2Type) {
  const same = field1Type === field2Type;

  const dbTypes = dbToTypes[db];
  if (!dbTypes) return same;

  const typeConfig = dbTypes[field1Type];
  if (!typeConfig || !typeConfig.compatibleWith) return same;

  const isCompatible = typeConfig.compatibleWith.includes(field2Type);
  return same || isCompatible;
}

export function getCommentHeight(comment, containerWidth, showComments = true) {
  if (!comment || !showComments) return 0;

  const paddingBottom = 12;
  const borders = 4;

  const span = document.createElement("span");
  span.className = "absolute text-xs px-3 line-clamp-5";

  span.style.width = containerWidth - borders + "px";
  span.innerHTML = comment;
  span.id = "temp-comment-measure";

  document.body.appendChild(span);
  const height = span.offsetHeight;
  document.body.removeChild(span);

  return height + paddingBottom;
}

export function getTableHeight(table, width, showComments = true) {
  return (
    table.fields.length * tableFieldHeight +
    tableHeaderHeight +
    tableColorStripHeight +
    getCommentHeight(table.comment, width, showComments)
  );
}
