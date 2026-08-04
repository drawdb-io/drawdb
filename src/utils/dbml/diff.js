const TABLE_KEYS = ["name", "comment", "color", "indices", "uniqueConstraints"];

const FIELD_KEYS = [
  "name",
  "type",
  "size",
  "default",
  "primary",
  "unique",
  "notNull",
  "increment",
  "comment",
  "values",
];

const RELATIONSHIP_KEYS = [
  "name",
  "startTableId",
  "endTableId",
  "startFieldId",
  "endFieldId",
  "fields",
  "cardinality",
  "updateConstraint",
  "deleteConstraint",
];

function isEqual(a, b) {
  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => isEqual(item, b[i]));
  }

  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => isEqual(a[key], b[key]))
    );
  }

  return false;
}

function changedValues(before, after, keys) {
  const values = {};
  for (const key of keys) {
    if (!isEqual(before[key], after[key])) values[key] = after[key];
  }
  return values;
}

function byId(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function diffFields(before, after) {
  const beforeFields = before.fields ?? [];
  const afterFields = after.fields ?? [];

  const sameShape =
    beforeFields.length === afterFields.length &&
    beforeFields.every((field, i) => field.id === afterFields[i].id);
  if (!sameShape) return { replaceFields: true, updates: [] };

  const updates = [];
  afterFields.forEach((field, i) => {
    const values = changedValues(beforeFields[i], field, FIELD_KEYS);
    if (Object.keys(values).length) {
      updates.push({
        target: "field",
        action: "update",
        tableId: after.id,
        fieldId: field.id,
        values,
      });
    }
  });

  return { replaceFields: false, updates };
}

function diffTables(before, after) {
  const beforeById = byId(before);
  const afterById = byId(after);

  const deletes = before
    .filter((table) => !afterById.has(table.id))
    .map((table) => ({ target: "table", action: "delete", id: table.id }));

  const creates = after
    .filter((table) => !beforeById.has(table.id))
    .map((table) => ({ target: "table", action: "create", table }));

  const updates = [];
  const fieldUpdates = [];

  for (const table of after) {
    const previous = beforeById.get(table.id);
    if (!previous) continue;

    const values = changedValues(previous, table, TABLE_KEYS);
    const fields = diffFields(previous, table);
    if (fields.replaceFields) values.fields = table.fields;
    else fieldUpdates.push(...fields.updates);

    if (Object.keys(values).length) {
      updates.push({ target: "table", action: "update", id: table.id, values });
    }
  }

  return { deletes, creates, updates, fieldUpdates };
}

function diffRelationships(before, after) {
  const beforeById = byId(before);
  const afterById = byId(after);

  const deletes = before
    .filter((rel) => !afterById.has(rel.id))
    .map((rel) => ({ target: "relationship", action: "delete", id: rel.id }));

  const creates = after
    .filter((rel) => !beforeById.has(rel.id))
    .map((rel) => ({
      target: "relationship",
      action: "create",
      relationship: rel,
    }));

  const updates = [];
  for (const rel of after) {
    const previous = beforeById.get(rel.id);
    if (!previous) continue;

    const values = changedValues(previous, rel, RELATIONSHIP_KEYS);
    if (Object.keys(values).length) {
      updates.push({
        target: "relationship",
        action: "update",
        id: rel.id,
        values,
      });
    }
  }

  return { deletes, creates, updates };
}

export function diffDiagram(from, to) {
  const enums = isEqual(from.enums ?? [], to.enums ?? [])
    ? []
    : [{ target: "enums", action: "update", enums: to.enums ?? [] }];

  const tables = diffTables(from.tables ?? [], to.tables ?? []);
  const relationships = diffRelationships(
    from.relationships ?? [],
    to.relationships ?? [],
  );

  return [
    ...enums,
    ...tables.deletes,
    ...tables.creates,
    ...tables.updates,
    ...tables.fieldUpdates,
    ...relationships.deletes,
    ...relationships.creates,
    ...relationships.updates,
  ];
}
