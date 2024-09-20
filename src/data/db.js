import Dexie from "dexie";
import 'dexie-observable';
import { templateSeeds } from "./seeds";
import { diagramToDrawDbFile } from "../utils/parser"

export const db = new Dexie("drawDB");

db.version(7).stores({
  diagrams: "++id, lastModified, loadedFromGistId",
  templates: "++id, custom",
});

db.on("populate", (transaction) => {
  transaction.templates.bulkAdd(templateSeeds).catch((e) => console.log(e));
});


const debounce = (func, delay) => {
  let timer;
  return function(...args) {
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
  console.log("diagramChanges", diagramChanges);

  // Handle create / update / delete separately

  // Parse changes to ddb file format
  const ddbFiles = diagramChanges.map(d => diagramToDrawDbFile(d.obj));
  
  // Write files to usercode
  ddbFiles.forEach(ddbFile => {
    fetch('/api/usercode-files', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename: `${ddbFile.title}.ddb`, content: ddbFile })
    });
  });
}

db.on('changes', debouncedChangesHandler)
