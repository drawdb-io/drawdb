import assert from "node:assert/strict";
import test from "node:test";
import sqlParser from "node-sql-parser";

import { stripPostgresTextCastsInChecks } from "../src/utils/importSQL/preprocess.js";

const { Parser } = sqlParser;

const dump = `
CREATE DOMAIN public.valid_etld AS character varying(63)
  CONSTRAINT valid_etld_check CHECK (((VALUE)::text ~ '^(xn--[a-z0-9]{1,59})$'::text));
CREATE TABLE public.messages (
  id integer PRIMARY KEY,
  address character varying(63) NOT NULL
);
`;

test("PostgreSQL import accepts a regex check with a text-cast pattern", () => {
  const source = stripPostgresTextCastsInChecks(dump);
  const ast = new Parser().astify(source, { database: "postgresql" });

  assert.equal(ast.length, 2);
  assert.equal(ast[0].keyword, "domain");
  assert.equal(ast[1].keyword, "table");
});

test("text-cast normalization is scoped to string literals in checks", () => {
  const source = `
CREATE TABLE public.examples (
  value text CHECK (value ~ 'literal::text'::text),
  explanation text DEFAULT 'not-a-check'::text
);
`;
  const normalized = stripPostgresTextCastsInChecks(source);

  assert.match(normalized, /'literal::text'/);
  assert.doesNotMatch(normalized, /'literal::text'::text/);
  assert.match(normalized, /'not-a-check'::text/);
});
