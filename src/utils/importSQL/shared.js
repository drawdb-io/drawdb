export function buildSQLFromAST(ast) {
  if (ast.type === "binary_expr") {
    const leftSQL = buildSQLFromAST(ast.left);
    const rightSQL = buildSQLFromAST(ast.right);
    return `${leftSQL} ${ast.operator} ${rightSQL}`;
  }

  if (ast.type === "function") {
    let expr = "";
    expr = ast.name;
    if (ast.args) {
      expr +=
        "(" +
        ast.args.value
          .map((v) => {
            if (v.type === "column_ref") return "`" + v.column + "`";
            if (
              v.type === "single_quote_string" ||
              v.type === "double_quote_string"
            )
              return "'" + v.value + "'";
            return v.value;
          })
          .join(", ") +
        ")";
    }
    return expr;
  } else if (ast.type === "column_ref") {
    return "`" + ast.column + "`";
  } else if (ast.type === "expr_list") {
    return ast.value.map((v) => v.value).join(" AND ");
  } else {
    return typeof ast.value === "string" ? "'" + ast.value + "'" : ast.value;
  }
}
