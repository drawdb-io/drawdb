export function removeTableRelationships(relationships, tableId) {
  return relationships.filter(
    (rel) => rel.startTableId !== tableId && rel.endTableId !== tableId,
  );
}

