import { nanoid } from "nanoid";
import { defaultBlue, tableWidth } from "../../data/constants";
import { arrangeTables } from "../arrangeTables";
import { isKeyword } from "../utils";
import { isInlineEnumType, typeTakesSize } from "./types";

const NEW_TABLE_GAP_X = 80;
const NEW_TABLE_GAP_Y = 240;

function sameList(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

function matchByName(parsedItems, baseItems, canRename) {
  const matched = new Map();
  const usedBase = new Set();

  const claim = (parsedIndex, baseIndex) => {
    matched.set(parsedIndex, baseItems[baseIndex]);
    usedBase.add(baseIndex);
  };

  const findFreeBase = (predicate) =>
    baseItems.findIndex((item, i) => !usedBase.has(i) && predicate(item));

  parsedItems.forEach((parsed, i) => {
    const exact = findFreeBase((item) => item.name === parsed.name);
    if (exact !== -1) claim(i, exact);
  });

  parsedItems.forEach((parsed, i) => {
    if (matched.has(i)) return;
    const name = String(parsed.name).toLowerCase();
    const insensitive = findFreeBase(
      (item) => String(item.name).toLowerCase() === name,
    );
    if (insensitive !== -1) claim(i, insensitive);
  });

  const unmatchedParsed = parsedItems
    .map((_, i) => i)
    .filter((i) => !matched.has(i));
  const unmatchedBase = baseItems
    .map((_, i) => i)
    .filter((i) => !usedBase.has(i));

  unmatchedParsed.forEach((parsedIndex, position) => {
    const baseIndex = unmatchedBase[position];
    if (baseIndex === undefined) return;
    if (!canRename(parsedItems[parsedIndex], baseItems[baseIndex])) return;
    claim(parsedIndex, baseIndex);
  });

  return matched;
}

function sharesFieldName(parsedTable, baseTable) {
  const baseNames = new Set((baseTable.fields ?? []).map((f) => f.name));
  return parsedTable.fields.some((field) => baseNames.has(field.name));
}

function resolveType(parsed, base) {
  if (isInlineEnumType(parsed.type) && isInlineEnumType(base.type)) {
    return base.type;
  }
  return parsed.type;
}

function resolveDefault(parsed, base) {
  const sameKeyword =
    isKeyword(base.default) &&
    String(base.default).toLowerCase() === String(parsed.default).toLowerCase();
  return sameKeyword ? base.default : parsed.default;
}

function resolveSize(parsed, base, type, database) {
  if (!typeTakesSize(type, database)) return base.size;
  if (parsed.size === "") return undefined;
  if (String(base.size) === String(parsed.size)) return base.size;
  return parsed.size;
}

function createField(parsed) {
  const field = {
    id: nanoid(),
    name: parsed.name,
    type: parsed.type,
    default: parsed.default,
    check: "",
    primary: parsed.primary,
    unique: parsed.unique,
    notNull: parsed.notNull,
    increment: parsed.increment,
    comment: parsed.comment,
  };

  if (parsed.size !== "") field.size = parsed.size;
  if (isInlineEnumType(parsed.type)) field.values = parsed.values ?? [];

  return field;
}

function mergeField(parsed, base, database) {
  const type = resolveType(parsed, base);
  const merged = {
    ...base,
    name: parsed.name,
    type,
    default: resolveDefault(parsed, base),
    primary: parsed.primary,
    unique: parsed.unique,
    notNull: parsed.notNull,
    increment: parsed.increment,
    comment: parsed.comment,
  };

  if (isInlineEnumType(type)) {
    merged.values = sameList(base.values, parsed.values)
      ? base.values
      : parsed.values ?? [];
  }

  const size = resolveSize(parsed, base, type, database);
  if (size === undefined) delete merged.size;
  else merged.size = size;

  return merged;
}

function reconcileFields(parsedFields, baseFields, database) {
  const matched = matchByName(parsedFields, baseFields, () => true);
  return parsedFields.map((parsed, i) => {
    const base = matched.get(i);
    return base ? mergeField(parsed, base, database) : createField(parsed);
  });
}

function mergeIndexEntry(parsed, base, position) {
  return {
    ...base,
    id: position,
    name: parsed.name,
    fields: sameList(base?.fields, parsed.fields) ? base.fields : parsed.fields,
  };
}

function reconcileIndexes(parsedIndexes, baseTable) {
  const baseIndices = baseTable.indices ?? [];
  const baseConstraints = baseTable.uniqueConstraints ?? [];
  const constraintNames = new Set(
    baseConstraints.filter((c) => c.name).map((c) => c.name),
  );

  const indices = [];
  const uniqueConstraints = [];

  for (const parsed of parsedIndexes) {
    if (parsed.unique && constraintNames.has(parsed.name)) {
      const base = baseConstraints.find((c) => c.name === parsed.name);
      uniqueConstraints.push(
        mergeIndexEntry(parsed, base, uniqueConstraints.length),
      );
    } else {
      const base =
        baseIndices.find((index) => index.name === parsed.name) ??
        baseIndices[indices.length];
      indices.push({
        ...mergeIndexEntry(parsed, base, indices.length),
        unique: parsed.unique,
      });
    }
  }

  return { indices, uniqueConstraints };
}

function mergeTable(parsed, base, database) {
  return {
    ...base,
    name: parsed.name,
    comment: parsed.comment,
    color: parsed.color ?? base.color,
    fields: reconcileFields(parsed.fields, base.fields ?? [], database),
    ...reconcileIndexes(parsed.indices, base),
  };
}

function createTable(parsed) {
  return {
    id: nanoid(),
    name: parsed.name,
    comment: parsed.comment,
    color: parsed.color ?? defaultBlue,
    fields: parsed.fields.map(createField),
    indices: parsed.indices.map((index, i) => ({
      id: i,
      name: index.name,
      fields: index.fields,
      unique: index.unique,
    })),
    uniqueConstraints: [],
    locked: false,
    collapsed: false,
  };
}

function placeNewTables(tables) {
  const unplaced = tables.filter((table) => table.x === undefined);
  if (!unplaced.length) return;

  const placed = tables.filter((table) => table.x !== undefined);
  if (!placed.length) {
    arrangeTables({ tables });
    return;
  }

  const x =
    Math.max(...placed.map((table) => table.x + tableWidth)) + NEW_TABLE_GAP_X;
  const y = Math.min(...placed.map((table) => table.y));

  unplaced.forEach((table, i) => {
    table.x = x;
    table.y = y + i * NEW_TABLE_GAP_Y;
  });
}

function keepFieldlessTables(tables, baseTables) {
  const present = new Set(tables.map((table) => table.id));
  baseTables.forEach((table, index) => {
    if ((table.fields ?? []).length > 0 || present.has(table.id)) return;
    tables.splice(Math.min(index, tables.length), 0, table);
  });
}

function reconcileEnums(parsedEnums, baseEnums) {
  const matched = matchByName(parsedEnums, baseEnums, () => true);
  return parsedEnums.map((parsed, i) => {
    const base = matched.get(i);
    return {
      ...base,
      id: base?.id ?? nanoid(),
      name: parsed.name,
      values: sameList(base?.values, parsed.values)
        ? base.values
        : parsed.values,
    };
  });
}

function endpointSignature(rel) {
  const pairs = rel.fields
    .map((pair) => `${pair.startFieldId}>${pair.endFieldId}`)
    .join(",");
  return `${rel.startTableId}|${rel.endTableId}|${pairs}`;
}

function resolveEndpoints(parsed, tables) {
  const startTable = tables.find(
    (table) => table.name === parsed.startTableName,
  );
  const endTable = tables.find((table) => table.name === parsed.endTableName);
  if (!startTable || !endTable) return null;

  const fields = [];
  for (let i = 0; i < parsed.startFieldNames.length; i++) {
    const startField = startTable.fields.find(
      (field) => field.name === parsed.startFieldNames[i],
    );
    const endField = endTable.fields.find(
      (field) => field.name === parsed.endFieldNames[i],
    );
    if (!startField || !endField) return null;
    fields.push({ startFieldId: startField.id, endFieldId: endField.id });
  }

  return { startTableId: startTable.id, endTableId: endTable.id, fields };
}

function reconcileRelationships(
  parsedRelationships,
  baseRelationships,
  tables,
) {
  const resolved = parsedRelationships
    .map((parsed) => {
      const endpoints = resolveEndpoints(parsed, tables);
      return endpoints ? { parsed, endpoints } : null;
    })
    .filter(Boolean);

  const available = baseRelationships.slice();
  const take = (predicate) => {
    const index = available.findIndex(predicate);
    if (index === -1) return null;
    return available.splice(index, 1)[0];
  };

  return resolved.map(({ parsed, endpoints }) => {
    const signature = endpointSignature({ ...endpoints });
    const base =
      take((rel) => rel.name === parsed.name) ??
      take(
        (rel) => endpointSignature(normalizeRelationship(rel)) === signature,
      );

    const fields = sameRelationshipFields(base?.fields, endpoints.fields)
      ? base.fields
      : endpoints.fields;

    return {
      ...base,
      id: base?.id ?? nanoid(),
      name: parsed.name,
      startTableId: endpoints.startTableId,
      endTableId: endpoints.endTableId,
      fields,
      startFieldId: fields[0].startFieldId,
      endFieldId: fields[0].endFieldId,
      cardinality: parsed.cardinality,
      updateConstraint: parsed.updateConstraint,
      deleteConstraint: parsed.deleteConstraint,
    };
  });
}

function normalizeRelationship(rel) {
  return {
    startTableId: rel.startTableId,
    endTableId: rel.endTableId,
    fields:
      Array.isArray(rel.fields) && rel.fields.length
        ? rel.fields
        : [{ startFieldId: rel.startFieldId, endFieldId: rel.endFieldId }],
  };
}

function sameRelationshipFields(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  return a.every(
    (pair, i) =>
      pair.startFieldId === b[i].startFieldId &&
      pair.endFieldId === b[i].endFieldId,
  );
}

export function reconcileDbml(parsed, base, database) {
  const baseTables = base?.tables ?? [];
  const matched = matchByName(parsed.tables, baseTables, sharesFieldName);

  const tables = parsed.tables.map((parsedTable, i) => {
    const baseTable = matched.get(i);
    return baseTable
      ? mergeTable(parsedTable, baseTable, database)
      : createTable(parsedTable);
  });

  placeNewTables(tables);
  keepFieldlessTables(tables, baseTables);

  return {
    tables,
    relationships: reconcileRelationships(
      parsed.relationships,
      base?.relationships ?? [],
      tables,
    ),
    enums: reconcileEnums(parsed.enums, base?.enums ?? []),
  };
}
