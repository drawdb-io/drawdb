import {
  DB,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
} from "../data/constants";
import {
  getCommentHeight,
  isFunction,
  isKeyword,
  strHasQuotes,
  getRelationshipFields,
} from "./utils";
import { dbToTypes } from "../data/datatypes";

export const JoinType = {
  INNER: "INNER",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  FULL: "FULL",
};

export const ConditionOperator = {
  EQ: "=",
  NEQ: "<>",
  GT: ">",
  GTE: ">=",
  LT: "<",
  LTE: "<=",
  LIKE: "LIKE",
  IN: "IN",
  IS_NULL: "IS NULL",
  IS_NOT_NULL: "IS NOT NULL",
};

const valuelessOperators = new Set([
  ConditionOperator.IS_NULL,
  ConditionOperator.IS_NOT_NULL,
]);

const quoteFor = {
  [DB.MYSQL]: (s) => `\`${s}\``,
  [DB.MARIADB]: (s) => `\`${s}\``,
  [DB.MSSQL]: (s) => `[${s}]`,
};

const identifierQuote = (database) =>
  quoteFor[database] ?? ((s) => `"${s}"`);

export function operatorTakesValue(operator) {
  return !valuelessOperators.has(operator);
}

export function viewTableIds(view) {
  return [
    view.baseTableId,
    ...(view.joins ?? []).map((j) => j.tableId),
  ].filter(Boolean);
}

export function viewScopeTables(view, tables = []) {
  const byId = new Map(tables.map((t) => [t.id, t]));
  return viewTableIds(view)
    .map((id) => byId.get(id))
    .filter(Boolean);
}

export function viewColumnOptions(view, tables = []) {
  return viewScopeTables(view, tables).flatMap((table) =>
    table.fields.map((field) => ({
      label: `${table.name}.${field.name}`,
      value: `${table.id}:${field.id}`,
      tableId: table.id,
      fieldId: field.id,
    })),
  );
}

function lookup(tables, tableId, fieldId) {
  const table = tables.find((t) => t.id === tableId);
  if (!table) return null;
  const field = table.fields.find((f) => f.id === fieldId);
  if (!field) return null;
  return { table, field };
}

export function resolveViewColumns(view, tables = []) {
  if (!view.baseTableId) return [];

  const selected = view.columns ?? [];
  if (selected.length === 0) {
    return viewScopeTables(view, tables).flatMap((table) =>
      table.fields.map((field) => ({
        id: `${table.id}:${field.id}`,
        name: field.name,
        type: field.type,
        size: field.size,
        source: `${table.name}.${field.name}`,
      })),
    );
  }

  return selected
    .map((column) => {
      const resolved = lookup(tables, column.tableId, column.fieldId);
      if (!resolved) return null;
      const { table, field } = resolved;
      return {
        id: column.id,
        name: column.alias?.trim() || field.name,
        type: field.type,
        size: field.size,
        source: `${table.name}.${field.name}`,
      };
    })
    .filter(Boolean);
}

export function suggestJoinCondition(view, tables, relationships, joinTableId) {
  const scope = new Set(viewTableIds(view));
  scope.delete(joinTableId);

  for (const relationship of relationships) {
    const pair = getRelationshipFields(relationship)[0];
    if (!pair) continue;

    const { startTableId, endTableId } = relationship;
    if (startTableId === joinTableId && scope.has(endTableId)) {
      return {
        leftTableId: endTableId,
        leftFieldId: pair.endFieldId,
        rightFieldId: pair.startFieldId,
      };
    }
    if (endTableId === joinTableId && scope.has(startTableId)) {
      return {
        leftTableId: startTableId,
        leftFieldId: pair.startFieldId,
        rightFieldId: pair.endFieldId,
      };
    }
  }

  return null;
}

function conditionValue(value, field, database) {
  const raw = String(value ?? "").trim();
  if (!raw) return "''";
  if (strHasQuotes(raw) || isKeyword(raw) || isFunction(raw)) return raw;
  if (raw.startsWith("(") && raw.endsWith(")")) return raw;
  if (!dbToTypes[database]?.[field?.type]?.hasQuotes) return raw;
  return `'${raw.replace(/'/g, "''")}'`;
}

