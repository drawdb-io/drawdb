export function findCircularTableIds(tables, relationships) {
  const outgoing = new Map();
  for (const relationship of relationships) {
    if (relationship.startTableId === relationship.endTableId) continue;
    const targets = outgoing.get(relationship.startTableId);
    if (targets) targets.push(relationship.endTableId);
    else outgoing.set(relationship.startTableId, [relationship.endTableId]);
  }

  const visiting = new Set();
  const visited = new Set();
  const circular = new Set();

  const visit = (tableId) => {
    if (visiting.has(tableId)) {
      circular.add(tableId);
      return;
    }
    if (visited.has(tableId)) return;

    visiting.add(tableId);
    for (const targetId of outgoing.get(tableId) ?? []) visit(targetId);
    visiting.delete(tableId);
    visited.add(tableId);
  };

  for (const table of tables) visit(table.id);
  return circular;
}
