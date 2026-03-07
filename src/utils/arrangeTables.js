import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
} from "../data/constants";

const DEFAULT_TABLE_WIDTH = 200;
const GAP_X = 54;
const GAP_Y = 64;
const COMPONENT_GAP_Y = 120;
const SWEEPS = 6;

function tableHeight(table) {
  return (
    table.fields.length * tableFieldHeight +
    tableHeaderHeight +
    tableColorStripHeight
  );
}

function countCrossings(pairs, movingOrder, fixedOrder) {
  if (pairs.length <= 1) return 0;

  const movingPos = new Map(movingOrder.map((id, i) => [id, i]));
  const fixedPos = new Map(fixedOrder.map((id, i) => [id, i]));

  let crossings = 0;
  for (let i = 0; i < pairs.length; i++) {
    const [m1, f1] = pairs[i];
    const m1Pos = movingPos.get(m1);
    const f1Pos = fixedPos.get(f1);
    if (m1Pos === undefined || f1Pos === undefined) continue;

    for (let j = i + 1; j < pairs.length; j++) {
      const [m2, f2] = pairs[j];
      const m2Pos = movingPos.get(m2);
      const f2Pos = fixedPos.get(f2);
      if (m2Pos === undefined || f2Pos === undefined) continue;

      if ((m1Pos - m2Pos) * (f1Pos - f2Pos) < 0) {
        crossings++;
      }
    }
  }

  return crossings;
}

function optimizeLayerOrder(layer, fixedLayer, pairs) {
  if (layer.length <= 2 || pairs.length === 0) return layer;

  let improved = true;
  let order = [...layer];

  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++) {
      const baseCrossings = countCrossings(pairs, order, fixedLayer);
      const candidate = [...order];
      [candidate[i], candidate[i + 1]] = [candidate[i + 1], candidate[i]];
      const candidateCrossings = countCrossings(pairs, candidate, fixedLayer);
      if (candidateCrossings < baseCrossings) {
        order = candidate;
        improved = true;
      }
    }
  }

  return order;
}

