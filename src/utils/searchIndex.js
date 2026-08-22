export function buildTableSearchIndex(tables) {
  const entries = [];
  tables.forEach(({ id, name: tableName, fields }, tableIndex) => {
    entries.push({
      tableId: id,
      fieldIndex: null,
      label: tableName,
      normalizedLabel: tableName.toLocaleLowerCase(),
      key: `table-${tableIndex}`,
    });
    fields?.forEach(({ name: fieldName }, fieldIndex) => {
      const label = `${tableName}.${fieldName}`;
      entries.push({
        tableId: id,
        fieldIndex,
        label,
        normalizedLabel: label.toLocaleLowerCase(),
        key: `field-${tableIndex}-${fieldIndex}`,
      });
    });
  });
  return entries;
}

export function buildRelationshipSearchIndex(relationships) {
  return relationships.map((relationship) => ({
    id: relationship.id,
    startTableId: relationship.startTableId,
    label: relationship.name,
    normalizedLabel: relationship.name.toLocaleLowerCase(),
  }));
}
