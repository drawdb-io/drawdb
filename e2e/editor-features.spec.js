import { expect, test } from "@playwright/test";

async function seedDiagram(page) {
  await page.goto("/");
  await page.evaluate(async () => {
    const openDb = () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("drawDB", 67);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("diagrams")) {
            const diagrams = db.createObjectStore("diagrams", {
              keyPath: "id",
              autoIncrement: true,
            });
            diagrams.createIndex("lastModified", "lastModified");
            diagrams.createIndex("loadedFromGistId", "loadedFromGistId");
            diagrams.createIndex("diagramId", "diagramId");
          }
          if (!db.objectStoreNames.contains("templates")) {
            const templates = db.createObjectStore("templates", {
              keyPath: "id",
              autoIncrement: true,
            });
            templates.createIndex("custom", "custom");
            templates.createIndex("templateId", "templateId");
          }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

    const db = await openDb();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(["diagrams"], "readwrite");
      tx.objectStore("diagrams").clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    await new Promise((resolve, reject) => {
      const tx = db.transaction(["diagrams"], "readwrite");
      tx.objectStore("diagrams").add({
        name: "E2E Diagram",
        lastModified: Date.now(),
        loadedFromGistId: null,
        diagramId: crypto.randomUUID(),
        database: "generic",
        tables: [
          {
            id: "table_1",
            name: "users",
            x: 200,
            y: 200,
            locked: false,
            fields: [
              {
                id: "field_1",
                name: "id",
                type: "INT",
                default: "",
                check: "",
                primary: true,
                unique: true,
                notNull: true,
                increment: true,
                comment: "",
              },
            ],
            comment: "",
            indices: [],
            color: "#175e7a",
          },
        ],
        references: [],
        notes: [],
        areas: [],
        pan: { x: 0, y: 0 },
        zoom: 1,
        gistId: null,
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  });
  await page.goto("/editor");
  await expect(page.locator("foreignObject").first()).toBeVisible();
}

test("table actions menu can delete all fields in default view", async ({ page }) => {
  await seedDiagram(page);

  const table = page.locator("foreignObject").first();
  await table.hover();
  await page.getByRole("button", { name: "Table actions" }).first().click();

  await expect(page.getByRole("button", { name: "Delete all fields" })).toBeVisible();
  await page.getByRole("button", { name: "Delete all fields" }).click();

  await expect(table.getByText(/^id$/)).toHaveCount(0);
});

test("MYPRIMETYPE is available in field type selector", async ({ page }) => {
  await seedDiagram(page);

  const table = page.locator("foreignObject").first();
  await table.dblclick();

  await page.getByText(/^INT$/).first().click();
  await expect(page.getByText("MYPRIMETYPE")).toBeVisible();
});
