// Preprocessor for SQLite / Cloudflare D1 schema dumps.
//
// Some export tools (e.g. gen_export_sql.py) emit column comments as trailing
// "-- comment" text and place the column separator comma INSIDE that comment,
// e.g.:
//
//   id TEXT PRIMARY KEY   -- 记录 id,
//   period TEXT           -- 周期，如 2026-W30,
//
// node-sql-parser (used by drawDB) treats "--" as an ordinary SQL comment and
// discards it, so the trailing comma is lost and columns end up unseparated,
// which breaks parsing. It also discards the comment text, so it never reaches
// the diagram's field.comment.
//
// The same exports put the Chinese table name in a comment block immediately
// above each CREATE TABLE, e.g.:
//
//   -- -----------------------------------------------------------------------
//   -- 表 3：cognition_digests 认知数据期刊数据（本地）
//   -- -----------------------------------------------------------------------
//   CREATE TABLE IF NOT EXISTS cognition_digests (
//
// This preprocessor:
//   1. strips PRAGMA statements (runtime settings, not schema),
//   2. captures each column's trailing "-- comment" text,
//   3. captures each table's Chinese name from the "-- 表 X：<name> <cn>" line,
//   4. removes those comments from the SQL while re-inserting a separator comma
//      when the original column comment ended with one (so columns stay separated).
//
// Returns cleaned SQL plus two maps the SQLite importer uses to populate field
// and table comments:
//   - columnComments: { tableName: { columnName: comment } }
//   - tableComments:  { tableName: comment }

export function preprocessForSqlite(src) {
  const columnComments = {};
  const tableComments = {};
  let currentTable = null;
  let pendingTableComment = null; // { name: string|null, comment: string }

  const rawLines = src.split(/\r?\n/);
  const lines = rawLines.map((l) => l.replace(/\r$/, ""));
  const out = [];

  for (const line of lines) {
    // 1. Table header comment above CREATE TABLE, e.g.
    //    "-- 表 3：cognition_digests 认知数据期刊数据（本地）"
    //    Capture the Chinese name; drop the line (it is not schema).
    const header = line.match(
      /^\s*--\s*表[^：:\n]*[：:]\s*(?:([A-Za-z0-9_]+)\s+)?([^\n]*)$/,
    );
    if (header) {
      pendingTableComment = {
        name: header[1] || null,
        comment: header[2].trim(),
      };
      continue;
    }

    // 2. Track the current table so captured comments map to the right table.
    const tbl = line.match(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([A-Za-z0-9_]+)/i,
    );
    if (tbl) {
      currentTable = tbl[1];
      columnComments[currentTable] = columnComments[currentTable] || {};
      if (pendingTableComment) {
        if (
          !pendingTableComment.name ||
          pendingTableComment.name === currentTable
        ) {
          tableComments[currentTable] = pendingTableComment.comment;
        }
        pendingTableComment = null;
      }
    }
    if (/^\s*\)\s*;?\s*$/.test(line)) {
      currentTable = null;
    }

    // 3. Column-level trailing comment, e.g. "  id TEXT PRIMARY KEY   -- 记录 id,"
    const col = line.match(
      /^\s*([A-Za-z_][A-Za-z0-9_]*)\b.*?--\s*([\s\S]*?)(\s*,)?\s*$/,
    );
    if (col && currentTable && !/^\s*CREATE\s+TABLE/i.test(line)) {
      const colName = col[1];
      const comment = col[2].replace(/\s+$/, "");
      const hadTrailingComma = Boolean(col[3]);
      columnComments[currentTable][colName] = comment;
      // Drop the "-- comment" tail; keep a comma if the comment ended with one.
      const cleaned = line.replace(
        /\s*--\s*[\s\S]*?(\s*,)?\s*$/,
        (_, comma) => (comma ? "," : ""),
      );
      out.push(cleaned);
      continue;
    }

    // 4. Drop standalone PRAGMA statements and pure-comment lines to reduce
    //    parser risk (they carry no schema information for the diagram).
    if (/^\s*PRAGMA\b/i.test(line)) continue;
    if (/^\s*--/.test(line)) continue;

    out.push(line);
  }

  return { sql: out.join("\n"), columnComments, tableComments };
}
