import assert from "node:assert/strict";
import { test } from "node:test";
import nodeSQLParser from "node-sql-parser";

import { expandPostgresCreateTableLike } from "./postgresLikeTables.js";

const { Parser } = nodeSQLParser;

function parse(result) {
  return new Parser().astify(result, { database: "postgresql" });
}

test("PostgreSQL CREATE TABLE LIKE expands from an earlier table", () => {
  const result = expandPostgresCreateTableLike(`CREATE TABLE public.users (
  id integer PRIMARY KEY,
  email varchar(255) NOT NULL
);
CREATE TABLE public.user_archive (
  LIKE public.users INCLUDING ALL
);`);

  assert.ok(result.includes("id integer PRIMARY KEY"));
  const ast = parse(result);
  assert.equal(ast.length, 2);
  assert.equal(ast[1].table[0].table, "user_archive");
  assert.equal(ast[1].create_definitions.length, 2);
});

test("LIKE expansion supports extra columns and chained copies", () => {
  const result = expandPostgresCreateTableLike(`CREATE TABLE public.source (
  id integer PRIMARY KEY,
  value text
);
CREATE TABLE public.clone (
  LIKE public.source INCLUDING DEFAULTS,
  archived_at timestamp
);
CREATE TABLE public.clone_copy (
  LIKE public.clone INCLUDING ALL
);`);

  const ast = parse(result);
  const copyColumns = ast[2].create_definitions.map(
    (definition) => definition.column.column.expr.value,
  );
  assert.deepEqual(copyColumns, ["id", "value", "archived_at"]);
});

test("quoted identifiers and semicolons in defaults remain intact", () => {
  const result =
    expandPostgresCreateTableLike(`CREATE TABLE public."Source Table" (
  "value" text DEFAULT 'keep; this'
);
CREATE TABLE public."Clone Table" (
  LIKE public."Source Table"
);`);

  assert.ok(result.includes("keep; this"));
  const ast = parse(result);
  assert.equal(ast[1].table[0].table, "Clone Table");
  assert.equal(ast[1].create_definitions.length, 1);
});

test("an unresolved LIKE source is left unchanged", () => {
  const sql = `CREATE TABLE public.missing_clone (
  LIKE public.missing_source INCLUDING ALL
);`;

  assert.equal(expandPostgresCreateTableLike(sql), sql);
});
