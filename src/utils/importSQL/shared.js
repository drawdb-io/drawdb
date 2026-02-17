import { DB } from "../../data/constants";

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

const opMap = {
  Plus: "+",
  Minus: "-",
  Multiply: "*",
  Divide: "/",
  Modulo: "%",
  Gt: ">",
  Lt: "<",
  GtEq: ">=",
  LtEq: "<=",
  Eq: "=",
  NotEq: "!=",
  And: "AND",
  Or: "OR",
};

export function buildSQLFromAST(expr, db = DB.MYSQL) {
  if (!expr) return "";

  if (expr.BinaryOp) {
    const left = buildSQLFromAST(expr.BinaryOp.left, db);
    const right = buildSQLFromAST(expr.BinaryOp.right, db);
    const op = opMap[expr.BinaryOp.op] || expr.BinaryOp.op;
    return `${left} ${op} ${right}`;
  }

  if (expr.UnaryOp) {
    const operand = buildSQLFromAST(expr.UnaryOp.expr, db);
    if (expr.UnaryOp.op === "Not") return `NOT ${operand}`;
    if (expr.UnaryOp.op === "Minus") return `-${operand}`;
    if (expr.UnaryOp.op === "Plus") return `+${operand}`;
    return operand;
  }

  if (expr.Nested) {
    return `(${buildSQLFromAST(expr.Nested, db)})`;
  }

  if (expr.Identifier) {
    return quoteColumn(expr.Identifier.value, db);
  }

  if (expr.CompoundIdentifier) {
    return expr.CompoundIdentifier.map((i) => quoteColumn(i.value, db)).join(
      ".",
    );
  }

  if (expr.Function) {
    const name = expr.Function.name
      .map((n) => n.Identifier?.value || n.value || "")
      .join(".");
    if (expr.Function.args === "None" || !expr.Function.args) {
      return name;
    }
    const args = Array.isArray(expr.Function.args)
      ? expr.Function.args
      : expr.Function.args.Unnamed
        ? [expr.Function.args]
        : [];
    const argStrs = args
      .map((a) => {
        const argExpr = a.Unnamed?.Expr || a.Unnamed || a;
        return buildSQLFromAST(argExpr, db);
      })
      .filter(Boolean);
    return argStrs.length > 0 ? `${name}(${argStrs.join(", ")})` : name;
  }

  if (expr.Value) {
    const val = expr.Value.value ?? expr.Value;
    if (val === "Null") return "NULL";
    if (val.SingleQuotedString !== undefined) return `'${val.SingleQuotedString}'`;
    if (val.DoubleQuotedString !== undefined) return `'${val.DoubleQuotedString}'`;
    if (val.Number) return val.Number[0];
    if (val.Boolean !== undefined) return val.Boolean.toString().toUpperCase();
    if (typeof val === "string") return val;
    if (typeof val === "number") return val.toString();
    return JSON.stringify(val);
  }

  if (expr.IsNull) return `${buildSQLFromAST(expr.IsNull, db)} IS NULL`;
  if (expr.IsNotNull)
    return `${buildSQLFromAST(expr.IsNotNull, db)} IS NOT NULL`;

  if (expr.InList) {
    const e = buildSQLFromAST(expr.InList.expr, db);
    const list = expr.InList.list.map((v) => buildSQLFromAST(v, db)).join(", ");
    return `${e}${expr.InList.negated ? " NOT" : ""} IN (${list})`;
  }

  if (expr.Between) {
    const e = buildSQLFromAST(expr.Between.expr, db);
    const low = buildSQLFromAST(expr.Between.low, db);
    const high = buildSQLFromAST(expr.Between.high, db);
    return `${e}${expr.Between.negated ? " NOT" : ""} BETWEEN ${low} AND ${high}`;
  }

  if (expr.Cast) {
    return `CAST(${buildSQLFromAST(expr.Cast.expr, db)} AS ${getTypeName(expr.Cast.dataType)})`;
  }

  if (expr.Array) {
    const elems = expr.Array.elem.map((e) => buildSQLFromAST(e, db)).join(", ");
    return `ARRAY[${elems}]`;
  }

  if (typeof expr === "string") return expr;

  return "";
}

export function getTypeName(dataType) {
  if (typeof dataType === "string") return dataType.toUpperCase();
  const key = Object.keys(dataType)[0];
  return key ? key.toUpperCase() : "TEXT";
}

export function getTypeSize(dataType) {
  if (typeof dataType === "string") return null;
  const key = Object.keys(dataType)[0];
  const val = dataType[key];
  if (!val || typeof val !== "object") return null;
  if (val.IntegerLength) {
    return { length: val.IntegerLength.length };
  }
  if (val.PrecisionAndScale) {
    return {
      length: val.PrecisionAndScale[0],
      scale: val.PrecisionAndScale[1],
    };
  }
  return null;
}

export function getTableName(objectName) {
  const last = objectName[objectName.length - 1];
  return last?.Identifier?.value || last?.value || "";
}

export function getIndexColumnName(col) {
  const expr = col.column?.expr || col.expr;
  if (!expr) return "";
  return expr.Identifier?.value || expr.value || "";
}

export function mapReferentialAction(action) {
  const map = {
    Cascade: "Cascade",
    SetNull: "Set null",
    SetDefault: "Set default",
    NoAction: "No action",
    Restrict: "Restrict",
  };
  return map[action] || "No action";
}

export function extractDefaultValue(expr) {
  if (!expr) return "";

  if (expr.Value) {
    const val = expr.Value.value ?? expr.Value;
    if (val === "Null") return "NULL";
    if (val.SingleQuotedString !== undefined) return val.SingleQuotedString;
    if (val.DoubleQuotedString !== undefined) return val.DoubleQuotedString;
    if (val.Number) return val.Number[0];
    if (val.Boolean !== undefined) return val.Boolean.toString().toUpperCase();
    return val.toString();
  }

  if (expr.Function) {
    const name = expr.Function.name
      .map((n) => n.Identifier?.value || n.value || "")
      .join(".");
    if (expr.Function.args === "None" || !expr.Function.args) {
      return name;
    }
    const args = Array.isArray(expr.Function.args) ? expr.Function.args : [];
    const argStrs = args
      .map((a) => {
        const argExpr = a.Unnamed?.Expr || a.Unnamed || a;
        return extractDefaultValue(argExpr);
      })
      .filter(Boolean);
    return argStrs.length > 0 ? `${name}(${argStrs.join(", ")})` : name;
  }

  if (expr.Cast) {
    return extractDefaultValue(expr.Cast.expr);
  }

  if (expr.UnaryOp) {
    const operand = extractDefaultValue(expr.UnaryOp.expr);
    if (expr.UnaryOp.op === "Minus") return `-${operand}`;
    return operand;
  }

  if (expr.Array) {
    const elems = expr.Array.elem
      .map((e) => extractDefaultValue(e))
      .join(", ");
    return `ARRAY[${elems}]`;
  }

  if (expr.Identifier) {
    return expr.Identifier.value;
  }

  if (typeof expr === "string") return expr;

  return "";
}

export function getCustomTypeArgs(dataType) {
  if (typeof dataType !== "object") return null;
  if (!dataType.Custom) return null;
  const [, args] = dataType.Custom;
  return args;
}
