import {
  Action,
  ObjectType,
  gridSize,
  tableFieldHeight,
  tableHeaderHeight,
} from "../data/constants";

function getTableCenter(table, tableWidth) {
  const estimatedHeight = tableHeaderHeight + table.fields.length * tableFieldHeight + 20;
  return {
    x: table.x + tableWidth / 2,
    y: table.y + estimatedHeight / 2,
  };
}

function ccw(a, b, c) {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(a, b, c, d) {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

export function countRelationshipCrossings(tables, relationships, tableWidth) {
  if (relationships.length < 2 || tables.length < 2) return 0;

  const centers = new Map(
    tables.map((table) => [table.id, getTableCenter(table, tableWidth)]),
  );

  let crossings = 0;
  for (let i = 0; i < relationships.length; i++) {
    const a = relationships[i];
    const aStart = centers.get(a.startTableId);
    const aEnd = centers.get(a.endTableId);
    if (!aStart || !aEnd) continue;

    for (let j = i + 1; j < relationships.length; j++) {
      const b = relationships[j];
      if (
        a.startTableId === b.startTableId ||
        a.startTableId === b.endTableId ||
        a.endTableId === b.startTableId ||
        a.endTableId === b.endTableId
      ) {
        continue;
      }

      const bStart = centers.get(b.startTableId);
      const bEnd = centers.get(b.endTableId);
      if (!bStart || !bEnd) continue;

      if (segmentsIntersect(aStart, aEnd, bStart, bEnd)) {
        crossings++;
      }
    }
  }
  return crossings;
}

function buildAdjacency(tableIds, relationships, directed = true) {
  const adjacency = new Map(tableIds.map((id) => [id, new Set()]));

  relationships.forEach((rel) => {
    if (!adjacency.has(rel.startTableId) || !adjacency.has(rel.endTableId)) {
      return;
    }
    adjacency.get(rel.startTableId).add(rel.endTableId);
    if (!directed) {
      adjacency.get(rel.endTableId).add(rel.startTableId);
    }
  });
  return adjacency;
}

function computeMaxDepth(tableIds, relationships) {
  if (tableIds.length === 0) return 0;

  const adjacency = buildAdjacency(tableIds, relationships, true);
  let maxDepth = 0;

  tableIds.forEach((start) => {
    const queue = [{ id: start, depth: 0 }];
    const visited = new Set([start]);
    while (queue.length) {
      const node = queue.shift();
      maxDepth = Math.max(maxDepth, node.depth);
      adjacency.get(node.id).forEach((next) => {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ id: next, depth: node.depth + 1 });
        }
      });
    }
  });

  return maxDepth;
}

function computeConnectedComponents(tableIds, relationships) {
  if (tableIds.length === 0) return 0;
  const adjacency = buildAdjacency(tableIds, relationships, false);
  const visited = new Set();
  let components = 0;

  tableIds.forEach((id) => {
    if (visited.has(id)) return;
    components++;
    const stack = [id];
    visited.add(id);
    while (stack.length) {
      const node = stack.pop();
      adjacency.get(node).forEach((next) => {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      });
    }
  });
  return components;
}

export function calculateLayoutStats({ tables, relationships, tableWidth }) {
  const tableIds = tables.map((table) => table.id);
  const connectedTableIds = new Set();
  relationships.forEach((rel) => {
    connectedTableIds.add(rel.startTableId);
    connectedTableIds.add(rel.endTableId);
  });

  return {
    tables: tables.length,
    relationships: relationships.length,
    isolatedTables: tables.filter((table) => !connectedTableIds.has(table.id)).length,
    maxDepth: computeMaxDepth(tableIds, relationships),
    connectedComponents: computeConnectedComponents(tableIds, relationships),
    crossings: countRelationshipCrossings(tables, relationships, tableWidth),
  };
}

