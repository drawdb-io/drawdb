import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
  tableWidth as defaultTableWidth,
} from "../data/constants";

/**
 * Arrange tables in the diagram.
 *
 * When relationships are present, this uses a force-directed layout
 * (Fruchterman–Reingold–style) to reduce edge crossings and cluster
 * related tables. When there are no relationships, it falls back to
 * a simple two-row layout.
 *
 * The function mutates the `diagram.tables` array in-place.
 *
 * @param {{ tables: any[]; relationships?: any[] }} diagram
 * @param {{ tableWidth?: number }} [options]
 */
export function arrangeTables(diagram, options = {}) {
  const tables = diagram.tables || [];
  const relationships = diagram.relationships || [];
  const n = tables.length;
  if (n === 0) return;

  const tableWidth = options.tableWidth ?? defaultTableWidth;

  // If there are no relationships, keep the existing simple two-row layout
  // which already gives a reasonable, compact arrangement.
  if (!relationships.length) {
    simpleTwoRowLayout(tables, tableWidth);
    return;
  }

  // Build mapping from table id to index and collect edges
  const indexById = new Map();
  tables.forEach((t, i) => {
    if (t && t.id != null) indexById.set(t.id, i);
  });

  const edges = [];
  for (const rel of relationships) {
    const startIdx = indexById.get(rel.startTableId);
    const endIdx = indexById.get(rel.endTableId);
    if (
      typeof startIdx !== "number" ||
      typeof endIdx !== "number" ||
      startIdx === endIdx
    ) {
      continue;
    }
    edges.push([startIdx, endIdx]);
  }

  // If we couldn't construct any edges, fallback to the simple layout.
  if (!edges.length) {
    simpleTwoRowLayout(tables, tableWidth);
    return;
  }

  // ----- Force-directed layout (Fruchterman–Reingold style) -----

  // Logical drawing area; we normalize positions into this box.
  const areaWidth = Math.max(800, Math.sqrt(n) * (tableWidth + 160));
  const areaHeight = areaWidth;
  const centerX = areaWidth / 2;
  const centerY = areaHeight / 2;

  // Initial positions: use existing coordinates when available,
  // otherwise place nodes on a circle.
  const positions = tables.map((t, i) => {
    if (
      typeof t.x === "number" &&
      !Number.isNaN(t.x) &&
      typeof t.y === "number" &&
      !Number.isNaN(t.y)
    ) {
      return { x: t.x, y: t.y };
    }

    const angle = (2 * Math.PI * i) / n;
    const radius = Math.min(areaWidth, areaHeight) / 3;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  // Optimal pairwise distance
  const k = Math.sqrt((areaWidth * areaHeight) / n);
  const maxIterations = Math.min(200, 30 + n * 5);
  let temperature = areaWidth / 10;

  for (let iter = 0; iter < maxIterations; iter++) {
    const disp = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

    // Repulsive forces between all pairs of tables
    for (let v = 0; v < n; v++) {
      for (let u = v + 1; u < n; u++) {
        let dx = positions[v].x - positions[u].x;
        let dy = positions[v].y - positions[u].y;
        let dist = Math.hypot(dx, dy);
        if (dist === 0) {
          // Avoid division by zero by nudging slightly
          dx = (Math.random() - 0.5) || 0.01;
          dy = (Math.random() - 0.5) || 0.01;
          dist = Math.hypot(dx, dy);
        }
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp[v].x += fx;
        disp[v].y += fy;
        disp[u].x -= fx;
        disp[u].y -= fy;
      }
    }

    // Attractive forces along edges (relationships)
    for (const [v, u] of edges) {
      let dx = positions[v].x - positions[u].x;
      let dy = positions[v].y - positions[u].y;
      let dist = Math.hypot(dx, dy);
      if (dist === 0) {
        dx = (Math.random() - 0.5) || 0.01;
        dy = (Math.random() - 0.5) || 0.01;
        dist = Math.hypot(dx, dy);
      }
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp[v].x -= fx;
      disp[v].y -= fy;
      disp[u].x += fx;
      disp[u].y += fy;
    }

    // Mild gravity towards center to keep components together
    for (let v = 0; v < n; v++) {
      const dx = positions[v].x - centerX;
      const dy = positions[v].y - centerY;
      disp[v].x -= dx * 0.01;
      disp[v].y -= dy * 0.01;
    }

    // Apply displacements with cooling and bounding box
    for (let v = 0; v < n; v++) {
      const dx = disp[v].x;
      const dy = disp[v].y;
      const dispLen = Math.hypot(dx, dy);
      if (dispLen > 0) {
        const limited = Math.min(temperature, dispLen);
        positions[v].x += (dx / dispLen) * limited;
        positions[v].y += (dy / dispLen) * limited;
      }

      // Keep within bounds, leaving a margin for table size
      const margin = 40;
      const maxX = areaWidth - tableWidth - margin;
      const maxY =
        areaHeight -
        (tableHeaderHeight + tableColorStripHeight + tableFieldHeight * 2) -
        margin;

      positions[v].x = Math.min(
        maxX,
        Math.max(margin, positions[v].x),
      );
      positions[v].y = Math.min(
        maxY,
        Math.max(margin, positions[v].y),
      );
    }

    temperature *= 0.95;
    if (temperature < 1) break;
  }

  // Normalize so that the minimum coordinates start near a fixed padding
  let minX = Infinity;
  let minY = Infinity;
  for (const p of positions) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
  }
  const offsetX = 40 - minX;
  const offsetY = 40 - minY;

  positions.forEach((p, i) => {
    tables[i].x = Math.round(p.x + offsetX);
    tables[i].y = Math.round(p.y + offsetY);
  });
}

function simpleTwoRowLayout(tables, tableWidth) {
  let maxHeight = -1;
  const gapX = 54;
  const gapY = 40;

  tables.forEach((table, i) => {
    if (i < tables.length / 2) {
      table.x = i * tableWidth + (i + 1) * gapX;
      table.y = gapY;
      const height =
        table.fields.length * tableFieldHeight +
        tableHeaderHeight +
        tableColorStripHeight;
      maxHeight = Math.max(height, maxHeight);
    } else {
      const index = tables.length - i - 1;
      table.x = index * tableWidth + (index + 1) * gapX;
      table.y = maxHeight + 2 * gapY;
    }
  });
}