function connectedComponents(tables, neighbors) {
  const components = [];
  const visited = new Set();

  for (const table of tables) {
    if (visited.has(table.id)) continue;

    const stack = [table.id];
    const component = [];
    visited.add(table.id);

    while (stack.length > 0) {
      const current = stack.pop();
      component.push(current);

      for (const next of neighbors.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }

    components.push(component);
  }

  return components;
}

/**
 * @param {object} diagram - Diagram with tables and relationships (tables mutated in place).
 * @param {{ tableWidth?: number }} [options] - Optional. tableWidth from settings; defaults to DEFAULT_TABLE_WIDTH.
 */
export function arrangeTables(diagram, options = {}) {
  const tableWidth = options.tableWidth ?? DEFAULT_TABLE_WIDTH;
  const { tables = [], relationships = [] } = diagram;
  if (tables.length === 0) return;

  const tableById = new Map(tables.map((table) => [table.id, table]));
  const neighbors = new Map();
  for (const table of tables) {
    neighbors.set(table.id, new Set());
  }

  for (const relationship of relationships) {
    const { startTableId, endTableId } = relationship;
    if (!tableById.has(startTableId) || !tableById.has(endTableId)) continue;
    if (startTableId === endTableId) continue;
    neighbors.get(startTableId).add(endTableId);
    neighbors.get(endTableId).add(startTableId);
  }

  const components = connectedComponents(tables, neighbors).sort(
    (a, b) => b.length - a.length,
  );

  let globalYOffset = GAP_Y;

  for (const component of components) {
    const componentSet = new Set(component);
    const degrees = component.map((id) => ({
      id,
      degree: neighbors.get(id)?.size ?? 0,
    }));
    degrees.sort((a, b) => b.degree - a.degree);
    const root = degrees[0]?.id ?? component[0];

    const queue = [root];
    const layerById = new Map([[root, 0]]);
    let cursor = 0;

    while (cursor < queue.length) {
      const current = queue[cursor++];
      const currentLayer = layerById.get(current);
      for (const next of neighbors.get(current) ?? []) {
        if (!componentSet.has(next) || layerById.has(next)) continue;
        layerById.set(next, currentLayer + 1);
        queue.push(next);
      }
    }

    for (const id of component) {
      if (!layerById.has(id)) layerById.set(id, 0);
    }

    const maxLayer = Math.max(...layerById.values());
    const layers = Array.from({ length: maxLayer + 1 }, () => []);
    for (const id of component) {
      layers[layerById.get(id)].push(id);
    }

    for (const layer of layers) {
      layer.sort(
        (a, b) =>
          (neighbors.get(b)?.size ?? 0) - (neighbors.get(a)?.size ?? 0),
      );
    }

    for (let sweep = 0; sweep < SWEEPS; sweep++) {
      for (let layerIndex = 1; layerIndex < layers.length; layerIndex++) {
        const prevLayer = layers[layerIndex - 1];
        const prevPos = new Map(prevLayer.map((id, i) => [id, i]));

        layers[layerIndex].sort((a, b) => {
          const baryA = [...(neighbors.get(a) ?? [])]
            .filter((id) => prevPos.has(id))
            .reduce((sum, id) => sum + prevPos.get(id), 0);
          const countA = [...(neighbors.get(a) ?? [])].filter((id) =>
            prevPos.has(id),
          ).length;

          const baryB = [...(neighbors.get(b) ?? [])]
            .filter((id) => prevPos.has(id))
            .reduce((sum, id) => sum + prevPos.get(id), 0);
          const countB = [...(neighbors.get(b) ?? [])].filter((id) =>
            prevPos.has(id),
          ).length;

          const posA = countA === 0 ? Number.MAX_SAFE_INTEGER : baryA / countA;
          const posB = countB === 0 ? Number.MAX_SAFE_INTEGER : baryB / countB;
          return posA - posB;
        });

        const pairs = [];
        for (const id of layers[layerIndex]) {
          for (const n of neighbors.get(id) ?? []) {
            if (layerById.get(n) === layerIndex - 1) {
              pairs.push([id, n]);
            }
          }
        }
        layers[layerIndex] = optimizeLayerOrder(
          layers[layerIndex],
          prevLayer,
          pairs,
        );
      }

      for (let layerIndex = layers.length - 2; layerIndex >= 0; layerIndex--) {
        const nextLayer = layers[layerIndex + 1];
        const nextPos = new Map(nextLayer.map((id, i) => [id, i]));

        layers[layerIndex].sort((a, b) => {
          const baryA = [...(neighbors.get(a) ?? [])]
            .filter((id) => nextPos.has(id))
            .reduce((sum, id) => sum + nextPos.get(id), 0);
          const countA = [...(neighbors.get(a) ?? [])].filter((id) =>
            nextPos.has(id),
          ).length;

          const baryB = [...(neighbors.get(b) ?? [])]
            .filter((id) => nextPos.has(id))
            .reduce((sum, id) => sum + nextPos.get(id), 0);
          const countB = [...(neighbors.get(b) ?? [])].filter((id) =>
            nextPos.has(id),
          ).length;

          const posA = countA === 0 ? Number.MAX_SAFE_INTEGER : baryA / countA;
          const posB = countB === 0 ? Number.MAX_SAFE_INTEGER : baryB / countB;
          return posA - posB;
        });

        const pairs = [];
        for (const id of layers[layerIndex]) {
          for (const n of neighbors.get(id) ?? []) {
            if (layerById.get(n) === layerIndex + 1) {
              pairs.push([id, n]);
            }
          }
        }
        layers[layerIndex] = optimizeLayerOrder(
          layers[layerIndex],
          nextLayer,
          pairs,
        );
      }
    }

    let componentMaxWidth = 0;
    let y = globalYOffset;

    for (const layer of layers) {
      const currentWidth =
        layer.length * tableWidth + Math.max(0, layer.length - 1) * GAP_X;
      componentMaxWidth = Math.max(componentMaxWidth, currentWidth);
      const rowHeight = Math.max(
        ...layer.map((id) => tableHeight(tableById.get(id))),
        tableHeaderHeight + tableColorStripHeight,
      );

      const startX = GAP_X;
      layer.forEach((id, index) => {
        const table = tableById.get(id);
        table.x = startX + index * (tableWidth + GAP_X);
        table.y = y;
      });

      y += rowHeight + GAP_Y;
    }
    globalYOffset = y + COMPONENT_GAP_Y;
    if (componentMaxWidth > 0) {
      globalYOffset = Math.max(globalYOffset, y + COMPONENT_GAP_Y);
    }
  }
}
