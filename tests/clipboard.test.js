import test from "node:test";
import assert from "node:assert/strict";
import { classifyClipboardPayload } from "../src/utils/clipboard.js";

const baseField = {
  id: "fld_1",
  name: "id",
  type: "INTEGER",
  default: "",
  check: "",
  primary: true,
  unique: true,
  notNull: true,
  increment: true,
  comment: "",
};

test("classifies a valid table payload", () => {
  const payload = {
    id: "tbl_1",
    name: "users",
    x: 0,
    y: 0,
    fields: [baseField],
    comment: "",
    indices: [],
    color: "#000000",
  };

  const result = classifyClipboardPayload(payload);
  assert.ok(result);
  assert.equal(result.type, "table");
  assert.equal(result.payload, payload);
});

test("classifies a valid note payload", () => {
  const payload = {
    id: 0,
    x: 10,
    y: 10,
    title: "Note",
    content: "",
    color: "#ffffff",
    height: 80,
  };

  const result = classifyClipboardPayload(payload);
  assert.ok(result);
  assert.equal(result.type, "note");
});

test("rejects invalid note payloads", () => {
  const payload = {
    id: 0,
    title: "Broken note",
  };

  const result = classifyClipboardPayload(payload);
  assert.equal(result, null);
});

test("returns null for non-object values", () => {
  assert.equal(classifyClipboardPayload(null), null);
  assert.equal(classifyClipboardPayload("string"), null);
  assert.equal(classifyClipboardPayload(42), null);
});

