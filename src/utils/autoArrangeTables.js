import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
} from "../data/constants";

function buildCrossingCounter(edges, nodeToLayer) {
  const edgesByLayerPair = new Map();
  for (const edge of edges) {
    const fromLayer = nodeToLayer.get(edge.from);
    const toLayer = nodeToLayer.get(edge.to);
    if (fromLayer === undefined || toLayer === undefined) continue;
    if (fromLayer === toLayer) continue;

    const lowLayer = Math.min(fromLayer, toLayer);
    const highLayer = Math.max(fromLayer, toLayer);
    const key = `${lowLayer}:${highLayer}`;
    const pair = edgesByLayerPair.get(key) ?? [];
    pair.push({
      lowNode: fromLayer <= toLayer ? edge.from : edge.to,
      highNode: fromLayer <= toLayer ? edge.to : edge.from,
    });
    edgesByLayerPair.set(key, pair);
  }

  return (positionByLayer) => {
    let crossings = 0;
    for (const pairEdges of edgesByLayerPair.values()) {
      for (let i = 0; i < pairEdges.length; i++) {
        for (let j = i + 1; j < pairEdges.length; j++) {
          const e1 = pairEdges[i];
          const e2 = pairEdges[j];
          const e1Low = positionByLayer.get(e1.lowNode);
          const e1High = positionByLayer.get(e1.highNode);
          const e2Low = positionByLayer.get(e2.lowNode);
          const e2High = positionByLayer.get(e2.highNode);
          if (
            e1Low !== undefined &&
            e1High !== undefined &&
            e2Low !== undefined &&
            e2High !== undefined &&
            (e1Low - e2Low) * (e1High - e2High) < 0
          ) {
            crossings += 1;
          }
        }
      }
    }
    return crossings;
  };
}

function average(values) {
  if (values.length === 0) return null;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

function buildLayers(componentNodeIds, outgoing, incoming) {
  const inDegree = new Map();
  for (const nodeId of componentNodeIds) {
    inDegree.set(nodeId, 0);
  }
  for (const nodeId of componentNodeIds) {
    for (const neighbor of outgoing.get(nodeId) ?? []) {
      if (inDegree.has(neighbor)) {
        inDegree.set(neighbor, inDegree.get(neighbor) + 1);
      }
    }
  }

  const roots = componentNodeIds.filter((nodeId) => inDegree.get(nodeId) === 0);
  const queue = roots.length > 0 ? [...roots] : [componentNodeIds[0]];
  const layerByNode = new Map();
  for (const root of queue) layerByNode.set(root, 0);

  let index = 0;
  while (index < queue.length) {
    const current = queue[index++];
    const currentLayer = layerByNode.get(current);
    for (const next of outgoing.get(current) ?? []) {
      if (!inDegree.has(next)) continue;
      const proposedLayer = currentLayer + 1;
      if (!layerByNode.has(next) || layerByNode.get(next) < proposedLayer) {
        layerByNode.set(next, proposedLayer);
      }
      if (!queue.includes(next)) queue.push(next);
    }
  }

  for (const nodeId of componentNodeIds) {
    if (!layerByNode.has(nodeId)) {
      layerByNode.set(nodeId, 0);
    }
  }

  const minLayer = Math.min(...layerByNode.values());
  if (minLayer !== 0) {
    for (const [nodeId, layer] of layerByNode.entries()) {
      layerByNode.set(nodeId, layer - minLayer);
    }
  }

  const layers = [];
  for (const nodeId of componentNodeIds) {
    const layer = layerByNode.get(nodeId);
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(nodeId);
  }
  for (const layer of layers) {
    layer.sort((a, b) => a.localeCompare(b));
  }

  const positionByNode = new Map();
  const refreshPositions = () => {
    positionByNode.clear();
    for (const layer of layers) {
      for (let pos = 0; pos < layer.length; pos++) {
        positionByNode.set(layer[pos], pos);
      }
    }
  };
  refreshPositions();

  const sortByBarycenter = (layerIndex, neighborLayerGetter) => {
    const withKeys = layers[layerIndex].map((nodeId, idx) => {
      const neighbors = neighborLayerGetter(nodeId).filter((neighborId) =>
        positionByNode.has(neighborId),
      );
      const key = average(
        neighbors.map((neighborId) => positionByNode.get(neighborId)),
      );
      return { nodeId, key, idx };
    });

    withKeys.sort((a, b) => {
      if (a.key === null && b.key === null) return a.idx - b.idx;
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      if (a.key === b.key) return a.idx - b.idx;
      return a.key - b.key;
    });

    layers[layerIndex] = withKeys.map((entry) => entry.nodeId);
  };

  for (let iteration = 0; iteration < 10; iteration++) {
    for (let layerIndex = 1; layerIndex < layers.length; layerIndex++) {
      sortByBarycenter(layerIndex, (nodeId) => incoming.get(nodeId) ?? []);
      refreshPositions();
    }
    for (let layerIndex = layers.length - 2; layerIndex >= 0; layerIndex--) {
      sortByBarycenter(layerIndex, (nodeId) => outgoing.get(nodeId) ?? []);
      refreshPositions();
    }
  }

  const countCrossings = buildCrossingCounter(
    componentNodeIds.flatMap((nodeId) =>
      (outgoing.get(nodeId) ?? [])
        .filter((targetId) => layerByNode.has(targetId))
        .map((targetId) => ({ from: nodeId, to: targetId })),
    ),
    layerByNode,
  );

  let improved = true;
  while (improved) {
    improved = false;
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      for (let i = 0; i < layer.length - 1; i++) {
        refreshPositions();
        const before = countCrossings(positionByNode);
        const temp = layer[i];
        layer[i] = layer[i + 1];
        layer[i + 1] = temp;
        refreshPositions();
        const after = countCrossings(positionByNode);
        if (after < before) {
          improved = true;
        } else {
          const revert = layer[i];
          layer[i] = layer[i + 1];
          layer[i + 1] = revert;
        }
      }
    }
  }

  return layers;
}

