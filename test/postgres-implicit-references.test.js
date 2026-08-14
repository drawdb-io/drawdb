import assert from "node:assert/strict";
import test from "node:test";
import sqlParser from "node-sql-parser";
import { createServer } from "vite";
import {
  parsePostgresSQL,
  preparePostgresSQL,
} from "../src/utils/importSQL/postgresImplicitReferences.js";

const { Parser } = sqlParser;

function parsePostgres(sql) {
  return parsePostgresSQL(new Parser(), sql, "Postgresql");
}

test("imports omitted PostgreSQL reference columns as primary-key relationships", async () => {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
  });

  try {
    const { fromPostgres } = await server.ssrLoadModule(
      "/src/utils/importSQL/postgres.js",
    );
    const diagram = fromPostgres(
      parsePostgres(`
        CREATE TABLE test.table1 (id UUID NOT NULL PRIMARY KEY);
        CREATE TABLE test.table2 (
          id UUID NOT NULL PRIMARY KEY,
          ref_id UUID REFERENCES table1
        );
      `),
      "generic",
    );
    const [parent, child] = diagram.tables;
    assert.equal(diagram.relationships.length, 1);
    assert.equal(diagram.relationships[0].startFieldId, child.fields[1].id);
    assert.equal(diagram.relationships[0].endFieldId, parent.fields[0].id);

    const composite = fromPostgres(
      parsePostgres(`
        CREATE TABLE parent (a INT, b INT, PRIMARY KEY (b, a));
        CREATE TABLE child (
          parent_b INT,
          parent_a INT,
          FOREIGN KEY (parent_b, parent_a) REFERENCES parent
        );
      `),
      "generic",
    );
    assert.deepEqual(
      composite.relationships[0].fields.map(({ startFieldId, endFieldId }) => [
        composite.tables[1].fields.find((field) => field.id === startFieldId)
          .name,
        composite.tables[0].fields.find((field) => field.id === endFieldId)
          .name,
      ]),
      [
        ["parent_b", "b"],
        ["parent_a", "a"],
      ],
    );
  } finally {
    await server.close();
  }
});

