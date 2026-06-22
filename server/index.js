import express from "express";
import cors from "cors";
import { readdir, readFile, writeFile, unlink, stat } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

async function readDiagram(id) {
  const file = join(DATA_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  const raw = await readFile(file, "utf-8");
  return JSON.parse(raw);
}

// List all diagrams (metadata only)
app.get("/api/diagrams", async (_req, res) => {
  try {
    const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
    const items = await Promise.all(
      files.map(async (f) => {
        const file = join(DATA_DIR, f);
        const [raw, info] = await Promise.all([readFile(file, "utf-8"), stat(file)]);
        const d = JSON.parse(raw);
        return {
          diagramId: d.diagramId,
          name: d.name,
          lastModified: d.lastModified,
          database: d.database,
          sizeBytes: info.size,
        };
      })
    );
    items.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    res.json(items);
  } catch {
    res.json([]);
  }
});

// Get single diagram
app.get("/api/diagrams/:id", async (req, res) => {
  const diagram = await readDiagram(req.params.id);
  if (!diagram) return res.status(404).json({ error: "Not found" });
  res.json(diagram);
});

// Save diagram
app.put("/api/diagrams/:id", async (req, res) => {
  const file = join(DATA_DIR, `${req.params.id}.json`);
  await writeFile(file, JSON.stringify(req.body, null, 2), "utf-8");
  res.json({ ok: true });
});

// Delete diagram
app.delete("/api/diagrams/:id", async (req, res) => {
  const file = join(DATA_DIR, `${req.params.id}.json`);
  if (!existsSync(file)) return res.status(404).json({ error: "Not found" });
  await unlink(file);
  res.json({ ok: true });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const distDir = join(__dirname, "..", "dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(join(distDir, "index.html")));
}

app.listen(PORT, () => console.log(`DrawDB server listening on port ${PORT}`));
