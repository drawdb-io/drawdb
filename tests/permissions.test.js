import test from "node:test";
import assert from "node:assert/strict";
import { canMutateDiagram } from "../src/utils/permissions.js";

test("allows mutations when layout is undefined", () => {
  assert.equal(canMutateDiagram(undefined), true);
});

test("blocks mutations when readOnly flag is true", () => {
  assert.equal(canMutateDiagram({ readOnly: true }), false);
});

test("allows mutations when readOnly flag is false", () => {
  assert.equal(canMutateDiagram({ readOnly: false }), true);
});


