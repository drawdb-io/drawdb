import { tableWidth as defaultTableWidth } from "../data/constants";

/**
 * Arrange tables in layers based on the relationship graph.
 * This is a heuristic that tends to reduce line crossings by:
 * - Putting related tables in the same connected component close together
 * - Stacking relationship "levels" vertically
 * - Placing disconnected components side by side
 */
export function arrangeTables(diagram) {
  const { tables, relationships = [] } = diagram;
  if (!tables || tables.length === 0) return;

  const tableWidth = defaultTableWidth;
  const gapX = 80;
  const gapY = 140;
  const baseY = 40;

  // Fallback: simple grid when there are no relationships
  if (!relationships.length) {
    tables.forEach((table, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      table.x = col * (tableWidth + gapX);
      table.y = baseY + row * gapY;
    });
    return;
  }

  const idToTable = new Map();
  const adjacency = new Map();

  tables.forEach((t) => {
    idToTable.set(t.id, t);
    adjacency.set(t.id, new Set());
  });

  relationships.forEach((r) => {
    if (adjacency.has(r.startTableId) && adjacency.has(r.endTableId)) {
      adjacency.get(r.startTableId).add(r.endTableId);
      adjacency.get(r.endTableId).add(r.startTableId);
    }
  });

  const layersById = new Map();
  const visited = new Set();

  const bfsAssignLayers = (rootId) => {
    const queue = [[rootId, 0]];
    visited.add(rootId);
    layersById.set(rootId, 0);

    while (queue.length) {
      const [current, layer] = queue.shift();
      const neighbors = adjacency.get(current) || new Set();
      [...neighbors].forEach((nId) => {
        if (!visited.has(nId)) {
          visited.add(nId);
          layersById.set(nId, layer + 1);
          queue.push([nId, layer + 1]);
        }
      });
    }
  };

  // Run BFS for each connected component
  tables.forEach((t) => {
    if (!visited.has(t.id)) {
      bfsAssignLayers(t.id);
    }
  });

  // Group tables by layer
  const layerToTables = new Map();
  tables.forEach((t) => {
    const layer = layersById.get(t.id) ?? 0;
    if (!layerToTables.has(layer)) {
      layerToTables.set(layer, []);
    }
    layerToTables.get(layer).push(t);
  });

  let currentXOffset = 0;
  const sortedLayers = [...layerToTables.keys()].sort((a, b) => a - b);

  sortedLayers.forEach((layer) => {
    const layerTables = layerToTables.get(layer);
    // Stable order for reproducible layouts
    layerTables.sort((a, b) => a.name.localeCompare(b.name));

    let x = currentXOffset;
    const y = baseY + layer * gapY;

    layerTables.forEach((table) => {
      table.x = x;
      table.y = y;
      x += tableWidth + gapX;
    });

    // Advance offset so other components at the same layer do not overlap
    currentXOffset = Math.max(currentXOffset, x);
  });
}

