import Dexie from "dexie";

const db = new Dexie("diagrams");

db.version(1).stores({
  diagrams: "++id",
});

export { db };
