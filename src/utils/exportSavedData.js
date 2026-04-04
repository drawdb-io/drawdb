import JSZip from "jszip";
import { db } from "../data/db";
import { saveAs } from "file-saver";

const zip = new JSZip();

const formatDiagram = (diagram) => {
  const formattedDiagram = { ...diagram };
  formattedDiagram.relationships = diagram.references;
  formattedDiagram.subjectAreas = diagram.areas;

  delete formattedDiagram.references;
  delete formattedDiagram.areas;

  return formattedDiagram;
};

export async function exportSavedData() {
  const diagramsFolder = zip.folder("diagrams");

  await db.diagrams.each((diagram) => {
    diagramsFolder.file(
      `${diagram.name}(${diagram.id}).json`,
      JSON.stringify(formatDiagram(diagram), null, 2),
    );
    return true;
  });

  const templatesFolder = zip.folder("templates");

  await db.templates.where({ custom: 1 }).each((template) => {
    templatesFolder.file(
      `${template.title}(${template.id}).json`,
      JSON.stringify(formatDiagram(template), null, 2),
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
