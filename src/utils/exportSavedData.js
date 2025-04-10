import JSZip from "jszip";
import { db } from "../data/db";
import { saveAs } from "file-saver";

const zip = new JSZip();

export async function exportSavedData() {
  const diagramsFolder = zip.folder("diagrams");

  await db.diagrams.each((diagram) => {
    diagramsFolder.file(
      `${diagram.name}(${diagram.id}).json`,
      JSON.stringify(diagram, null, 2),
    );
    return true;
  });

  const templatesFolder = zip.folder("templates");

  await db.templates.where({ custom: 1 }).each((template) => {
    templatesFolder.file(
      `${template.title}(${template.id}).json`,
      JSON.stringify(template, null, 2),
    );
    return true;
  });

  zip.generateAsync({ type: "blob" }).then(function (content) {
    const date = new Date();
    saveAs(
      content,
      `${date.getFullYear()}_${date.getMonth()}_${date.getDay()}_export.zip`,
    );
  });
}
