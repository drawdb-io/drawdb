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

// node-sql-parser reports identifiers either as a plain string or, for the
// dialects that support quoted/qualified names, as `{ expr: { value } }`.
function columnName(column) {
  if (typeof column === "string") return column;
  return column?.expr?.value ?? column?.value ?? "";
}

// Function names arrive as `{ name: [{ value: "LENGTH" }, ...] }`.
function functionName(name) {
  if (typeof name === "string") return name;
  const parts = name?.name;
  if (Array.isArray(parts)) return parts.map((p) => p?.value ?? "").join(".");
  return name?.value ?? "";
}

function stringLiteral(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

export function buildSQLFromAST(ast, db = DB.MYSQL) {
  if (ast.type === "binary_expr") {
    const leftSQL = buildSQLFromAST(ast.left, db);
    const rightSQL = buildSQLFromAST(ast.right, db);
    return `${leftSQL} ${ast.operator} ${rightSQL}`;
  }

  if (ast.type === "function") {
    let expr = functionName(ast.name);
    if (ast.args) {
      expr +=
        "(" +
        ast.args.value
          .map((v) => {
            if (v.type === "column_ref")
              return quoteColumn(columnName(v.column), db);
            if (
              v.type === "single_quote_string" ||
              v.type === "double_quote_string"
            )
              return stringLiteral(v.value);
            return v.value;
          })
          .join(", ") +
        ")";
    }
    return expr;
  } else if (ast.type === "column_ref") {
    return quoteColumn(columnName(ast.column), db);
  } else if (ast.type === "expr_list") {
    return ast.value.map((v) => v.value).join(" AND ");
  } else {
    return typeof ast.value === "string" ? stringLiteral(ast.value) : ast.value;
  }
}
