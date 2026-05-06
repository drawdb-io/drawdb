import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateDDL } from "./lib/generateDDL.js";

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173"
).split(",");

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json());

app.post("/api/schema/postgres", async (req, res) => {
  const { host, port, database, user, password, schema: schemaName, ssl } = req.body;

  if (!host || !database || !user) {
    return res.status(400).json({
      error: "Missing required fields: host, database, user",
    });
  }

  try {
    const result = await generateDDL({
      host,
      port: port || 5432,
      database,
      user,
      password: password || "",
      schema: schemaName || "public",
      ssl: ssl || false,
    });
    res.json(result);
  } catch (err) {
    const msg = err.message || "Unknown error";

    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      return res.status(502).json({ error: `Connection refused: ${msg}` });
    }
    if (msg.includes("authentication") || msg.includes("password")) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    if (msg.includes("does not exist") || msg.includes("3D000")) {
      return res.status(404).json({ error: `Database not found: ${database}` });
    }

    res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`drawdb-server listening on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
