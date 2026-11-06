import { tableFieldHeight, tableHeaderHeight } from "../data/constants";
import { autoArrange } from "./autoArrange";
import { findContainingArea } from "./rect";
import {
  getCommentHeight,
  getFieldOffsetY,
  getRelatedFieldKeysByTable,
  getRelationshipFields,
  getTableHeight,
  getTableWidth,
  getVisibleFieldEntries,
} from "./utils";

// Each engine takes { tables, relationships, areas, settings } and resolves to
// { tables: [{ id, x, y }], areas: [{ id, x, y, width, height }] }. Every
// engine leaves locked tables where they are. Only "by_subject_area" moves
// areas.
export const layoutEngines = [
  {
    id: "dagre_left_to_right",
    run: (diagram) => arrangeWithDagre(diagram, "LR"),
  },
  {
    id: "dagre_top_to_bottom",
    run: (diagram) => arrangeWithDagre(diagram, "TB"),
  },
  { id: "elk_layered", run: (diagram) => arrangeWithElkLayered(diagram) },
  { id: "elk_stress", run: (diagram) => arrangeWithElkStress(diagram) },
  { id: "by_subject_area", run: (diagram) => arrangeBySubjectArea(diagram) },
];

export function runLayout(engineId, diagram) {
  const engine = layoutEngines.find((e) => e.id === engineId);
  if (!engine) throw new Error(`Unknown layout engine: ${engineId}`);
  return engine.run(diagram);
}

const tableSpacing = 60;
const layerSpacing = 110;
const disconnectedGroupSpacing = 80;
const areaPadding = 30;
const areaTitleHeight = 40;
const areaSpacing = 80;
const areaContentOffset = { x: areaPadding, y: areaTitleHeight };
const targetAspectRatio = 16 / 9;
const stressDesiredRelationshipLength = 320;
const overlapRemovalMaxPasses = 300;

function arrangeWithDagre({ tables, relationships, settings }, direction) {
  return {
    tables: autoArrange(tables, relationships, settings, { direction }),
    areas: [],
  };
}

let elkLayoutEngine = null;
async function loadElkLayoutEngine() {
  if (!elkLayoutEngine) {
    const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
    elkLayoutEngine = new ELK();
  }
  return elkLayoutEngine;
}

function collectMovableTables(tables, relationships, settings) {
  const movableTables = tables.filter((table) => !table.locked);
  const movableTableIds = new Set(movableTables.map((table) => table.id));
  const movableRelationships = relationships.filter(
    (relationship) =>
      relationship.startTableId !== relationship.endTableId &&
      movableTableIds.has(relationship.startTableId) &&
      movableTableIds.has(relationship.endTableId),
  );
  const relatedFieldKeysByTable = getRelatedFieldKeysByTable(relationships);
  const measureTable = (table) => ({
    width: getTableWidth(table),
    height: getTableHeight(
      table,
      settings.showComments,
      relatedFieldKeysByTable.get(table.id),
    ),
  });
  return {
    movableTables,
    movableRelationships,
    relatedFieldKeysByTable,
    measureTable,
  };
}

// getFieldRowCenterY returns the y offset of a field row's center inside its
// table. calcPath ends a relationship line at the same point.
function getFieldRowCenterY(table, fieldId, relatedFieldKeysByTable, settings) {
  const tableWidth = getTableWidth(table);
  const visibleFieldEntries = getVisibleFieldEntries(
    table,
    relatedFieldKeysByTable.get(table.id),
  );
  const fieldIndex = Math.max(
    0,
    visibleFieldEntries.findIndex(({ field }) => field.id === fieldId),
  );
  return (
    tableHeaderHeight +
    getCommentHeight(table.comment, tableWidth, settings.showComments) +
    getFieldOffsetY(
      visibleFieldEntries.map(({ field }) => field),
      fieldIndex,
      tableWidth,
      settings.showComments,
    ) +
    tableFieldHeight / 2
  );
}

function readTablePositionsFromElk(elkResult) {
  return (elkResult.children ?? []).map((elkNode) => ({
    id: elkNode.tableId,
    x: Math.round(elkNode.x),
    y: Math.round(elkNode.y),
  }));
}

