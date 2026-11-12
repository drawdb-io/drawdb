import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

let server;
let toDBML;
let parseDbml;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  ({ toDBML } = await server.ssrLoadModule("/src/utils/exportAs/dbml.js"));
  ({ parseDbml } = await server.ssrLoadModule("/src/utils/dbml/parse.js"));
});

after(async () => {
  await server?.close();
});

function roundTrip({ comment = "", field = {}, indices = [] } = {}) {
  const diagram = {
    database: "postgresql",
    tables: [
      {
        id: 0,
        name: "customers",
        comment,
        fields: [{ id: 0, name: "name", type: "VARCHAR", ...field }],
        indices,
      },
    ],
  };
  return parseDbml(toDBML(diagram)).tables[0];
}

test("preserves apostrophes in table and column comments", () => {
  const comment = "Customer's identifier";
  const table = roundTrip({ comment, field: { comment } });
  assert.equal(table.comment, comment);
  assert.equal(table.fields[0].comment, comment);
});

test("preserves apostrophes in text defaults", () => {
  const value = "O'Reilly";
  assert.equal(
    roundTrip({ field: { default: value } }).fields[0].default,
    value,
  );
});

test("preserves apostrophes in index names", () => {
  const name = "customer's name";
  const table = roundTrip({ indices: [{ name, fields: ["name"] }] });
  assert.equal(table.indices[0].name, name);
});

test("preserves backslashes alongside quotes", () => {
  const value = "C:\\temp\\O'Reilly\\";
  const table = roundTrip({ comment: value, field: { default: value } });
  assert.equal(table.comment, value);
  assert.equal(table.fields[0].default, value);
});

test("preserves multiline comments containing quotes and backslashes", () => {
  const comment = "Customer's details\nPath: C:\\temp\nA triple quote: '''";
  const table = roundTrip({ comment, field: { comment } });
  assert.equal(table.comment, comment);
  assert.equal(table.fields[0].comment, comment);
});

test("keeps ordinary comments and defaults unchanged", () => {
  const table = roundTrip({
    comment: "Customer details",
    field: { default: "guest" },
  });
  assert.equal(table.comment, "Customer details");
  assert.equal(table.fields[0].default, "guest");
});
