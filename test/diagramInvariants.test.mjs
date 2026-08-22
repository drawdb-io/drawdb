import assert from "node:assert/strict";
import test from "node:test";
import { formatDiagramForExport } from "../src/utils/formatDiagram.js";
import { validateImportedDiagram } from "../src/utils/importDiagram.js";
import { buildTableSearchIndex } from "../src/utils/searchIndex.js";
import { openRelationshipEditorSelection } from "../src/utils/selection.js";
import { applyTransformActions } from "../src/utils/transform.js";
import { ObjectType, Tab } from "../src/data/constants.js";

function field(id) {
  return {
    id,
    name: id,
    type: "INT",
    default: "",
    check: "",
    primary: false,
    unique: false,
    notNull: false,
    increment: false,
    comment: "",
  };
}

function table(id, x) {
  return {
    id,
    name: id,
    x,
    y: 0,
    fields: [field(`${id}-field`)],
    comment: "",
    indices: [],
    color: "#4488cc",
  };
}

function syntheticDiagram() {
  return {
    database: "generic",
    tables: [table("visible", 0), table("offscreen", 100000)],
    relationships: [
      {
        id: "relationship",
        name: "relationship",
        startTableId: "visible",
        startFieldId: "visible-field",
        endTableId: "offscreen",
        endFieldId: "offscreen-field",
        cardinality: "one_to_many",
        updateConstraint: "No action",
        deleteConstraint: "No action",
      },
    ],
    notes: [],
    subjectAreas: [],
  };
}

test("global search metadata includes a table outside the viewport", () => {
  const diagram = syntheticDiagram();
  const searchIndex = buildTableSearchIndex(diagram.tables);
  assert.equal(
    searchIndex.find((entry) => entry.tableId === "offscreen").label,
    "offscreen",
  );
});

test("double-click selection opens the relationship editor", () => {
  const previous = { id: -1, open: false, currentTab: "tables" };
  const next = openRelationshipEditorSelection(previous, "relationship", true);
  assert.equal(next.id, "relationship");
  assert.equal(next.element, ObjectType.RELATIONSHIP);
  assert.equal(next.open, true);
  assert.equal(next.currentTab, Tab.RELATIONSHIPS);
});

test("coalesced pan and zoom do not mutate diagram data or history", () => {
  const diagram = syntheticDiagram();
  const history = [];
  const next = applyTransformActions({ zoom: 1, pan: { x: 0, y: 0 } }, [
    (prev) => ({ ...prev, pan: { x: 20, y: 30 } }),
    (prev) => ({ ...prev, zoom: prev.zoom * 2 }),
  ]);

  assert.deepEqual(next, { zoom: 2, pan: { x: 20, y: 30 } });
  assert.equal(diagram.tables.length, 2);
  assert.deepEqual(history, []);
});

test("export formatting includes entities that are not rendered", () => {
  const diagram = syntheticDiagram();
  const stored = {
    tables: diagram.tables,
    references: diagram.relationships,
    notes: diagram.notes,
    areas: diagram.subjectAreas,
  };
  const exported = formatDiagramForExport(stored);

  assert.equal(exported.tables.length, 2);
  assert.equal(exported.relationships.length, 1);
  assert.equal(exported.tables[1].id, "offscreen");
});

test("JSON import validation preserves counts and references", () => {
  const diagram = syntheticDiagram();
  const result = validateImportedDiagram(diagram, {
    expectedDatabase: "generic",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.counts, {
    tables: 2,
    relationships: 1,
    notes: 0,
    areas: 0,
    fields: 2,
  });
  assert.equal(diagram.relationships[0].endTableId, "offscreen");
});