async function arrangeWithElkLayered({ tables, relationships, settings }) {
  const {
    movableTables,
    movableRelationships,
    relatedFieldKeysByTable,
    measureTable,
  } = collectMovableTables(tables, relationships, settings);
  const tablesById = new Map(movableTables.map((table) => [table.id, table]));

  // A relationship line ends on a field row, so we give every related field a
  // port on the left and right edges of its table. ELK then knows which row
  // each line leaves from when it orders the tables within a layer.
  const portsByTableId = new Map(
    movableTables.map((table) => [table.id, new Map()]),
  );
  const getOrCreatePortId = (table, fieldId, side) => {
    const portId = `${table.id}:${fieldId}:${side}`;
    const tablePorts = portsByTableId.get(table.id);
    if (!tablePorts.has(portId)) {
      tablePorts.set(portId, {
        id: portId,
        width: 1,
        height: 1,
        x: side === "WEST" ? -1 : measureTable(table).width,
        y: getFieldRowCenterY(
          table,
          fieldId,
          relatedFieldKeysByTable,
          settings,
        ),
        layoutOptions: { "elk.port.side": side },
      });
    }
    return portId;
  };

  const elkEdges = [];
  movableRelationships.forEach((relationship, relationshipIndex) => {
    const startTable = tablesById.get(relationship.startTableId);
    const endTable = tablesById.get(relationship.endTableId);
    getRelationshipFields(relationship).forEach((fieldPair, fieldPairIndex) => {
      elkEdges.push({
        id: `relationship_${relationshipIndex}_field_${fieldPairIndex}`,
        sources: [
          getOrCreatePortId(startTable, fieldPair.startFieldId, "EAST"),
        ],
        targets: [getOrCreatePortId(endTable, fieldPair.endFieldId, "WEST")],
      });
    });
  });

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": String(tableSpacing),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(layerSpacing),
      "elk.spacing.componentComponent": String(disconnectedGroupSpacing),
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.aspectRatio": String(targetAspectRatio),
    },
    children: movableTables.map((table) => ({
      id: String(table.id),
      tableId: table.id,
      ...measureTable(table),
      layoutOptions: { "elk.portConstraints": "FIXED_POS" },
      ports: [...portsByTableId.get(table.id).values()],
    })),
    edges: elkEdges,
  };

  const elk = await loadElkLayoutEngine();
  return {
    tables: readTablePositionsFromElk(await elk.layout(elkGraph)),
    areas: [],
  };
}

async function arrangeWithElkStress({ tables, relationships, settings }) {
  const { movableTables, movableRelationships, measureTable } =
    collectMovableTables(tables, relationships, settings);

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "stress",
      "elk.stress.desiredEdgeLength": String(stressDesiredRelationshipLength),
      "elk.spacing.componentComponent": String(disconnectedGroupSpacing),
    },
    children: movableTables.map((table) => ({
      id: String(table.id),
      tableId: table.id,
      ...measureTable(table),
    })),
    edges: movableRelationships.map((relationship, relationshipIndex) => ({
      id: `relationship_${relationshipIndex}`,
      sources: [String(relationship.startTableId)],
      targets: [String(relationship.endTableId)],
    })),
  };

  const elk = await loadElkLayoutEngine();
  const tablePositions = readTablePositionsFromElk(await elk.layout(elkGraph));

  // The stress algorithm treats each table as a point, so it can place two
  // tables on top of each other. removeOverlaps then pushes those tables apart.
  const tableSizesById = new Map(
    movableTables.map((table) => [table.id, measureTable(table)]),
  );
  const tableRectangles = tablePositions.map((position) => ({
    ...position,
    ...tableSizesById.get(position.id),
  }));
  removeOverlaps(tableRectangles, tableSpacing);
  return { tables: moveToOrigin(tableRectangles), areas: [] };
}

// removeOverlaps pushes apart every pair of rectangles that sit closer than
// minimumGap. It moves each pair along the axis where the two overlap least,
// and it repeats until no pair sits too close.
export function removeOverlaps(rectangles, minimumGap) {
  for (let pass = 0; pass < overlapRemovalMaxPasses; pass++) {
    let movedAny = false;
    for (let firstIndex = 0; firstIndex < rectangles.length; firstIndex++) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < rectangles.length;
        secondIndex++
      ) {
        const first = rectangles[firstIndex];
        const second = rectangles[secondIndex];
        const overlapX =
          Math.min(first.x + first.width, second.x + second.width) -
          Math.max(first.x, second.x) +
          minimumGap;
        const overlapY =
          Math.min(first.y + first.height, second.y + second.height) -
          Math.max(first.y, second.y) +
          minimumGap;
        if (overlapX <= 0 || overlapY <= 0) continue;
        movedAny = true;
        if (overlapX < overlapY) {
          const firstIsLeft =
            first.x + first.width / 2 <= second.x + second.width / 2;
          const shift = (firstIsLeft ? 1 : -1) * (overlapX / 2);
          first.x -= shift;
          second.x += shift;
        } else {
          const firstIsAbove =
            first.y + first.height / 2 <= second.y + second.height / 2;
          const shift = (firstIsAbove ? 1 : -1) * (overlapY / 2);
          first.y -= shift;
          second.y += shift;
        }
      }
    }
    if (!movedAny) break;
  }
  return rectangles;
}

