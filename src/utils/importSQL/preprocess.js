/**
 * Strip the parts of a `pg_dump` file that carry no table structure and that
 * `node-sql-parser` cannot parse, so a real dump imports as a diagram.
 *
 * Three constructs in an ordinary dump each abort the whole import:
 *
 * - `COPY ... FROM stdin;` followed by raw tab-separated rows and a lone
 *   `DOT` terminator. Emitted once per table unless the dump was taken with
 *   `--schema-only`, and the rows are not SQL at all.
 * - `ALTER TABLE ... ADD GENERATED ... AS IDENTITY (...)`, which pg_dump
 *   emits for every identity column and which spans several lines.
 * - `CREATE FUNCTION` / `CREATE PROCEDURE` bodies wrapped in dollar quotes
 *   (`$$ ... $$`), whose contents are not parsed as SQL.
 *
 * None of the three describes a table, a column or a relationship, so the
 * diagram loses nothing by dropping them — while every `CREATE TABLE` and
 * `ALTER TABLE ... ADD CONSTRAINT` in the same file becomes importable.
 *
 * The scan is dollar-quote aware, so a `COPY` line that is really text inside
 * a routine body is not mistaken for a data block.
 *
 * Refs #852.
 */
const COPY_TERMINATOR = String.fromCharCode(92) + ".";

export function stripPostgresDumpArtifacts(src) {
  if (typeof src !== "string" || src === "") return src;

  const kept = [];
  // Non-null while inside a `$tag$ ... $tag$` block we are keeping.
  let dollarTag = null;
  // Non-null while inside the dollar-quoted body of a routine we are dropping.
  let routineTag = null;
  // True while consuming the rows that follow a `COPY ... FROM stdin;`.
  let inCopyData = false;
  // True while discarding the remaining lines of a multi-line dropped statement.
  let skipping = false;

  for (const line of src.split("\n")) {
    if (inCopyData) {
      if (line.trim() === COPY_TERMINATOR) inCopyData = false;
      continue;
    }

    if (skipping) {
      if (routineTag) {
        if (line.includes(routineTag)) routineTag = null;
        else continue;
      }
      if (!routineTag && endsStatement(line)) skipping = false;
      continue;
    }

    if (dollarTag) {
      kept.push(line);
      if (line.includes(dollarTag)) dollarTag = null;
      continue;
    }

    if (/^\s*COPY\s.*\bFROM\s+stdin\s*;\s*$/i.test(line)) {
      inCopyData = true;
      continue;
    }

    if (isDroppedStatementStart(line)) {
      routineTag = findDollarQuoteOpen(line);
      skipping = !!routineTag || !endsStatement(line);
      continue;
    }

    const openedTag = findDollarQuoteOpen(line);
    if (openedTag) {
      kept.push(line);
      dollarTag = openedTag;
      continue;
    }

    kept.push(line);
  }

  return kept.join("\n");
}

/** True when *line* opens a statement the diagram has no use for. */
function isDroppedStatementStart(line) {
  return (
    /^\s*ALTER\s+TABLE\b.*\bADD\s+GENERATED\b/i.test(line) ||
    /^\s*CREATE\s+(OR\s+REPLACE\s+)?(FUNCTION|PROCEDURE)\b/i.test(line)
  );
}

/**
 * Return the dollar-quote tag opened by *line* and not closed on it, or null.
 *
 * `$$`, `$body$` and `$fn$` all open a block in which `;` and `COPY` are
 * ordinary text. A tag that opens and closes on the same line (a one-line
 * routine body) opens nothing.
 */
function findDollarQuoteOpen(line) {
  const tags = line.match(/\$[A-Za-z_][A-Za-z0-9_]*\$|\$\$/g);
  if (!tags) return null;

  const counts = new Map();
  for (const tag of tags) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  for (const [tag, count] of counts) {
    if (count % 2 === 1) return tag;
  }
  return null;
}

/** True when *line* closes a statement, i.e. carries its trailing `;`. */
function endsStatement(line) {
  return /;\s*$/.test(line.trim());
}