function getComponents(nodeIds, adjacency) {
  const visited = new Set();
  const components = [];
  for (const nodeId of nodeIds) {
    if (visited.has(nodeId)) continue;
    const component = [];
    const stack = [nodeId];
    visited.add(nodeId);
    while (stack.length > 0) {
      const current = stack.pop();
      component.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    components.push(component);
  }
  return components;
}

export function autoArrangeTables(tables, relationships, options = {}) {
  const tableWidth = options.tableWidth ?? 200;
  const gapX = options.gapX ?? 120;
  const gapY = options.gapY ?? 40;
  const componentGapX = options.componentGapX ?? 180;

  if (!tables || tables.length === 0) return new Map();

  const tableById = new Map(tables.map((table) => [table.id, table]));
  const nodeIds = tables.map((table) => table.id);

  const outgoing = new Map();
  const incoming = new Map();
  const adjacency = new Map();
  for (const nodeId of nodeIds) {
    outgoing.set(nodeId, []);
    incoming.set(nodeId, []);
    adjacency.set(nodeId, []);
  }

  for (const relationship of relationships) {
    if (
      !tableById.has(relationship.startTableId) ||
      !tableById.has(relationship.endTableId)
    ) {
      continue;
    }
    outgoing.get(relationship.startTableId).push(relationship.endTableId);
    incoming.get(relationship.endTableId).push(relationship.startTableId);
    adjacency.get(relationship.startTableId).push(relationship.endTableId);
    adjacency.get(relationship.endTableId).push(relationship.startTableId);
  }

  const components = getComponents(nodeIds, adjacency).sort(
    (a, b) => b.length - a.length,
  );

  const result = new Map();
  let cursorX = gapX;

  for (const component of components) {
    const layers = buildLayers(component, outgoing, incoming);
    let componentWidth = 0;

    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      let cursorY = gapY;
      for (const nodeId of layer) {
        const table = tableById.get(nodeId);
        const tableHeight =
          tableHeaderHeight +
          tableColorStripHeight +
          table.fields.length * tableFieldHeight;
        result.set(nodeId, {
          x: cursorX + layerIndex * (tableWidth + gapX),
          y: cursorY,
        });
        cursorY += tableHeight + gapY;
      }
      componentWidth = Math.max(
        componentWidth,
        (layerIndex + 1) * tableWidth + layerIndex * gapX,
      );
    }

    cursorX += componentWidth + componentGapX;
  }

  return result;
}

