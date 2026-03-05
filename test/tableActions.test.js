import test from "node:test";
import assert from "node:assert/strict";
import { removeTableRelationships } from "../src/utils/tableActions.js";

test("removeTableRelationships removes relationships connected to the table", () => {
  const relationships = [
    { id: "r1", startTableId: "t1", endTableId: "t2" },
    { id: "r2", startTableId: "t3", endTableId: "t1" },
    { id: "r3", startTableId: "t2", endTableId: "t3" },
  ];

  const result = removeTableRelationships(relationships, "t1");

  assert.deepEqual(result, [{ id: "r3", startTableId: "t2", endTableId: "t3" }]);
});

test("removeTableRelationships keeps all relationships when table is absent", () => {
  const relationships = [
    { id: "r1", startTableId: "t1", endTableId: "t2" },
    { id: "r2", startTableId: "t3", endTableId: "t4" },
  ];

  const result = removeTableRelationships(relationships, "t9");

  assert.deepEqual(result, relationships);
});

