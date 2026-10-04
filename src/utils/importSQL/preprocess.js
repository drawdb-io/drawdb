const CHECK_KEYWORD_LENGTH = 5;

/**
 * Remove text casts from string literals in PostgreSQL CHECK expressions.
 *
 * `node-sql-parser` cannot parse the `::text` cast pgAdmin emits after a
 * regex pattern in a CHECK constraint. The cast does not change the pattern
 * consumed by the regex operator, so removing it lets the rest of the dump
 * import without discarding the constraint.
 */
export function stripPostgresTextCastsInChecks(src) {
  if (typeof src !== "string" || src === "") return src;

  let result = "";
  let index = 0;

  while (index < src.length) {
    if (src.startsWith("--", index)) {
      const end = src.indexOf("\n", index + 2);
      const stop = end === -1 ? src.length : end + 1;
      result += src.slice(index, stop);
      index = stop;
      continue;
    }

    if (src.startsWith("/*", index)) {
      const end = src.indexOf("*/", index + 2);
      const stop = end === -1 ? src.length : end + 2;
      result += src.slice(index, stop);
      index = stop;
      continue;
    }

    if (src[index] === "'" || src[index] === '"') {
      const stop = findStringEnd(src, index);
      result += src.slice(index, stop);
      index = stop;
      continue;
    }

    if (isCheckKeyword(src, index)) {
      result += src.slice(index, index + CHECK_KEYWORD_LENGTH);
      index += CHECK_KEYWORD_LENGTH;

      const expressionStart = skipWhitespace(src, index);
      if (src[expressionStart] === "(") {
        const expressionEnd = findMatchingParen(src, expressionStart);
        if (expressionStart < expressionEnd) {
          result += src.slice(index, expressionStart);
          result += stripTextCastsFromStringLiterals(
            src.slice(expressionStart, expressionEnd + 1),
          );
          index = expressionEnd + 1;
        }
      }
      continue;
    }

    result += src[index];
    index += 1;
  }

  return result;
}

function isCheckKeyword(src, index) {
  const before = src[index - 1];
  const after = src[index + CHECK_KEYWORD_LENGTH];
  const isBoundaryBefore = !before || /[\s(]/.test(before);
  const isBoundaryAfter = !after || /[\s(]/.test(after);

  return (
    isBoundaryBefore &&
    isBoundaryAfter &&
    src.slice(index, index + CHECK_KEYWORD_LENGTH).toLowerCase() === "check"
  );
}

function findStringEnd(src, start) {
  const quote = src[start];

  for (let index = start + 1; index < src.length; index += 1) {
    if (src[index] !== quote) continue;

    if (quote === "'" && src[index + 1] === "'") {
      index += 1;
    } else {
      return index + 1;
    }
  }

  return src.length;
}

function skipWhitespace(src, start) {
  let index = start;
  while (index < src.length && /\s/.test(src[index])) index += 1;
  return index;
}

function findMatchingParen(src, start) {
  let depth = 0;
  let index = start;

  while (index < src.length) {
    const quote = src[index];
    if (quote === "'" || quote === '"') {
      index = findStringEnd(src, index);
      continue;
    }

    if (src[index] === "(") depth += 1;
    if (src[index] === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
    index += 1;
  }

  return -1;
}

function stripTextCastsFromStringLiterals(expression) {
  let result = "";
  let index = 0;

  while (index < expression.length) {
    if (expression[index] !== "'") {
      result += expression[index];
      index += 1;
      continue;
    }

    const literalEnd = findStringEnd(expression, index);
    result += expression.slice(index, literalEnd);
    index = literalEnd;

    const cast = /^[ \t\r\n]*::[ \t\r\n]*text\b/i.exec(
      expression.slice(literalEnd),
    );
    if (cast) index += cast[0].length;
  }

  return result;
}