export function buildViewSQL(view, tables = [], database = DB.GENERIC) {
  if (!view.baseTableId) return "";

  const quote = identifierQuote(database);
  const baseTable = tables.find((t) => t.id === view.baseTableId);
  if (!baseTable) return "";

  const qualify = (tableId, fieldId) => {
    const resolved = lookup(tables, tableId, fieldId);
    if (!resolved) return null;
    return `${quote(resolved.table.name)}.${quote(resolved.field.name)}`;
  };

  const selectList = (view.columns ?? [])
    .map((column) => {
      const qualified = qualify(column.tableId, column.fieldId);
      if (!qualified) return null;
      return column.alias?.trim()
        ? `${qualified} AS ${quote(column.alias.trim())}`
        : qualified;
    })
    .filter(Boolean);

  const lines = [
    selectList.length
      ? `SELECT\n${selectList.map((c) => `  ${c}`).join(",\n")}`
      : "SELECT *",
    `FROM ${quote(baseTable.name)}`,
  ];

  for (const join of view.joins ?? []) {
    const joinTable = tables.find((t) => t.id === join.tableId);
    if (!joinTable) continue;

    const left = join.on ? qualify(join.on.leftTableId, join.on.leftFieldId) : null;
    const right = join.on ? qualify(join.tableId, join.on.rightFieldId) : null;
    const onClause = left && right ? ` ON ${left} = ${right}` : "";
    lines.push(`${join.type} JOIN ${quote(joinTable.name)}${onClause}`);
  }

  const conditions = (view.conditions ?? [])
    .map((condition, index) => {
      const resolved = lookup(tables, condition.tableId, condition.fieldId);
      if (!resolved) return null;
      const qualified = `${quote(resolved.table.name)}.${quote(resolved.field.name)}`;
      const clause = operatorTakesValue(condition.operator)
        ? `${qualified} ${condition.operator} ${conditionValue(condition.value, resolved.field, database)}`
        : `${qualified} ${condition.operator}`;
      return index === 0 ? clause : `${condition.connector ?? "AND"} ${clause}`;
    })
    .filter(Boolean);

  if (conditions.length) {
    lines.push(`WHERE ${conditions.join("\n  ")}`);
  }

  return lines.join("\n");
}

const viewDialects = {
  [DB.MYSQL]: { orReplace: true },
  [DB.MARIADB]: { orReplace: true },
  [DB.POSTGRES]: { orReplace: true, materialized: true, commentOn: true },
  [DB.SQLITE]: { ifNotExists: true },
  [DB.MSSQL]: { orAlter: true, batchSeparator: "\nGO" },
  [DB.ORACLESQL]: { orReplace: true, materialized: true },
  [DB.GENERIC]: { orReplace: true },
};

function viewStatement(view, body, dialect, quote) {
  const materialized = view.materialized && dialect.materialized;
  const keyword = materialized ? "MATERIALIZED VIEW" : "VIEW";
  const prefix = materialized
    ? "CREATE"
    : dialect.orAlter
      ? "CREATE OR ALTER"
      : dialect.orReplace
        ? "CREATE OR REPLACE"
        : "CREATE";
  const existsClause =
    !materialized && dialect.ifNotExists ? " IF NOT EXISTS" : "";
  const name = quote(view.name);

  const statements = [];
  if (view.comment?.trim() && !dialect.commentOn) {
    statements.push(`/* ${view.comment} */`);
  }
  statements.push(`${prefix} ${keyword}${existsClause} ${name} AS\n${body};`);
  if (view.comment?.trim() && dialect.commentOn) {
    statements.push(
      `COMMENT ON ${keyword} ${name} IS '${view.comment.replace(/'/g, "''")}';`,
    );
  }

  return statements.join("\n") + (dialect.batchSeparator ?? "");
}

export function viewStatements(views, tables, database = DB.GENERIC) {
  const dialect = viewDialects[database] ?? viewDialects[DB.GENERIC];
  const quote = identifierQuote(database);

  return (views ?? [])
    .filter((v) => v.name?.trim())
    .map((view) => {
      const body = buildViewSQL(view, tables, database);
      return body ? viewStatement(view, body, dialect, quote) : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export function appendViews(sql, obj, database = obj?.database) {
  const views = viewStatements(obj?.views, obj?.tables ?? [], database);
  if (!views) return sql;

  return sql.trimEnd() ? `${sql.trimEnd()}\n\n${views}` : views;
}

export function getViewHeight(view, columns, width, showComments = true) {
  return (
    columns.length * (tableFieldHeight + 1) +
    tableHeaderHeight +
    tableColorStripHeight +
    getCommentHeight(view.comment, width, showComments)
  );
}