test("only rewrites omitted unqualified references in CREATE TABLE", () => {
  const implicit = `
    -- REFERENCES ignored_comment
    CREATE TABLE child (
      note TEXT DEFAULT 'REFERENCES ignored_string',
      parent_id NUMERIC(10, 2) REFERENCES parent
    );
  `;
  const prepared = preparePostgresSQL(implicit);
  assert.ok(prepared.marker);
  assert.equal(prepared.sql.split(`("${prepared.marker}")`).length - 1, 1);
  assert.doesNotThrow(() => parsePostgres(implicit));

  const afterBackslashLiteral = String.raw`CREATE TABLE child (
    note TEXT DEFAULT '\',
    parent_id INT REFERENCES parent
  );`;
  assert.ok(preparePostgresSQL(afterBackslashLiteral).marker);

  const escapeString = String.raw`SELECT E'escaped \' REFERENCES ignored';`;
  assert.deepEqual(preparePostgresSQL(escapeString), {
    sql: escapeString,
    marker: null,
  });

  for (const definition of [
    "id INT NOT NULL REFERENCES parent",
    "id INT UNIQUE REFERENCES parent",
    "id INT DEFAULT 1 REFERENCES parent",
    "id TIMESTAMP DEFAULT now() REFERENCES parent",
    "id UUID DEFAULT gen_random_uuid() REFERENCES parent",
    "id INT DEFAULT -1 REFERENCES parent",
    "id TEXT DEFAULT '1'::TEXT REFERENCES parent",
    "id INT CHECK (id > 0) REFERENCES parent",
    'id TEXT COLLATE "C" REFERENCES parent',
    "id DOUBLE PRECISION REFERENCES parent",
    "id TIMESTAMP WITH TIME ZONE REFERENCES parent",
    "id INT REFERENCES references",
    "id INT REFERENCES parent ON DELETE CASCADE",
    "id INT REFERENCES parent MATCH FULL",
  ]) {
    const sql = `CREATE TABLE child (${definition});`;
    assert.ok(preparePostgresSQL(sql).marker, definition);
    assert.doesNotThrow(() => parsePostgres(sql), definition);
  }

  for (const sql of [
    "CREATE TABLE references (id INT);",
    "CREATE TABLE child (references INT);",
    "CREATE TABLE child (id INT CHECK(references > 0));",
    "SELECT references FROM audit_log;",
    "/* REFERENCES block_comment */ SELECT 1;",
    "SELECT $$ REFERENCES dollar_quote $$;",
    "GRANT REFERENCES ON parent TO app_user;",
    "CREATE TABLE child (id INT REFERENCES app.parent);",
    "CREATE TABLE child (id INT REFERENCES parent(id));",
    "CREATE TABLE child (id INT CONSTRAINT references REFERENCES parent(id));",
    "CREATE TABLE child (id INT, CONSTRAINT references FOREIGN KEY (id) REFERENCES parent(id));",
    "CREATE TABLE child (id INT CONSTRAINT references UNIQUE);",
    "CREATE TABLE child (id INT, CONSTRAINT references UNIQUE (id));",
    "CREATE TABLE child (id TEXT COLLATE references NOT NULL);",
    "CREATE TABLE child (id TEXT COMPRESSION references NOT NULL);",
    "CREATE TABLE child (id INT REFERENCES ONLY parent);",
    "ALTER TABLE child ADD FOREIGN KEY (id) REFERENCES parent;",
  ]) {
    assert.deepEqual(preparePostgresSQL(sql), { sql, marker: null });
  }

  for (const sql of [
    "CREATE TABLE child (id INT REFERENCES parent(id));",
    "CREATE TABLE child (id INT CONSTRAINT references UNIQUE);",
    "CREATE TABLE child (id TEXT COLLATE references NOT NULL);",
  ]) {
    assert.doesNotThrow(() => parsePostgres(sql));
  }

  for (const sql of [
    "CREATE TABLE child (id INT CONSTRAINT references REFERENCES parent);",
    "CREATE TABLE child (id INT, CONSTRAINT references FOREIGN KEY (id) REFERENCES parent);",
    "CREATE TABLE child (id references REFERENCES parent);",
  ]) {
    const prepared = preparePostgresSQL(sql);
    assert.ok(prepared.marker);
    assert.equal(prepared.sql.split(`("${prepared.marker}")`).length - 1, 1);
  }

  assert.throws(() =>
    parsePostgres("CREATE TABLE child (id INT REFERENCES ONLY parent);"),
  );
});

test("only retries PostgreSQL parsing for omitted reference columns", () => {
  const validCalls = [];
  const validParser = {
    astify(sql, options) {
      validCalls.push([sql, options]);
      return { type: "valid" };
    },
  };
  assert.deepEqual(
    parsePostgresSQL(validParser, "CREATE TABLE valid (id INT);", "Postgresql"),
    { type: "valid" },
  );
  assert.equal(validCalls.length, 1);

  const retryCalls = [];
  const retryParser = {
    astify(sql) {
      retryCalls.push(sql);
      if (retryCalls.length === 1) throw new Error("unsupported omission");
      return {
        reference_definition: {
          definition: [
            {
              column: {
                expr: { value: "__drawdb_implicit_reference__" },
              },
            },
          ],
        },
      };
    },
  };
  const ast = parsePostgresSQL(
    retryParser,
    "CREATE TABLE child (id INT REFERENCES parent);",
    "Postgresql",
  );
  assert.equal(retryCalls.length, 2);
  assert.equal(ast.reference_definition.implicitPrimaryKey, true);

  const originalError = new Error("original parser error");
  const failingParser = {
    astify: () => {
      throw originalError;
    },
  };
  assert.throws(
    () => parsePostgresSQL(failingParser, "SELECT references;", "Postgresql"),
    (error) => error === originalError,
  );

  const retryError = new Error("retry parser error");
  let attempts = 0;
  const doubleFailingParser = {
    astify() {
      attempts += 1;
      throw attempts === 1 ? originalError : retryError;
    },
  };
  assert.throws(
    () =>
      parsePostgresSQL(
        doubleFailingParser,
        "CREATE TABLE child (id INT REFERENCES parent);",
        "Postgresql",
      ),
    (error) => error === originalError,
  );
  assert.equal(attempts, 2);
});
