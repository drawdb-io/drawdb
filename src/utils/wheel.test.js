import assert from "node:assert/strict";
import { test } from "node:test";

import { getWheelPanDelta } from "./wheel.js";

test("Shift + wheel keeps vertical delta on browsers without axis translation", () => {
  const delta = getWheelPanDelta({ shiftKey: true, deltaX: 0, deltaY: 120 });

  assert.deepEqual(delta, { x: 120, y: 0 });
});

test("Shift + wheel uses deltaX on browsers that translate the axis", () => {
  const delta = getWheelPanDelta({ shiftKey: true, deltaX: 120, deltaY: 0 });

  assert.deepEqual(delta, { x: 120, y: 0 });
});

test("wheel pans horizontally when Shift is not held", () => {
  const delta = getWheelPanDelta({ shiftKey: false, deltaX: 120, deltaY: 0 });

  assert.deepEqual(delta, { x: 120, y: 0 });
});

test("wheel pans vertically when Shift is not held", () => {
  const delta = getWheelPanDelta({ shiftKey: false, deltaX: 0, deltaY: 120 });

  assert.deepEqual(delta, { x: 0, y: 120 });
});

test("wheel pans diagonally when both axes report movement", () => {
  const delta = getWheelPanDelta({ shiftKey: false, deltaX: 40, deltaY: 80 });

  assert.deepEqual(delta, { x: 40, y: 80 });
});

test("wheel with no movement produces no pan", () => {
  const delta = getWheelPanDelta({ shiftKey: false, deltaX: 0, deltaY: 0 });

  assert.deepEqual(delta, { x: 0, y: 0 });
});
