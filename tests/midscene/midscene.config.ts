import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineNode, z } from "@midscene/test";
import {
  defineFileSetup,
  defineProjectSetup,
  defineTestProject,
} from "@midscene/test/config";
import { createMidsceneNodes } from "@midscene/test/midscene";
import { PlaywrightAgent } from "@midscene/web/playwright/agent";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Download,
} from "playwright";
import { preview } from "vite";
import sqlParser from "node-sql-parser";

interface Project {
  browser: Browser;
  url: string;
}
interface Context extends Project {
  session: BrowserContext;
  page: Page;
  agent?: PlaywrightAgent;
  downloads: Download[];
}
const setup = defineProjectSetup<Project>({
  name: "local-app",
  async setup({ onTeardown }) {
    const server = await preview({
      root: fileURLToPath(new URL("../../", import.meta.url)),
      preview: { host: "127.0.0.1", port: 4180, strictPort: true },
    });
    onTeardown(
      () =>
        new Promise<void>((resolve, reject) =>
          server.httpServer.close((error) =>
            error ? reject(error) : resolve(),
          ),
        ),
    );
    const browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL || "chrome",
      headless: process.env.HEADLESS !== "false",
    });
    onTeardown(() => browser.close());
    return { browser, url: "http://127.0.0.1:4180" };
  },
});
const fileSetup = defineFileSetup<Context, Project>({
  name: "isolated-storage",
  async setup({ projectContext, onTeardown }) {
    if (!projectContext) throw new Error("Missing project setup");
    const session = await projectContext.browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: "en-US",
      acceptDownloads: true,
    });
    onTeardown(() => session.close());
    const page = await session.newPage();
    const context: Context = {
      ...projectContext,
      session,
      page,
      downloads: [],
    };
    page.on("download", (download) => context.downloads.push(download));
    onTeardown(async () => {
      await context.agent?.destroy();
    });
    await page.goto(`${context.url}/editor`);
    return context;
  },
});
const empty = z.strictObject({});
const upload = defineNode<typeof empty, void, Context>({
  name: "fixture.upload",
  description:
    "Attach the fixed shop SQL file to the upload control opened through the UI.",
  inputSchema: empty,
  async execute({ context }) {
    await context.page
      .locator('input[type="file"][accept=".sql"].semi-upload-hidden-input')
      .setInputFiles(
        fileURLToPath(new URL("fixtures/shop.sql", import.meta.url)),
      );
  },
});
// Read committed storage only: all model changes must originate in the visible UI.
async function savedDiagram(page: Page) {
  return page.evaluate(async () => {
    const databases = await indexedDB.databases();
    if (!databases.some((db) => db.name === "drawDB")) return null;
    return new Promise<any>((resolve, reject) => {
      const request = indexedDB.open("drawDB");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("diagrams", "readonly");
        const query = tx.objectStore("diagrams").getAll();
        query.onsuccess = () =>
          resolve(
            query.result.find(
              (d) => d.diagramId === location.pathname.split("/").at(-1),
            ) ?? null,
          );
        query.onerror = () => reject(query.error);
        tx.oncomplete = () => db.close();
      };
    });
  });
}
function verifySchema(diagram: any, renamed: boolean) {
  assert.ok(diagram, "Current diagram must be persisted");
  assert.equal(diagram.tables.length, 2);
  const users = diagram.tables.find((t: any) => t.name === "users");
  const orders = diagram.tables.find((t: any) => t.name === "orders");
  assert.ok(users && orders, "Expected users and orders tables");
  assert.deepEqual(
    users.fields.map((f: any) => f.name).sort(),
    ["id", renamed ? "display_name" : "name"].sort(),
  );
  assert.deepEqual(orders.fields.map((f: any) => f.name).sort(), [
    "id",
    "user_id",
  ]);
  assert.ok(users.fields.find((f: any) => f.name === "id").primary);
  assert.ok(orders.fields.find((f: any) => f.name === "id").primary);
  assert.equal(diagram.references.length, 1);
  const relation = diagram.references[0];
  const pairs = relation.fields ?? [
    { startFieldId: relation.startFieldId, endFieldId: relation.endFieldId },
  ];
  const endpoints = pairs.map((p: any) =>
    [
      `${diagram.tables.find((t: any) => t.id === relation.startTableId)?.name}.${diagram.tables.find((t: any) => t.id === relation.startTableId)?.fields.find((f: any) => f.id === p.startFieldId)?.name}`,
      `${diagram.tables.find((t: any) => t.id === relation.endTableId)?.name}.${diagram.tables.find((t: any) => t.id === relation.endTableId)?.fields.find((f: any) => f.id === p.endFieldId)?.name}`,
    ].sort(),
  );
  assert.deepEqual(endpoints, [["orders.user_id", "users.id"]]);
}
const savedSchema = z.strictObject({ renamed: z.boolean().default(false) });
const checkSaved = defineNode<typeof savedSchema, void, Context>({
  name: "storage.check",
  description:
    "Wait for autosave and verify exact persisted tables, fields, primary keys and relation endpoints.",
  inputSchema: savedSchema,
  async execute({ context, input }) {
    const deadline = Date.now() + 15000;
    while (true) {
      try {
        verifySchema(await savedDiagram(context.page), input.renamed);
        return;
      } catch (error) {
        if (Date.now() >= deadline) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  },
});
const reload = defineNode<typeof empty, void, Context>({
  name: "app.reload",
  description:
    "Reload the current saved diagram without clearing browser storage.",
  inputSchema: empty,
  async execute({ context }) {
    await context.page.reload();
    try {
      await context.page.getByText("Add table", { exact: true }).waitFor();
    } catch (error) {
      await context.page.screenshot({
        path: "midscene_run/reload-failure.png",
      });
      throw error;
    }
  },
});
const checkDownload = defineNode<typeof empty, void, Context>({
  name: "export.check",
  description:
    "Parse the actual downloaded SQL and check the renamed column and foreign key.",
  inputSchema: empty,
  async execute({ context }) {
    const download = context.downloads.at(-1);
    assert.ok(download, "Export must produce a browser download");
    assert.match(download.suggestedFilename(), /\.sql$/i);
    const path = await download.path();
    assert.ok(path);
    const sql = await readFile(path, "utf8");
    const parser = new sqlParser.Parser();
    const ast = parser.astify(sql, { database: "MySQL" });
    const statements = Array.isArray(ast) ? ast : [ast];
    const tables = statements.filter(
      (s: any) => s.type === "create" && s.keyword === "table",
    );
    assert.equal(tables.length, 2);
    const users: any = tables.find((s: any) => s.table[0].table === "users");
    const orders: any = tables.find((s: any) => s.table[0].table === "orders");
    assert.ok(users && orders);
    const columns = (table: any) =>
      table.create_definitions
        .filter((d: any) => d.resource === "column")
        .map((d: any) => d.column.column)
        .sort();
    assert.deepEqual(columns(users), ["display_name", "id"]);
    assert.deepEqual(columns(orders), ["id", "user_id"]);
    // Exporters may put the FK in CREATE TABLE or in a separate ALTER TABLE.
    assert.match(
      sql,
      /FOREIGN\s+KEY\s*\(\s*`?user_id`?\s*\)\s*REFERENCES\s+`?users`?\s*\(\s*`?id`?\s*\)/i,
    );
  },
});
export default defineTestProject<Context, Project>({
  test: {
    maxConcurrentProjects: 1,
    maxConcurrentFiles: 1,
    testTimeout: 600000,
  },
  projects: [
    {
      name: "web",
      setup,
      fileSetup,
      retry: 0,
      files: { include: ["cases/*.yaml"] },
    },
  ],
  nodes: [
    upload,
    checkSaved,
    reload,
    checkDownload,
    ...createMidsceneNodes<Context>({
      agentClass: PlaywrightAgent,
      getAgent({ context }) {
        return (context.agent ??= new PlaywrightAgent(context.page));
      },
    }),
  ],
});
