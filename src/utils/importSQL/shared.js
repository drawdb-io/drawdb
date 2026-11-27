import { DB } from "../../data/constants";

export function findReferencedTable(
  tables,
  currentTable,
  name,
  existingTables = [],
) {
  if (currentTable && currentTable.name === name) return currentTable;
  return (
    tables.find((table) => table.name === name) ??
    existingTables.find((table) => table.name === name)
  );
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

function getColumnName(column) {
  if (typeof column === "string") return column;
  return column?.expr?.value ?? "";
}

function getFunctionName(name) {
  if (typeof name === "string") return name;
  if (Array.isArray(name?.name)) {
    return name.name.map((n) => n.value).join(".");
  }
  return "";
}

export function buildSQLFromAST(ast, db = DB.MYSQL) {
  if (ast.type === "binary_expr") {
    const leftSQL = buildSQLFromAST(ast.left, db);
    const rightSQL = buildSQLFromAST(ast.right, db);
    return `${leftSQL} ${ast.operator} ${rightSQL}`;
  }

  if (ast.type === "function") {
    let expr = getFunctionName(ast.name);
    if (ast.args) {
      expr +=
        "(" +
        ast.args.value.map((v) => buildSQLFromAST(v, db)).join(", ") +
        ")";
    }
    return expr;
  } else if (ast.type === "column_ref") {
    return quoteColumn(getColumnName(ast.column), db);
  } else if (ast.type === "expr_list") {
    return ast.value.map((v) => v.value).join(" AND ");
  } else {
    return typeof ast.value === "string" ? "'" + ast.value + "'" : ast.value;
  }
}