function moveToOrigin(rectangles) {
  const minimumX = Math.min(...rectangles.map((r) => r.x));
  const minimumY = Math.min(...rectangles.map((r) => r.y));
  return rectangles.map((rectangle) => ({
    id: rectangle.id,
    x: Math.round(rectangle.x - minimumX),
    y: Math.round(rectangle.y - minimumY),
  }));
}

// arrangeBySubjectArea lays out the tables of each subject area with Dagre and
// sizes the area to fit them. It then packs the areas in rows, in the order of
// the Areas tab. Tables outside every area go into one more group at the end.
// It leaves locked and hidden areas, and the tables in them, where they are.
function arrangeBySubjectArea({ tables, relationships, areas, settings }) {
  const relatedFieldKeysByTable = getRelatedFieldKeysByTable(relationships);
  const getTableRectangle = (table) => ({
    x: table.x,
    y: table.y,
    width: getTableWidth(table),
    height: getTableHeight(
      table,
      settings.showComments,
      relatedFieldKeysByTable.get(table.id),
    ),
  });
  const getTableAreaId = (table) =>
    table.areaId !== undefined
      ? table.areaId
      : findContainingArea(getTableRectangle(table), areas)?.id ?? null;

  const fixedAreaIds = new Set(
    areas.filter((a) => a.locked || a.hidden).map((a) => a.id),
  );
  const knownAreaIds = new Set(areas.map((a) => a.id));
  const tablesByAreaId = new Map();
  for (const table of tables) {
    if (table.locked) continue;
    const tableAreaId = getTableAreaId(table);
    if (fixedAreaIds.has(tableAreaId)) continue;
    const groupAreaId = knownAreaIds.has(tableAreaId) ? tableAreaId : null;
    if (!tablesByAreaId.has(groupAreaId)) tablesByAreaId.set(groupAreaId, []);
    tablesByAreaId.get(groupAreaId).push(table);
  }

  const areaGroups = [];
  const areaIdsInTabOrder = [
    ...areas.filter((a) => !fixedAreaIds.has(a.id)).map((a) => a.id),
    null,
  ];
  for (const areaId of areaIdsInTabOrder) {
    const groupTables = tablesByAreaId.get(areaId);
    if (!groupTables?.length) continue;
    const groupTableIds = new Set(groupTables.map((t) => t.id));
    const groupRelationships = relationships.filter(
      (r) =>
        groupTableIds.has(r.startTableId) && groupTableIds.has(r.endTableId),
    );
    const groupTablePositions = autoArrange(
      groupTables,
      groupRelationships,
      settings,
    );
    const groupTablesById = new Map(groupTables.map((t) => [t.id, t]));
    const contentWidth = Math.max(
      ...groupTablePositions.map(
        (position) =>
          position.x + getTableWidth(groupTablesById.get(position.id)),
      ),
    );
    const contentHeight = Math.max(
      ...groupTablePositions.map(
        (position) =>
          position.y +
          getTableRectangle(groupTablesById.get(position.id)).height,
      ),
    );
    const isUnassigned = areaId === null;
    areaGroups.push({
      areaId,
      tablePositions: groupTablePositions,
      width: contentWidth + (isUnassigned ? 0 : 2 * areaPadding),
      height:
        contentHeight + (isUnassigned ? 0 : areaPadding + areaTitleHeight),
      contentOffset: isUnassigned ? { x: 0, y: 0 } : areaContentOffset,
    });
  }

  const totalFootprint = areaGroups.reduce(
    (sum, group) =>
      sum + (group.width + areaSpacing) * (group.height + areaSpacing),
    0,
  );
  const rowWidthLimit = Math.max(
    ...areaGroups.map((group) => group.width),
    Math.sqrt(totalFootprint * targetAspectRatio),
  );

  const arrangedTables = [];
  const arrangedAreas = [];
  let cursorX = 0;
  let cursorY = 0;
  let currentRowHeight = 0;
  for (const group of areaGroups) {
    if (cursorX > 0 && cursorX + group.width > rowWidthLimit) {
      cursorX = 0;
      cursorY += currentRowHeight + areaSpacing;
      currentRowHeight = 0;
    }
    for (const position of group.tablePositions) {
      arrangedTables.push({
        id: position.id,
        x: cursorX + group.contentOffset.x + position.x,
        y: cursorY + group.contentOffset.y + position.y,
      });
    }
    if (group.areaId !== null) {
      arrangedAreas.push({
        id: group.areaId,
        x: cursorX,
        y: cursorY,
        width: group.width,
        height: group.height,
      });
    }
    cursorX += group.width + areaSpacing;
    currentRowHeight = Math.max(currentRowHeight, group.height);
  }

  return { tables: arrangedTables, areas: arrangedAreas };
}
