import { Parser } from "@dbml/core";
import { Cardinality, Constraint } from "../../data/constants";
import { inlineEnumTypeName } from "./types";

const parser = new Parser();

const CONSTRAINT_BY_KEYWORD = {
  "no action": Constraint.NONE,
  restrict: Constraint.RESTRICT,
  cascade: Constraint.CASCADE,
  "set null": Constraint.SET_NULL,
  "set default": Constraint.SET_DEFAULT,
};

const CARDINALITY_BY_RELATION = {
  "*:1": Cardinality.MANY_TO_ONE,
  "1:*": Cardinality.ONE_TO_MANY,
  "1:1": Cardinality.ONE_TO_ONE,
};

function baseTypeName(type) {
  const name = String(type?.type_name ?? "");
  if (type?.args == null) return name;

  const openingBracket = name.lastIndexOf("(");
  return openingBracket === -1 ? name : name.slice(0, openingBracket);
}

function fieldDefault(column) {
  const value = column.dbdefault?.value;
  return value === undefined || value === null ? "" : String(value);
}

function parseField(column) {
  return {
    name: column.name,
    type: baseTypeName(column.type).toUpperCase(),
    size: column.type?.args ?? "",
    default: fieldDefault(column),
    primary: !!column.pk,
    unique: !!column.unique,
    notNull: !!column.not_null,
    increment: !!column.increment,
    comment: column.note ?? "",
  };
}

function parseTable(table) {
  return {
    name: table.name,
    comment: table.note ?? "",
    color: table.headerColor ?? null,
    fields: table.fields.map(parseField),
    indices: table.indexes.map((index) => ({
      name: index.name ?? "",
      fields: index.columns.map((column) => column.value),
      unique: !!index.unique,
    })),
  };
}

function parseRef(ref) {
  const [start, end] = ref.endpoints;
  const cardinality =
    CARDINALITY_BY_RELATION[`${start.relation}:${end.relation}`];
  if (!cardinality) return null;

  return {
    name:
      ref.name ||
      `fk_${start.tableName}_${start.fieldNames[0]}_${end.tableName}`,
    startTableName: start.tableName,
    startFieldNames: [...start.fieldNames],
    endTableName: end.tableName,
    endFieldNames: [...end.fieldNames],
    cardinality,
    deleteConstraint: constraintFor(ref.onDelete),
    updateConstraint: constraintFor(ref.onUpdate),
  };
}

function constraintFor(keyword) {
  return (
    CONSTRAINT_BY_KEYWORD[String(keyword).toLowerCase()] ?? Constraint.NONE
  );
}

function foldInlineEnums(tables, enums) {
  const enumsByName = new Map(enums.map((en) => [en.name.toUpperCase(), en]));
  const folded = new Set();

  for (const table of tables) {
    for (const field of table.fields) {
      const candidate = enumsByName.get(field.type);
      if (!candidate) continue;

      const expected = inlineEnumTypeName({
        name: field.name,
        values: candidate.values,
      });
      if (expected.toUpperCase() !== field.type) continue;

      field.type = "ENUM";
      field.values = [...candidate.values];
      folded.add(candidate.name);
    }
  }

  return enums.filter((en) => !folded.has(en.name));
}

export function parseDbml(src) {
  const ast = parser.parse(src, "dbmlv2");

  const tables = [];
  const relationships = [];
  const enums = [];

  for (const schema of ast.schemas) {
    tables.push(...schema.tables.map(parseTable));
    relationships.push(...schema.refs.map(parseRef).filter(Boolean));
    enums.push(
      ...schema.enums.map((en) => ({
        name: en.name,
        values: en.values.map((value) => value.name),
      })),
    );
  }

  return {
    tables,
    relationships,
    enums: foldInlineEnums(tables, enums),
  };
}
