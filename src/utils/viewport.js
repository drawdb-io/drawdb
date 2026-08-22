import { noteWidth } from "../data/constants.js";

export const DEFAULT_VIEWPORT_OVERSCAN = 320;

export function expandViewport(
  viewBox,
  zoom = 1,
  overscanPixels = DEFAULT_VIEWPORT_OVERSCAN,
) {
  const safeZoom = Math.max(zoom || 1, 0.02);
  const margin = overscanPixels / safeZoom;
  return {
    x: viewBox.left - margin,
    y: viewBox.top - margin,
    width: viewBox.width + margin * 2,
    height: viewBox.height + margin * 2,
  };
}

export function getNoteBounds(note) {
  return {
    x: note.x,
    y: note.y,
    width: note.width ?? noteWidth,
    height: note.height ?? 88,
  };
}

export function getAreaBounds(area) {
  return {
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
  };
}

export function buildRelationshipLookup(relationships) {
  const byId = new Map();
  const byTableId = new Map();
  const orderById = new Map();

  relationships.forEach((relationship, order) => {
    byId.set(relationship.id, relationship);
    orderById.set(relationship.id, order);

    for (const tableId of new Set([
      relationship.startTableId,
      relationship.endTableId,
    ])) {
      const connected = byTableId.get(tableId);
      if (connected) connected.push(relationship);
      else byTableId.set(tableId, [relationship]);
    }
  });

  return { byId, byTableId, orderById };
}

export function collectVisibleRelationshipIds({
  visibleTableIds,
  relationshipsByTableId,
  relationshipOrderById,
  forcedRelationshipIds = [],
}) {
  const visibleIds = new Set(forcedRelationshipIds);

  for (const tableId of visibleTableIds) {
    const connected = relationshipsByTableId.get(tableId) ?? [];
    for (const relationship of connected) visibleIds.add(relationship.id);
  }

  return [...visibleIds].sort(
    (left, right) =>
      (relationshipOrderById.get(left) ?? Number.MAX_SAFE_INTEGER) -
      (relationshipOrderById.get(right) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function getTableCenter(table, tableWidth) {
  return {
    x: table.x + tableWidth / 2,
    y: table.y,
  };
}
