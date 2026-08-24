import assert from "node:assert/strict";
import test from "node:test";
import { findCircularTableIds } from "../src/utils/graph.js";

test("cycle detection handles a dense acyclic graph in linear traversal", () => {
  const tables = Array.from({ length: 200 }, (_, id) => ({ id }));
  const relationships = [];
  for (let start = 0; start < tables.length; start++) {
    for (let end = start + 1; end < tables.length; end++) {
      relationships.push({ startTableId: start, endTableId: end });
    }
  }

  assert.deepEqual([...findCircularTableIds(tables, relationships)], []);
});

test("cycle detection reports circular tables without following self links", () => {
  const tables = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const relationships = [
    { startTableId: "a", endTableId: "b" },
    { startTableId: "b", endTableId: "c" },
    { startTableId: "c", endTableId: "a" },
    { startTableId: "b", endTableId: "b" },
  ];

  assert.deepEqual([...findCircularTableIds(tables, relationships)], ["a"]);
});
