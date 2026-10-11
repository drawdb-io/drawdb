import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let postgresTypes;

before(async () => {
  server = await createServer({
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: "custom",
  });
  ({ postgresTypes } = await server.ssrLoadModule("/src/data/datatypes.js"));
});

after(async () => {
  await server?.close();
});

test("TEXT defaults do not have a length limit", () => {
  for (const size of [undefined, null, "", 3]) {
    assert.equal(
      postgresTypes.TEXT.checkDefault({ default: "draft", size }),
      true,
    );
  }
});

test("VARCHAR defaults without a declared length are valid", () => {
  for (const size of [undefined, null, ""]) {
    assert.equal(
      postgresTypes.VARCHAR.checkDefault({ default: "draft", size }),
      true,
    );
  }
});

test("explicit VARCHAR and CHAR lengths still limit defaults", () => {
  assert.equal(
    postgresTypes.VARCHAR.checkDefault({ default: "draft", size: 3 }),
    false,
  );
  assert.equal(
    postgresTypes.VARCHAR.checkDefault({ default: "draft", size: 5 }),
    true,
  );
  assert.equal(
    postgresTypes.VARCHAR.checkDefault({ default: "'draft'", size: 5 }),
    true,
  );
  assert.equal(
    postgresTypes.CHAR.checkDefault({ default: "ab", size: 1 }),
    false,
  );
});
