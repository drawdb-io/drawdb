import assert from "node:assert/strict";
import test from "node:test";
import parserPackage from "node-sql-parser";
import { createServer } from "vite";

const { Parser } = parserPackage;

const vite = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const { fromPostgres } = await vite.ssrLoadModule(
    "/src/utils/importSQL/postgres.js",
  );

  test("preserves nested function defaults when importing PostgreSQL", () => {
    const sql = `CREATE TABLE public.person (
      id bigint NOT NULL,
      external_id character varying(255)
        DEFAULT "substring"(md5((random())::text), 1, 6)
    );`;
    const ast = new Parser().astify(sql, { database: "postgresql" });

    const diagram = fromPostgres(ast);
    const field = diagram.tables[0].fields.find(
      (field) => field.name === "external_id",
    );

    assert.equal(field.default, "substring(md5(random()::TEXT), 1, 6)");
  });
} finally {
  await vite.close();
}
