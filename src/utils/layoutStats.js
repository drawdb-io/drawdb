import { tableColorStripHeight, tableFieldHeight, tableHeaderHeight } from "../data/constants";

function getTableHeight(table) {
  return (
    table.fields.length * tableFieldHeight +
    tableHeaderHeight +
    tableColorStripHeight
  );
}

function getTableCenter(table, tableWidth) {
  return {
    x: table.x + tableWidth / 2,
    y: table.y + getTableHeight(table) / 2,
  };
}

function orientation(a, b, c) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (value === 0) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a, b, c) {
  return (
    Math.min(a.x, c.x) <= b.x &&
    b.x <= Math.max(a.x, c.x) &&
    Math.min(a.y, c.y) <= b.y &&
    b.y <= Math.max(a.y, c.y)
  );
}

function segmentsIntersect(p1, q1, p2, q2) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

export function countRelationshipCrossings(tables, relationships, tableWidth) {
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const edges = relationships
    .map((relationship) => {
      const startTable = tableById.get(relationship.startTableId);
      const endTable = tableById.get(relationship.endTableId);
      if (!startTable || !endTable || startTable.id === endTable.id) return null;
      return {
        relationship,
        start: getTableCenter(startTable, tableWidth),
        end: getTableCenter(endTable, tableWidth),
      };
    })
    .filter(Boolean);

  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i].relationship;
      const b = edges[j].relationship;
      const sharedEndpoint =
        a.startTableId === b.startTableId ||
        a.startTableId === b.endTableId ||
        a.endTableId === b.startTableId ||
        a.endTableId === b.endTableId;
      if (sharedEndpoint) continue;

      if (segmentsIntersect(edges[i].start, edges[i].end, edges[j].start, edges[j].end)) {
        count++;
      }
    }
  }

  return count;
}

function maxDepth(tables, relationships) {
  const ids = tables.map((table) => table.id);
  const outgoing = new Map(ids.map((id) => [id, new Set()]));
  const incoming = new Map(ids.map((id) => [id, 0]));

  for (const relationship of relationships) {
    const { startTableId, endTableId } = relationship;
    if (!outgoing.has(startTableId) || !outgoing.has(endTableId)) continue;
    if (startTableId === endTableId) continue;
    if (!outgoing.get(startTableId).has(endTableId)) {
      outgoing.get(startTableId).add(endTableId);
      incoming.set(endTableId, incoming.get(endTableId) + 1);
    }
  }

  const startNodes = Array.from(ids);
  const memo = new Map();

  const dfs = (id, visiting = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    visiting.add(id);

    let best = 0;
    for (const next of outgoing.get(id) ?? []) {
      if (visiting.has(next)) continue;
      best = Math.max(best, 1 + dfs(next, visiting));
    }

    visiting.delete(id);
    memo.set(id, best);
    return best;
  };

  let result = 0;
  for (const id of startNodes) {
    result = Math.max(result, dfs(id));
  }
  return result;
}

function connectedComponents(tables, relationships) {
  const ids = tables.map((table) => table.id);
  const neighbors = new Map(ids.map((id) => [id, new Set()]));

  for (const relationship of relationships) {
    const { startTableId, endTableId } = relationship;
    if (!neighbors.has(startTableId) || !neighbors.has(endTableId)) continue;
    if (startTableId === endTableId) continue;
    neighbors.get(startTableId).add(endTableId);
    neighbors.get(endTableId).add(startTableId);
  }

  let components = 0;
  const visited = new Set();
  for (const id of ids) {
    if (visited.has(id)) continue;
    components++;
    const stack = [id];
    visited.add(id);
    while (stack.length) {
      const current = stack.pop();
      for (const next of neighbors.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }
  }
  return components;
}

export function getLayoutStats(tables, relationships, tableWidth) {
  const ids = new Set(tables.map((table) => table.id));
  const validRelationships = relationships.filter(
    (relationship) =>
      ids.has(relationship.startTableId) && ids.has(relationship.endTableId),
  );
  const degree = new Map(tables.map((table) => [table.id, 0]));
  for (const relationship of validRelationships) {
    degree.set(
      relationship.startTableId,
      (degree.get(relationship.startTableId) ?? 0) + 1,
    );
    degree.set(
      relationship.endTableId,
      (degree.get(relationship.endTableId) ?? 0) + 1,
    );
  }

  return {
    tables: tables.length,
    relationships: validRelationships.length,
    crossings: countRelationshipCrossings(tables, validRelationships, tableWidth),
    maxDepth: maxDepth(tables, validRelationships),
    components: connectedComponents(tables, validRelationships),
    isolatedTables: [...degree.values()].filter((value) => value === 0).length,
  };
}
