import Dexie from "dexie";
import { templateSeeds } from "./seeds";

const db = new Dexie("drawDB");

db.version(4).stores({
  diagrams: "++id, lastModified",
  templates: "++id, custom",
});

db.on("populate", (transaction) => {
  transaction.templates.bulkAdd(templateSeeds).catch((e) => console.log(e));
});

export { db };
