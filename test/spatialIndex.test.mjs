import assert from "node:assert/strict";
import test from "node:test";
import { SpatialIndex } from "../src/utils/spatialIndex.js";
import {
  buildRelationshipLookup,
  collectVisibleRelationshipIds,
  expandViewport,
} from "../src/utils/viewport.js";

test("the spatial index returns only entities near the viewport", () => {
  const index = new SpatialIndex({ cellSize: 256 });
  const tables = Array.from({ length: 1000 }, (_, id) => ({
    id,
    x: (id % 50) * 1000,
    y: Math.floor(id / 50) * 1000,
    width: 200,
    height: 300,
  }));
  index.sync(tables, (table) => table);

  const visible = index.query({ x: -50, y: -50, width: 500, height: 500 });
  assert.deepEqual(visible, [0]);
  assert.equal(index.size, 1000);
});

test("moving an entity updates its cells without rebuilding logical data", () => {
  const index = new SpatialIndex({ cellSize: 100 });
  index.update("table", { x: 0, y: 0, width: 20, height: 20 });
  assert.deepEqual(index.query({ x: 0, y: 0, width: 50, height: 50 }), [
    "table",
  ]);

  index.update("table", { x: 500, y: 500, width: 20, height: 20 });
  assert.deepEqual(index.query({ x: 0, y: 0, width: 50, height: 50 }), []);
  assert.deepEqual(index.query({ x: 490, y: 490, width: 50, height: 50 }), [
    "table",
  ]);
});

test("relationships render when either endpoint is visible", () => {
  const relationships = [
    { id: "near", startTableId: "a", endTableId: "b" },
    { id: "far", startTableId: "c", endTableId: "d" },
  ];
  const lookup = buildRelationshipLookup(relationships);

  assert.deepEqual(
    collectVisibleRelationshipIds({
      visibleTableIds: ["a"],
      relationshipsByTableId: lookup.byTableId,
      relationshipOrderById: lookup.orderById,
    }),
    ["near"],
  );
});

test("viewport overscan is expressed in screen pixels", () => {
  const expanded = expandViewport(
    { left: 100, top: 200, width: 800, height: 600 },
    2,
    300,
  );
  assert.deepEqual(expanded, {
    x: -50,
    y: 50,
    width: 1100,
    height: 900,
  });
});
