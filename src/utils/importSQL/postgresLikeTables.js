const IDENTIFIER =
  '(?:"(?:[^"]|"")+"|[\\p{L}_][\\p{L}\\p{N}_$]*)(?:\\s*\\.\\s*(?:"(?:[^"]|"")+"|[\\p{L}_][\\p{L}\\p{N}_$]*))*';
const CREATE_TABLE_PREFIX = new RegExp(
  `^\\s*CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${IDENTIFIER})\\s*\\(`,
  "iu",
);
const LIKE_PREFIX = new RegExp(`^\\s*LIKE\\s+(${IDENTIFIER})`, "iu");
const LIKE_OPTION =
  /^\s*(?:INCLUDING|EXCLUDING)\s+(?:ALL|DEFAULTS|CONSTRAINTS|INDEXES|STORAGE|COMMENTS|GENERATED|IDENTITY|STATISTICS)(?:\s*,\s*(?:INCLUDING|EXCLUDING)\s+(?:ALL|DEFAULTS|CONSTRAINTS|INDEXES|STORAGE|COMMENTS|GENERATED|IDENTITY|STATISTICS))*\s*/i;

function splitPostgresStatements(sql) {
  const statements = [];
  let start = 0;
  let quote = null;
  let dollarTag = null;
  let blockCommentDepth = 0;
  let index = 0;

  while (index < sql.length) {
    const char = sql[index];

    if (blockCommentDepth > 0) {
      if (sql.startsWith("/*", index)) {
        blockCommentDepth += 1;
        index += 2;
      } else if (sql.startsWith("*/", index)) {
        blockCommentDepth -= 1;
        index += 2;
      } else {
        index += 1;
      }
    } else if (dollarTag) {
      if (sql.startsWith(dollarTag, index)) {
        index += dollarTag.length;
        dollarTag = null;
      } else {
        index += 1;
      }
    } else if (quote) {
      if (char === quote) {
        if (sql[index + 1] === quote) index += 2;
        else {
          quote = null;
          index += 1;
        }
      } else {
        index += 1;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
      index += 1;
    } else if (char === "-" && sql[index + 1] === "-") {
      index += 2;
      while (index < sql.length && sql[index] !== "\n" && sql[index] !== "\r") {
        index += 1;
      }
    } else if (char === "/" && sql[index + 1] === "*") {
      blockCommentDepth = 1;
      index += 2;
    } else if (char === "$") {
      const closingTag = sql.indexOf("$", index + 1);
      const candidate =
        closingTag === -1 ? "" : sql.slice(index, closingTag + 1);
      if (/^\$[A-Za-z0-9_]*\$/.test(candidate)) {
        dollarTag = candidate;
        index += candidate.length;
      } else {
        index += 1;
      }
    } else if (char === ";") {
      statements.push(sql.slice(start, index + 1));
      start = index + 1;
      index += 1;
    } else {
      index += 1;
    }
  }

  if (start < sql.length) statements.push(sql.slice(start));
  return statements;
}

function identifierParts(identifier) {
  const partPattern = /"(?:[^"]|"")+"|[\p{L}_][\p{L}\p{N}_$]*/gu;
  const parts = [];
  let match;
  while ((match = partPattern.exec(identifier)) !== null) {
    const part = match[0];
    parts.push(
      part.startsWith('"')
        ? part.slice(1, -1).replace(/""/g, '"')
        : part.toLowerCase(),
    );
  }
  return parts;
}

function canonicalIdentifier(identifier) {
  return identifierParts(identifier).join(".");
}

function findCreateTableClose(statement, openIndex) {
  let depth = 0;
  let quote = null;
  let dollarTag = null;
  let index = openIndex;

  while (index < statement.length) {
    const char = statement[index];

    if (quote) {
      if (char === quote) {
        if (statement[index + 1] === quote) index += 2;
        else {
          quote = null;
          index += 1;
        }
      } else {
        index += 1;
      }
    } else if (dollarTag) {
      if (statement.startsWith(dollarTag, index)) {
        index += dollarTag.length;
        dollarTag = null;
      } else {
        index += 1;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
      index += 1;
    } else if (char === "-" && statement[index + 1] === "-") {
      index += 2;
      while (index < statement.length && statement[index] !== "\n") {
        index += 1;
      }
    } else if (char === "/" && statement[index + 1] === "*") {
      const endIndex = statement.indexOf("*/", index + 2);
      if (endIndex === -1) return null;
      index = endIndex + 2;
    } else if (char === "$") {
      const closingTag = statement.indexOf("$", index + 1);
      const candidate =
        closingTag === -1 ? "" : statement.slice(index, closingTag + 1);
      if (/^\$[A-Za-z0-9_]*\$/.test(candidate)) {
        dollarTag = candidate;
        index += candidate.length;
      } else {
        index += 1;
      }
    } else if (char === "(") {
      depth += 1;
      index += 1;
    } else if (char === ")") {
      depth -= 1;
      index += 1;
      if (depth === 0) return index - 1;
    } else {
      index += 1;
    }
  }
  return null;
}

function resolveTableBody(tableBodies, source) {
  const sourceParts = identifierParts(source);
  const directKey = sourceParts.join(".");
  if (tableBodies.has(directKey)) return tableBodies.get(directKey);

  for (const [key, body] of tableBodies) {
    const keyParts = key.split(".");
    if (keyParts.length > sourceParts.length) {
      const suffix = keyParts.slice(keyParts.length - sourceParts.length);
      if (suffix.join(".") === directKey) return body;
    }
  }
  return null;
}

function createTableParts(statement) {
  const match = CREATE_TABLE_PREFIX.exec(statement);
  if (!match) return null;

  const openIndex = match.index + match[0].lastIndexOf("(");
  const closeIndex = findCreateTableClose(statement, openIndex);
  if (closeIndex <= openIndex) return null;

  return {
    target: match[1],
    prefix: statement.slice(0, openIndex + 1),
    body: statement.slice(openIndex + 1, closeIndex),
    suffix: statement.slice(closeIndex),
  };
}

function withoutLikeClause(body, tableBodies) {
  const match = LIKE_PREFIX.exec(body);
  if (!match) return null;

  const sourceBody = resolveTableBody(tableBodies, match[1]);
  if (sourceBody === null) return null;

  let remainder = body.slice(match.index + match[0].length);
  let options;
  while ((options = LIKE_OPTION.exec(remainder)) !== null) {
    remainder = remainder.slice(options[0].length);
  }

  remainder = remainder.trimStart();
  if (remainder.startsWith(",")) {
    remainder = remainder.slice(1).trimStart();
  } else if (remainder.length > 0) {
    return null;
  }

  return [sourceBody.trim(), remainder.trim()].filter(Boolean).join(", ");
}

export function expandPostgresCreateTableLike(sql) {
  const statements = splitPostgresStatements(sql);
  const tableBodies = new Map();
  const expanded = [];

  for (const statement of statements) {
    const parts = createTableParts(statement);
    if (!parts) {
      expanded.push(statement);
      continue;
    }

    const expandedBody = withoutLikeClause(parts.body, tableBodies);
    const nextStatement = expandedBody
      ? `${parts.prefix}${expandedBody}${parts.suffix}`
      : statement;
    const nextParts = createTableParts(nextStatement);
    if (nextParts) {
      tableBodies.set(canonicalIdentifier(nextParts.target), nextParts.body);
    }
    expanded.push(nextStatement);
  }

  return expanded.join("\n");
}
