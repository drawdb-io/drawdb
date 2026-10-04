import { DB } from "../../data/constants";

export function findReferencedTable(tables, currentTable, name) {
  return currentTable.name === name
    ? currentTable
    : tables.find((table) => table.name === name);
}

function quoteColumn(str, db) {
  switch (db) {
    case DB.MYSQL:
      return `\`${str}\``;
    case DB.SQLITE:
      return `"${str}"`;
    case DB.POSTGRES:
      return `"${str}"`;
    case DB.MSSQL:
      return `[${str}]`;
    case DB.MARIADB:
      return `\`${str}\``;
  }
}

export function buildSQLFromAST(ast, db = DB.MYSQL) {
  if (ast.type === "binary_expr") {
    const leftSQL = buildSQLFromAST(ast.left, db);
    const rightSQL = buildSQLFromAST(ast.right, db);
    return `${leftSQL} ${ast.operator} ${rightSQL}`;
  }

  if (ast.type === "function") {
    const name = Array.isArray(ast.name?.name)
      ? ast.name.name.map((part) => part.value).join(".")
      : ast.name;
    const args = Array.isArray(ast.args?.value)
      ? ast.args.value.map((arg) => buildSQLFromAST(arg, db)).join(", ")
      : "";
    return `${name}(${args})`;
  } else if (ast.type === "cast") {
    const type = (ast.target ?? []).map((target) => target.dataType).join(", ");
    return `${buildSQLFromAST(ast.expr, db)}::${type}`;
  } else if (ast.type === "column_ref") {
    return quoteColumn(ast.column, db);
  } else if (ast.type === "expr_list") {
    return ast.value.map((v) => v.value).join(" AND ");
  } else {
    return typeof ast.value === "string" ? "'" + ast.value + "'" : ast.value;
  }
}
