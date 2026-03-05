import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
} from "../data/constants";

export function arrangeTables(diagram) {
  const tableWidth = 200;
  const gapX = 54;
  const gapY = 40;

  const tables = diagram.tables || [];
  const relationships = diagram.relationships || [];

  // If there are no relationships, fallback to a simple two-row layout
  if (!relationships || relationships.length === 0) {
    let maxHeight = -1;
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
    return;
  }

  // Layered layout by topological layering (Kahn's algorithm) to reduce crossings
  const idSet = new Set(tables.map((t) => t.id));
  const adj = {};
  const inDeg = {};
  tables.forEach((t) => {
    adj[t.id] = [];
    inDeg[t.id] = 0;
  });

  relationships.forEach((r) => {
    const s = r.startTableId;
    const e = r.endTableId;
    if (idSet.has(s) && idSet.has(e)) {
      adj[s].push(e);
      inDeg[e] = (inDeg[e] || 0) + 1;
    }
  });

  let queue = Object.keys(inDeg)
    .filter((k) => inDeg[k] === 0)
    .map((k) => Number(k));
  if (queue.length === 0) queue = tables.map((t) => t.id);

  const layers = {};
  const remaining = { ...inDeg };
  let layerIndex = 0;
  while (queue.length > 0) {
    const next = [];
    for (const id of queue) {
      layers[id] = layerIndex;
      for (const nb of adj[id]) {
        remaining[nb] = remaining[nb] - 1;
        if (remaining[nb] === 0) next.push(nb);
      }
    }
    queue = next;
    layerIndex++;
  }

  const maxLayer = layerIndex;
  tables.forEach((t) => {
    if (layers[t.id] === undefined) layers[t.id] = maxLayer;
  });

  // Group tables per layer
  const layerNodes = [];
  tables.forEach((t) => {
    const li = layers[t.id] || 0;
    if (!layerNodes[li]) layerNodes[li] = [];
    layerNodes[li].push(t);
  });

  // Compute max height per layer and place tables horizontally
  const layerHeights = layerNodes.map((layer) => {
    if (!layer) return 0;
    let mh = 0;
    layer.forEach((t) => {
      const h =
        (t.fields ? t.fields.length : 0) * tableFieldHeight +
        tableHeaderHeight +
        tableColorStripHeight;
      mh = Math.max(mh, h);
    });
    return mh;
  });

  let y = gapY;
  for (let i = 0; i < layerNodes.length; i++) {
    const nodes = layerNodes[i] || [];
    // sort by degree (descending) to try to reduce edge crossings
    nodes.sort((a, b) => {
      const degA = (adj[a.id] ? adj[a.id].length : 0) +
        relationships.filter((r) => r.endTableId === a.id).length;
      const degB = (adj[b.id] ? adj[b.id].length : 0) +
        relationships.filter((r) => r.endTableId === b.id).length;
      return degB - degA;
    });

    for (let j = 0; j < nodes.length; j++) {
      const table = nodes[j];
      table.x = j * tableWidth + (j + 1) * gapX;
      table.y = y;
    }
    y += (layerHeights[i] || 0) + gapY;
  }
}
