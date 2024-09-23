import Dexie from "dexie";
import 'dexie-observable';
import { templateSeeds } from "./seeds";
import { diagramToDdbFile, ddbFileToDiagram, writeDdbFiles, deleteDdbFiles } from "./usercode"
import { ddbDiagramIsValid } from "../utils/validateSchema";

export const db = new Dexie("drawDB");

db.version(7).stores({
  diagrams: "++id, lastModified, loadedFromGistId",
  templates: "++id, custom",
});

db.on("populate", (transaction) => {
  transaction.templates.bulkAdd(templateSeeds).catch((e) => console.log(e));
});

db.on("ready", async (db) => {
  // Use ddb files as source for diagrams
  const diagramsRes = await fetch('/api/diagrams', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  })
  const ddbFiles = await diagramsRes.json();
  const validDdbFiles = ddbFiles.filter(ddbFile => ddbDiagramIsValid(ddbFile));
  const diagrams = validDdbFiles.map(f => ddbFileToDiagram(f))
  return db.transaction('rw', db.diagrams, async () => {
    await db.diagrams.clear();
    await db.diagrams.bulkAdd(diagrams);
  })
})

const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

const debouncedChangesHandler = debounce(async (changes) => {
  handleDiagramChanges(changes.filter(c => c.table === "diagrams"))
}, 1500);

const handleDiagramChanges = (diagramChanges) => {
  diagramChanges.forEach(({ type, obj, oldObj }) => {
    const ddbFile = diagramToDdbFile(obj);

    switch (type) {
      case 1:
        writeDdbFiles([ddbFile]);
        break;

      case 2:
        if (oldObj && obj.id === oldObj.id && obj.name !== oldObj.name) {
          const oldDdbFile = diagramToDdbFile(oldObj);
          deleteDdbFiles([oldDdbFile]);
        }
        writeDdbFiles([ddbFile]);
        break;

      case 3:
        deleteDdbFiles([ddbFile]);
        break;

      default:
        break;
    }
  })
}

db.on('changes', debouncedChangesHandler)