function buildLayering(tables, relationships) {
  const tableIds = tables.map((table) => table.id);
  const incomingCount = new Map(tableIds.map((id) => [id, 0]));
  const outgoing = new Map(tableIds.map((id) => [id, []]));

  relationships.forEach((rel) => {
    if (!outgoing.has(rel.startTableId) || !incomingCount.has(rel.endTableId)) {
      return;
    }
    outgoing.get(rel.startTableId).push(rel.endTableId);
    incomingCount.set(rel.endTableId, incomingCount.get(rel.endTableId) + 1);
  });

  const queue = tableIds.filter((id) => incomingCount.get(id) === 0);
  const levels = new Map(tableIds.map((id) => [id, 0]));

  while (queue.length) {
    const node = queue.shift();
    outgoing.get(node).forEach((neighbor) => {
      levels.set(neighbor, Math.max(levels.get(neighbor), levels.get(node) + 1));
      incomingCount.set(neighbor, incomingCount.get(neighbor) - 1);
      if (incomingCount.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Cycles keep non-zero incoming; keep them in a deterministic fallback layer.
  tableIds.forEach((id) => {
    if (incomingCount.get(id) > 0) levels.set(id, 0);
  });

  const layers = [];
  const maxLevel = Math.max(0, ...levels.values());
  for (let i = 0; i <= maxLevel; i++) layers.push([]);
  tables.forEach((table) => {
    layers[levels.get(table.id)].push(table.id);
  });
  return layers;
}

function buildNeighbors(relationships) {
  const neighbors = new Map();
  relationships.forEach((rel) => {
    if (!neighbors.has(rel.startTableId)) neighbors.set(rel.startTableId, new Set());
    if (!neighbors.has(rel.endTableId)) neighbors.set(rel.endTableId, new Set());
    neighbors.get(rel.startTableId).add(rel.endTableId);
    neighbors.get(rel.endTableId).add(rel.startTableId);
  });
  return neighbors;
}

export function autoArrangeTables(tables, relationships, tableWidth) {
  if (tables.length < 2) return tables;

  const layers = buildLayering(tables, relationships);
  const neighbors = buildNeighbors(relationships);
  const order = new Map();

  layers.forEach((layer) => {
    layer.forEach((id, index) => order.set(id, index));
  });

  for (let pass = 0; pass < 8; pass++) {
    layers.forEach((layer) => {
      layer.sort((a, b) => {
        const aNeighbors = [...(neighbors.get(a) || [])];
        const bNeighbors = [...(neighbors.get(b) || [])];
        const aScore =
          aNeighbors.length === 0
            ? order.get(a)
            : aNeighbors.reduce((sum, id) => sum + (order.get(id) ?? 0), 0) /
              aNeighbors.length;
        const bScore =
          bNeighbors.length === 0
            ? order.get(b)
            : bNeighbors.reduce((sum, id) => sum + (order.get(id) ?? 0), 0) /
              bNeighbors.length;
        return aScore - bScore;
      });
      layer.forEach((id, index) => order.set(id, index));
    });
  }

  const colGap = 80;
  const rowGap = 96;
  const nextTables = tables.map((table) => ({ ...table }));
  const byId = new Map(nextTables.map((table) => [table.id, table]));

  layers.forEach((layer, layerIndex) => {
    layer.forEach((id, rowIndex) => {
      const table = byId.get(id);
      if (!table) return;
      table.x = layerIndex * (tableWidth + colGap);
      table.y = rowIndex * rowGap;
    });
  });

  // Local swaps to reduce estimated crossings after initial layering.
  let improved = true;
  while (improved) {
    improved = false;
    for (const layer of layers) {
      for (let i = 0; i < layer.length - 1; i++) {
        const a = byId.get(layer[i]);
        const b = byId.get(layer[i + 1]);
        if (!a || !b) continue;

        const before = countRelationshipCrossings(nextTables, relationships, tableWidth);
        const oldAY = a.y;
        a.y = b.y;
        b.y = oldAY;
        const after = countRelationshipCrossings(nextTables, relationships, tableWidth);
        if (after < before) {
          improved = true;
          [layer[i], layer[i + 1]] = [layer[i + 1], layer[i]];
        } else {
          const resetY = a.y;
          a.y = b.y;
          b.y = resetY;
        }
      }
    }
  }

  return nextTables.map((table) => ({
    ...table,
    x: Math.round(table.x / gridSize) * gridSize,
    y: Math.round(table.y / gridSize) * gridSize,
  }));
}

export function createAutoArrangeUndoEntry(beforeTables, afterTables) {
  const afterById = new Map(afterTables.map((table) => [table.id, table]));
  return {
    bulk: true,
    action: Action.EDIT,
    message: "Auto arrange tables",
    elements: beforeTables
      .filter((table) => afterById.has(table.id))
      .map((table) => {
        const next = afterById.get(table.id);
        return {
          id: table.id,
          type: ObjectType.TABLE,
          undo: { x: table.x, y: table.y },
          redo: { x: next.x, y: next.y },
        };
      }),
  };
}
