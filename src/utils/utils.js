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
  const isCompatible =
    dbToTypes[db][field1Type].compatibleWith &&
    dbToTypes[db][field1Type].compatibleWith.includes(field2Type);
  return same || isCompatible;
}

const COMMENT_LINE_HEIGHT = 16;
const TABLE_COMMENT_MAX_LINES = 5;
const FIELD_COMMENT_MAX_LINES = 2;
const COMMENT_PADDING_X = 24;
const COMMENT_BORDERS = 4;
const COMMENT_PADDING_BOTTOM = 12;
const COMMENT_CACHE_LIMIT = 500;
const TABLE_COMMENT_INSET = COMMENT_BORDERS + COMMENT_PADDING_X;
const FIELD_COMMENT_INSET = TABLE_COMMENT_INSET + 12;

const commentHeightCache = new Map();
let commentMeasureCtx = null;

function getCommentMeasureCtx() {
  if (commentMeasureCtx) return commentMeasureCtx;
  const ctx = document.createElement("canvas").getContext("2d");
  const bodyFont = window.getComputedStyle(document.body).fontFamily || "sans-serif";
  ctx.font = `12px ${bodyFont}`;
  commentMeasureCtx = ctx;
  return ctx;
}

function countWrappedLines(comment, contentWidth, maxLines) {
  const ctx = getCommentMeasureCtx();
  const spaceWidth = ctx.measureText(" ").width;
  const paragraphs = comment.split("\n");
  let lines = 0;

  for (const paragraph of paragraphs) {
    if (lines >= maxLines) break;
    if (!paragraph) {
      lines++;
      continue;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    let lineWidth = 0;

    for (const word of words) {
      const wordWidth = ctx.measureText(word).width;
      if (lineWidth === 0) {
        lineWidth = wordWidth;
      } else if (lineWidth + spaceWidth + wordWidth <= contentWidth) {
        lineWidth += spaceWidth + wordWidth;
      } else {
        lines++;
        if (lines >= maxLines) break;
        lineWidth = wordWidth;
      }
    }
    if (lineWidth > 0) lines++;
  }

  return Math.min(maxLines, Math.max(1, lines));
}

export function getCommentHeight(
  comment,
  containerWidth,
  showComments = true,
  inset = TABLE_COMMENT_INSET,
  maxLines = TABLE_COMMENT_MAX_LINES,
) {
  if (!comment || !showComments) return 0;

  const cacheKey = `${containerWidth}:${inset}:${maxLines}:${comment}`;
  const cached = commentHeightCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const contentWidth = containerWidth - inset;
  const lines =
    contentWidth <= 0 ? 1 : countWrappedLines(comment, contentWidth, maxLines);
  const height = lines * COMMENT_LINE_HEIGHT + COMMENT_PADDING_BOTTOM;

  if (commentHeightCache.size >= COMMENT_CACHE_LIMIT) {
    commentHeightCache.delete(commentHeightCache.keys().next().value);
  }
  commentHeightCache.set(cacheKey, height);
  return height;
}

export function getFieldHeight(field, containerWidth, showComments = true) {
  return (
    tableFieldHeight +
    getCommentHeight(
      field?.comment,
      containerWidth,
      showComments,
      FIELD_COMMENT_INSET,
      FIELD_COMMENT_MAX_LINES,
    )
  );
}

export function getFieldsTotalHeight(fields, containerWidth, showComments = true) {
  let total = 0;
  for (const f of fields) {
    total += getFieldHeight(f, containerWidth, showComments);
  }
  return total;
}

export function getFieldOffsetY(fields, fieldIndex, containerWidth, showComments = true) {
  let total = 0;
  const limit = Math.min(fieldIndex, fields.length);
  for (let i = 0; i < limit; i++) {
    total += getFieldHeight(fields[i], containerWidth, showComments);
  }
  return total;
}

export function getTableHeight(table, width, showComments = true) {
  return (
    getFieldsTotalHeight(table.fields, width, showComments) +
    tableHeaderHeight +
    tableColorStripHeight +
    getCommentHeight(table.comment, width, showComments)
  );
}
