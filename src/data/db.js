import Dexie from "dexie";
import { templateSeeds } from "./seeds";

export const db = new Dexie("drawDB");

db.version(8)
  .stores({
    diagrams: "++id, lastModified, loadedFromGistId",
    templates: "++id, custom",
  })
  .upgrade((trans) => {
    return trans.templates
      .where("custom")
      .equals(0)
      .delete()
      .then(() => {
        return trans.templates.bulkAdd(templateSeeds);
      });
  });

db.on("populate", (transaction) => {
  transaction.templates.bulkAdd(templateSeeds).catch((e) => console.log(e));
});
