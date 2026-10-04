import assert from "node:assert/strict";
import { test } from "node:test";
import nodeSQLParser from "node-sql-parser";

import { removeUnsupportedPostgresViews } from "./postgresViews.js";

const { Parser } = nodeSQLParser;

test("multi-select PostgreSQL views are removed before SQL parsing", () => {
  const sql = `CREATE TABLE public.people (id integer);
CREATE OR REPLACE VIEW public.person_ids AS
  SELECT id FROM public.people
UNION
  SELECT id FROM public.employees;
CREATE TABLE public.employees (id integer);`;

  const result = removeUnsupportedPostgresViews(sql);
  assert.ok(result.includes("CREATE TABLE public.people"));
  assert.ok(result.includes("CREATE TABLE public.employees"));
  assert.ok(!result.includes("person_ids"));

  const ast = new Parser().astify(result, { database: "postgresql" });
  assert.equal(ast.length, 2);
});

test("temporary and materialized view forms are recognized", () => {
  const result =
    removeUnsupportedPostgresViews(`CREATE TEMPORARY VIEW a AS SELECT 1;
CREATE MATERIALIZED VIEW b AS SELECT 2;
CREATE TABLE c (id integer);`);

  assert.ok(!result.includes(" VIEW "));
  assert.ok(result.includes("CREATE TABLE c"));
});

test("semicolons inside strings and dollar-quoted bodies do not split statements", () => {
  const sql = `COMMENT ON TABLE public.people IS 'keep this; semicolon';
DO $procedure$
BEGIN
  RAISE NOTICE 'nested; statement';
END
$procedure$;
CREATE TABLE public.people (id integer);`;

  const result = removeUnsupportedPostgresViews(sql);
  assert.ok(result.includes("keep this; semicolon"));
  assert.ok(result.includes("nested; statement"));
  assert.ok(result.includes("CREATE TABLE public.people"));
});

test("comments before a view declaration do not hide it", () => {
  const result = removeUnsupportedPostgresViews(`-- diagram source
/* strip this /* with a nested comment */ */ CREATE VIEW public.v AS SELECT 1;
CREATE TABLE public.t (id integer);`);

  assert.ok(!result.includes("public.v"));
  assert.ok(result.includes("CREATE TABLE public.t"));
});
