import Dexie from "dexie";

const db = new Dexie("drawDB");

db.version(1).stores({
  diagrams: "++id, lastModified",
});

export { db };
