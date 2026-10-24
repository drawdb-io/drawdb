import { graphlib, layout } from "@dagrejs/dagre";
import { tableWidth as defaultTableWidth } from "../data/constants";
import {
  getRelatedFieldKeysByTable,
  getTableHeight,
  getTableWidth,
} from "./utils";

const nodeSep = 60;
const rankSep = 110;
const isolatedGap = 60;
const targetRatio = 16 / 9;
const minRatio = 1 / 3;
const maxRatio = 4;

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

  const relatedFieldKeysByTable = getRelatedFieldKeysByTable(relationships);
  const sizeOf = (table) => ({
    width: getTableWidth(table),
    height: getTableHeight(
      table,
      settings.showComments,
      relatedFieldKeysByTable.get(table.id),
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

  const placed = connected.map((table) => {
    const node = graph.node(String(table.id));
    return {
      id: table.id,
      x: node.x - node.width / 2,
      y: node.y - node.height / 2,
      width: node.width,
      height: node.height,
      rank: Math.round(node.x),
    };
  });

  const extent = () => ({
    width: Math.max(0, ...placed.map((p) => p.x + p.width)),
    height: Math.max(0, ...placed.map((p) => p.y + p.height)),
  });
  let { width: maxX, height: maxY } = extent();

  const ratio = maxX / maxY;
  if (placed.length > 1 && (ratio < minRatio || ratio > maxRatio)) {
    const ranks = new Map();
    for (const p of [...placed].sort((a, b) => a.y - b.y)) {
      if (!ranks.has(p.rank)) ranks.set(p.rank, []);
      ranks.get(p.rank).push(p);
    }

    const rankOrder = [...ranks.keys()].sort((a, b) => b - a);
    const buildColumns = (heightLimit) => {
      const columns = [];
      for (const rank of rankOrder) {
        const nodes = ranks.get(rank);
        const rankHeight = nodes.reduce(
          (sum, p) => sum + p.height + nodeSep,
          0,
        );
        const columnHeight =
          rankHeight / Math.max(1, Math.ceil(rankHeight / heightLimit));
        let column = null;
        for (const p of nodes) {
          if (!column || column.height + p.height > columnHeight) {
            column = { nodes: [], width: 0, height: 0 };
            columns.push(column);
          }
          column.nodes.push({ p, offset: column.height });
          column.height += p.height + nodeSep;
          column.width = Math.max(column.width, p.width);
        }
      }
      return columns;
    };

    const placeColumns = (columns, bandWidth) => {
      const slots = [];
      let x = 0;
      let y = 0;
      let width = 0;
      let bandHeight = 0;
      for (const column of columns) {
        let gap = x === 0 ? 0 : rankSep;
        if (x > 0 && x + gap + column.width > bandWidth) {
          y += bandHeight + rankSep;
          x = 0;
          gap = 0;
          bandHeight = 0;
        }
        slots.push({ column, x: x + gap, y });
        x += gap + column.width;
        width = Math.max(width, x);
        bandHeight = Math.max(bandHeight, column.height - nodeSep);
      }
      const height = y + bandHeight;
      return {
        slots,
        score: Math.abs(Math.log(width / height / targetRatio)),
      };
    };

    const tallest = Math.max(...placed.map((p) => p.height + nodeSep));
    const longest = Math.max(
      ...[...ranks.values()].map((nodes) =>
        nodes.reduce((sum, p) => sum + p.height + nodeSep, 0),
      ),
    );
    let best = null;
    for (let step = 0; step <= 12; step++) {
      const columns = buildColumns(
        tallest * Math.pow(longest / tallest, step / 12),
      );
      const totalWidth =
        columns.reduce((sum, column) => sum + column.width + rankSep, 0) -
        rankSep;
      for (let bands = 1; bands <= columns.length; bands++) {
        const candidate = placeColumns(columns, totalWidth / bands + 1);
        if (!best || candidate.score < best.score) best = candidate;
      }
    }
    for (const { column, x, y } of best.slots) {
      for (const { p, offset } of column.nodes) {
        p.x = x;
        p.y = y + offset;
      }
    }

    ({ width: maxX, height: maxY } = extent());
  }

  const positions = placed.map(({ id, x, y }) => ({ id, x, y }));

  if (isolated.length > 0) {
    const isolatedArea = isolated.reduce((sum, table) => {
      const { width, height } = sizeOf(table);
      return sum + (width + isolatedGap) * (height + isolatedGap);
    }, 0);
    const rowWidth = Math.max(
      maxX,
      Math.sqrt(isolatedArea * targetRatio),
      4 * defaultTableWidth + 3 * isolatedGap,
    );
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
