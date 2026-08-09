import { graphlib, layout } from "@dagrejs/dagre";
import { getTableHeight } from "./utils";

const nodeSep = 60;
const rankSep = 110;
const isolatedGap = 60;

export function autoArrange(tables, relationships, settings) {
  const movable = tables.filter((table) => !table.locked);
  const movableIds = new Set(movable.map((table) => table.id));

  const connectedIds = new Set();
  for (const r of relationships) {
    if (
      r.startTableId !== r.endTableId &&
      movableIds.has(r.startTableId) &&
      movableIds.has(r.endTableId)
    ) {
      connectedIds.add(r.startTableId);
      connectedIds.add(r.endTableId);
    }
  }

  const sizeOf = (table) => ({
    width: settings.tableWidth,
    height: getTableHeight(
      table,
      settings.tableWidth,
      settings.showComments,
      relationships,
    ),
  });

  const connected = movable.filter((table) => connectedIds.has(table.id));
  const isolated = movable.filter((table) => !connectedIds.has(table.id));

  const graph = new graphlib.Graph();
  graph.setGraph({ rankdir: "LR", nodesep: nodeSep, ranksep: rankSep });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const table of connected) {
    graph.setNode(String(table.id), sizeOf(table));
  }
  for (const r of relationships) {
    if (
      r.startTableId !== r.endTableId &&
      connectedIds.has(r.startTableId) &&
      connectedIds.has(r.endTableId)
    ) {
      graph.setEdge(String(r.startTableId), String(r.endTableId));
    }
  }

  layout(graph);

  const positions = [];
  let maxX = 0;
  let maxY = 0;
  for (const table of connected) {
    const node = graph.node(String(table.id));
    const x = node.x - node.width / 2;
    const y = node.y - node.height / 2;
    positions.push({ id: table.id, x, y });
    maxX = Math.max(maxX, x + node.width);
    maxY = Math.max(maxY, y + node.height);
  }

  if (isolated.length > 0) {
    const rowWidth = Math.max(maxX, 4 * settings.tableWidth + 3 * isolatedGap);
    let x = 0;
    let y = connected.length > 0 ? maxY + rankSep : 0;
    let rowHeight = 0;
    for (const table of isolated) {
      const { width, height } = sizeOf(table);
      if (x > 0 && x + width > rowWidth) {
        x = 0;
        y += rowHeight + isolatedGap;
        rowHeight = 0;
      }
      positions.push({ id: table.id, x, y });
      x += width + isolatedGap;
      rowHeight = Math.max(rowHeight, height);
    }
  }

  return positions;
}
