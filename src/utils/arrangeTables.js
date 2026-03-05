import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
  tableWidth as defaultTableWidth,
} from "../data/constants";

/**
 * Simple two-row arrangement used when importing diagrams.
 * Mutates the given diagram in place.
 */
export function arrangeTables(diagram) {
  let maxHeight = -1;
  const tableWidth = 200;
  const gapX = 54;
  const gapY = 40;
  diagram.tables.forEach((table, i) => {
    if (i < diagram.tables.length / 2) {
      table.x = i * tableWidth + (i + 1) * gapX;
      table.y = gapY;
      const height =
        table.fields.length * tableFieldHeight +
        tableHeaderHeight +
        tableColorStripHeight;
      maxHeight = Math.max(height, maxHeight);
    } else {
      const index = diagram.tables.length - i - 1;
      table.x = index * tableWidth + (index + 1) * gapX;
      table.y = maxHeight + 2 * gapY;
    }
  });
}

/**
 * Force-directed layout for the live editor that tries to reduce
 * relationship crossings by pulling related tables closer together
 * and pushing unrelated tables apart.
 *
 * Returns a map of tableId -> { x, y } with new coordinates.
 *
 * Locked tables (table.locked === true) keep their original position.
 *
 * @param {Array} tables
 * @param {Array} relationships
 * @param {Object} [options]
 * @param {number} [options.iterations]
 */
export function autoArrangeTables(tables, relationships, options = {}) {
  if (!Array.isArray(tables) || tables.length <= 1) {
    return {};
  }

  const iterations = Number.isFinite(options.iterations)
    ? options.iterations
    : 80;

  const nodes = tables.map((table, index) => ({
    id: table.id,
    locked: !!table.locked,
    // fall back to a simple grid if coordinates are missing
    x:
      typeof table.x === "number"
        ? table.x
        : (index % 5) * (defaultTableWidth + 80),
    y:
      typeof table.y === "number"
        ? table.y
        : Math.floor(index / 5) * (tableHeaderHeight + tableFieldHeight * 4),
  }));

  const idToIndex = new Map(nodes.map((n, idx) => [n.id, idx]));

  const edges = [];
  if (Array.isArray(relationships)) {
    for (const rel of relationships) {
      const s = idToIndex.get(rel.startTableId);
      const e = idToIndex.get(rel.endTableId);
      if (s == null || e == null || s === e) continue;
      edges.push([s, e]);
    }
  }

  if (edges.length === 0) {
    // With no relationships, just roughly spread tables in a grid.
    const result = {};
    nodes.forEach((n, index) => {
      result[n.id] = {
        x: (index % 5) * (defaultTableWidth + 80),
        y: Math.floor(index / 5) * (tableHeaderHeight + tableFieldHeight * 4),
      };
    });
    return result;
  }

  const area =
    Math.max(
      nodes.length * (defaultTableWidth + 80) * (tableHeaderHeight + 4 * tableFieldHeight),
      1,
    );
  const k = Math.sqrt(area / nodes.length);
  let temperature = k * 0.8;

  const epsilon = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    const disp = nodes.map(() => ({ x: 0, y: 0 }));

    // Repulsive forces between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + epsilon;
        const force = (k * k) / dist;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        disp[i].x += fx;
        disp[i].y += fy;
        disp[j].x -= fx;
        disp[j].y -= fy;
      }
    }

    // Attractive forces along relationships
    for (const [si, ei] of edges) {
      const dx = nodes[si].x - nodes[ei].x;
      const dy = nodes[si].y - nodes[ei].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + epsilon;
      const force = (dist * dist) / k;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      disp[si].x -= fx;
      disp[si].y -= fy;
      disp[ei].x += fx;
      disp[ei].y += fy;
    }

    // Update positions
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.locked) continue;

      const dx = disp[i].x;
      const dy = disp[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || epsilon;

      const limited = Math.min(dist, temperature);
      node.x += (dx / dist) * limited;
      node.y += (dy / dist) * limited;
    }

    // Cool down
    temperature *= 0.95;
    if (temperature < 1) break;
  }

  // Normalize positions so everything is in positive space with padding
  let minX = Infinity;
  let minY = Infinity;
  for (const node of nodes) {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
  }
  if (!Number.isFinite(minX)) minX = 0;
  if (!Number.isFinite(minY)) minY = 0;

  const paddingX = defaultTableWidth;
  const paddingY = tableHeaderHeight + tableFieldHeight * 2;

  const result = {};
  for (const node of nodes) {
    const rawX = Number.isFinite(node.x) ? node.x : 0;
    const rawY = Number.isFinite(node.y) ? node.y : 0;
    result[node.id] = {
      x: rawX - minX + paddingX,
      y: rawY - minY + paddingY,
    };
  }

  return result;
}

