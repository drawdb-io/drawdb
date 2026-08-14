const IMPLICIT_REFERENCE_PREFIX = "__drawdb_implicit_reference__";

const isIdentifierStart = (char) => /[A-Za-z_\u0080-\uFFFF]/u.test(char);
const isIdentifierPart = (char) => /[A-Za-z0-9_$\u0080-\uFFFF]/u.test(char);
const isKeyword = (token, keyword) => token?.lower === keyword;

function skipQuoted(sql, start, quote, backslashEscapes = false) {
  let index = start + 1;
  while (index < sql.length) {
    if (sql[index] === quote) {
      if (sql[index + 1] === quote) {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index += backslashEscapes && sql[index] === "\\" ? 2 : 1;
  }
  return sql.length;
}

function skipBlockComment(sql, start) {
  let index = start + 2;
  let depth = 1;
  while (index < sql.length && depth > 0) {
    if (sql.startsWith("/*", index)) {
      depth += 1;
      index += 2;
    } else if (sql.startsWith("*/", index)) {
      depth -= 1;
      index += 2;
    } else {
      index += 1;
    }
  }
  return index;
}

function tokenize(sql) {
  const tokens = [];
  let index = 0;
  while (index < sql.length) {
    const char = sql[index];
    if (/\s/u.test(char)) {
      index += 1;
    } else if (sql.startsWith("--", index)) {
      const newline = sql.indexOf("\n", index + 2);
      index = newline === -1 ? sql.length : newline + 1;
    } else if (sql.startsWith("/*", index)) {
      index = skipBlockComment(sql, index);
    } else if ((char === "E" || char === "e") && sql[index + 1] === "'") {
      const end = skipQuoted(sql, index + 1, "'", true);
      tokens.push({ type: "literal", start: index, end });
      index = end;
    } else if (char === "'") {
      const end = skipQuoted(sql, index, char);
      tokens.push({ type: "literal", start: index, end });
      index = end;
    } else if (char === '"') {
      const end = skipQuoted(sql, index, char);
      tokens.push({ type: "identifier", start: index, end });
      index = end;
    } else if (char === "$") {
      const delimiter = sql
        .slice(index)
        .match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/u)?.[0];
      if (!delimiter) {
        tokens.push({ value: char, start: index, end: index + 1 });
        index += 1;
      } else {
        const end = sql.indexOf(delimiter, index + delimiter.length);
        const quoteEnd = end === -1 ? sql.length : end + delimiter.length;
        tokens.push({ type: "literal", start: index, end: quoteEnd });
        index = quoteEnd;
      }
    } else if (isIdentifierStart(char)) {
      const start = index;
      index += 1;
      while (index < sql.length && isIdentifierPart(sql[index])) index += 1;
      tokens.push({
        type: "identifier",
        lower: sql.slice(start, index).toLowerCase(),
        start,
        end: index,
      });
    } else {
      tokens.push({ value: char, start: index, end: index + 1 });
      index += 1;
    }
  }
  return tokens;
}

function statementStart(tokens, index) {
  while (index > 0 && tokens[index - 1].value !== ";") index -= 1;
  return index;
}

function createTableOpen(tokens, start) {
  if (!isKeyword(tokens[start], "create")) return -1;
  let index = start + 1;
  while (
    ["global", "local", "temp", "temporary", "unlogged"].some((keyword) =>
      isKeyword(tokens[index], keyword),
    )
  ) {
    index += 1;
  }
  if (!isKeyword(tokens[index], "table")) return -1;
  index += 1;
  if (isKeyword(tokens[index], "only")) return -1;
  if (isKeyword(tokens[index], "if")) {
    if (
      !isKeyword(tokens[index + 1], "not") ||
      !isKeyword(tokens[index + 2], "exists")
    ) {
      return -1;
    }
    index += 3;
  }
  if (tokens[index]?.type !== "identifier") return -1;
  index += 1;
  while (tokens[index]?.value === ".") index += 2;
  return tokens[index]?.value === "(" ? index : -1;
}

function isTableForeignKey(tokens, itemStart) {
  const start = isKeyword(tokens[itemStart], "constraint")
    ? itemStart + 2
    : itemStart;
  return (
    isKeyword(tokens[start], "foreign") && isKeyword(tokens[start + 1], "key")
  );
}

function createTableReference(tokens, referenceIndex) {
  const start = statementStart(tokens, referenceIndex);
  const tableOpen = createTableOpen(tokens, start);
  if (tableOpen === -1) return false;

  let depth = 0;
  let itemStart = tableOpen + 1;
  for (let index = tableOpen; index < referenceIndex; index += 1) {
    if (tokens[index].value === "(") depth += 1;
    else if (tokens[index].value === ")") depth -= 1;
    else if (tokens[index].value === "," && depth === 1) {
      itemStart = index + 1;
    }
  }
  if (depth !== 1 || referenceIndex === itemStart) return false;
  if (isKeyword(tokens[referenceIndex - 1], "constraint")) return false;
  if (isTableForeignKey(tokens, itemStart)) return true;
  if (
    ["constraint", "check", "exclude", "foreign", "primary", "unique"].some(
      (keyword) => isKeyword(tokens[itemStart], keyword),
    )
  ) {
    return false;
  }
  return (
    tokens[itemStart]?.type === "identifier" &&
    referenceIndex > itemStart + 1 &&
    !isKeyword(tokens[referenceIndex - 1], "default")
  );
}

function isImplicitReferenceCandidate(tokens, index) {
  const target = index + 1;
  const targetKeywords = [
    "check",
    "collate",
    "compression",
    "constraint",
    "default",
    "deferrable",
    "generated",
    "initially",
    "match",
    "not",
    "null",
    "on",
    "primary",
    "unique",
  ];
  const trailerKeywords = ["match", "on", "deferrable", "initially"];
  const afterTarget = tokens[target + 1];
  return (
    isKeyword(tokens[index], "references") &&
    tokens[target]?.type === "identifier" &&
    !isKeyword(tokens[target], "only") &&
    !targetKeywords.some((keyword) => isKeyword(tokens[target], keyword)) &&
    (afterTarget == null ||
      [",", ")", ";"].includes(afterTarget.value) ||
      trailerKeywords.some((keyword) => isKeyword(afterTarget, keyword)) ||
      (isKeyword(afterTarget, "not") &&
        isKeyword(tokens[target + 2], "deferrable")))
  );
}

function hasLaterCandidate(tokens, referenceIndex) {
  let depth = 1;
  for (let index = referenceIndex + 2; index < tokens.length; index += 1) {
    if (tokens[index].value === "(") depth += 1;
    else if (tokens[index].value === ")") depth -= 1;
    else if (tokens[index].value === "," && depth === 1) break;
    if (depth === 0) break;
    if (depth === 1 && isKeyword(tokens[index], "references")) return true;
  }
  return false;
}

function implicitReferenceInsertions(sql) {
  const tokens = tokenize(sql);
  const insertions = [];
  for (let index = 0; index < tokens.length; index += 1) {
    if (
      !isImplicitReferenceCandidate(tokens, index) ||
      !createTableReference(tokens, index) ||
      hasLaterCandidate(tokens, index)
    ) {
      continue;
    }

    const target = index + 1;
    insertions.push(tokens[target].end);
    index = target;
  }
  return insertions;
}

function unusedMarker(sql) {
  let suffix = 0;
  let marker = IMPLICIT_REFERENCE_PREFIX;
  while (sql.toLowerCase().includes(marker.toLowerCase())) {
    marker = `${IMPLICIT_REFERENCE_PREFIX}${++suffix}`;
  }
  return marker;
}

export function preparePostgresSQL(sql) {
  const insertions = implicitReferenceInsertions(sql);
  if (insertions.length === 0) return { sql, marker: null };

  const marker = unusedMarker(sql);
  let prepared = sql;
  for (let index = insertions.length - 1; index >= 0; index -= 1) {
    const position = insertions[index];
    prepared = `${prepared.slice(0, position)} ("${marker}")${prepared.slice(position)}`;
  }
  return { sql: prepared, marker };
}

const columnName = (definition) => definition?.column?.expr?.value;

export function markImplicitPostgresReferences(ast, marker) {
  if (!marker) return ast;
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const reference = value.reference_definition;
    if (
      reference?.definition?.length === 1 &&
      columnName(reference.definition[0]) === marker
    ) {
      reference.implicitPrimaryKey = true;
    }
    Object.values(value).forEach(visit);
  };
  visit(ast);
  return ast;
}

export function parsePostgresSQL(parser, sql, database) {
  try {
    return parser.astify(sql, { database });
  } catch (error) {
    const prepared = preparePostgresSQL(sql);
    if (!prepared.marker) throw error;
    try {
      const ast = parser.astify(prepared.sql, { database });
      return markImplicitPostgresReferences(ast, prepared.marker);
    } catch {
      throw error;
    }
  }
}

export function postgresReferenceFieldNames(
  reference,
  referencedTable,
  expectedCount,
  primaryFieldNames = null,
) {
  if (!reference?.implicitPrimaryKey) {
    return reference?.definition?.map(columnName) ?? [];
  }
  const names =
    primaryFieldNames ??
    referencedTable.fields
      .filter((field) => field.primary)
      .map((field) => field.name);
  return names.length === expectedCount ? names : [];
}
