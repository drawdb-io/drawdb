function splitPostgresStatements(sql) {
  const statements = [];
  let start = 0;
  let quote = null; // { marker, escapeBackslash }
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
      continue;
    }

    if (dollarTag) {
      if (sql.startsWith(dollarTag, index)) {
        index += dollarTag.length;
        dollarTag = null;
      } else {
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (char === "\\" && quote.escapeBackslash) {
        index += 2;
      } else if (char === quote.marker) {
        if (sql[index + 1] === quote.marker) {
          index += 2;
        } else {
          quote = null;
          index += 1;
        }
      } else {
        index += 1;
      }
      continue;
    }

    if ((char === "e" || char === "E") && sql[index + 1] === "'") {
      quote = { marker: "'", escapeBackslash: true };
      index += 2;
    } else if (char === "'" || char === '"' || char === "`") {
      quote = { marker: char, escapeBackslash: false };
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
      if (closingTag !== -1) {
        const candidate = sql.slice(index, closingTag + 1);
        if (/^\$[A-Za-z0-9_]*\$/.test(candidate)) {
          dollarTag = candidate;
          index += dollarTag.length;
        } else {
          index += 1;
        }
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

  if (start < sql.length) {
    statements.push(sql.slice(start));
  }
  return statements;
}

function statementKeywords(statement) {
  const keywords = [];
  let index = 0;

  while (index < statement.length && keywords.length < 6) {
    while (index < statement.length && /\s/.test(statement[index])) {
      index += 1;
    }

    if (statement.startsWith("--", index)) {
      const newlineIndex = statement.slice(index).search(/\r?\n/);
      if (newlineIndex === -1) break;
      index += newlineIndex + 1;
      continue;
    }

    if (statement.startsWith("/*", index)) {
      let depth = 1;
      index += 2;
      while (index < statement.length && depth > 0) {
        if (statement.startsWith("/*", index)) {
          depth += 1;
          index += 2;
        } else if (statement.startsWith("*/", index)) {
          depth -= 1;
          index += 2;
        } else {
          index += 1;
        }
      }
      if (depth > 0) break;
      continue;
    }

    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(statement.slice(index));
    if (!match) break;
    keywords.push(match[0].toUpperCase());
    index += match[0].length;
  }

  return keywords;
}

function isUnsupportedViewStatement(statement) {
  const keywords = statementKeywords(statement);
  if (keywords[0] !== "CREATE") return false;

  let index = 1;
  if (keywords[index] === "OR" && keywords[index + 1] === "REPLACE") {
    index += 2;
  }
  if (keywords[index] === "GLOBAL" || keywords[index] === "LOCAL") {
    index += 1;
  }
  if (keywords[index] === "TEMP" || keywords[index] === "TEMPORARY") {
    index += 1;
  }
  if (keywords[index] === "MATERIALIZED") {
    index += 1;
  }
  return keywords[index] === "VIEW";
}

export function removeUnsupportedPostgresViews(sql) {
  return splitPostgresStatements(sql)
    .filter((statement) => !isUnsupportedViewStatement(statement))
    .join("\n");
}
