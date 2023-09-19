import { Validator } from "jsonschema";
import { ddbSchema, jsonSchema } from "../schemas";

function enterFullscreen() {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function jsonDiagramIsValid(obj) {
  return new Validator().validate(obj, jsonSchema).valid;
}

function ddbDiagramIsValid(obj) {
  return new Validator().validate(obj, ddbSchema).valid;
}

function dataURItoBlob(dataUrl) {
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], { type: mimeString });
}

function jsonToSQL(obj) {
  return obj.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/* ${table.comment} */\n`
        }CREATE TABLE \`${table.name}\` (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t\`${
                field.name
              }\` ${field.type}${
                field.length !== "n/a"
                  ? `(${field.length})`
                  : field.type === "ENUM" || field.type === "SET"
                  ? `(${field.values.map((v) => `"${v}"`).join(", ")})`
                  : ""
              }${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " AUTO_INCREMENT" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== "" ? ` DEFAULT ${field.default}` : ""
              },`
          )
          .join("\n")}\n\tPRIMARY KEY(${table.fields
          .filter((f) => f.primary)
          .map((f) => `\`${f.name}\``)
          .join(", ")})\n);`
    )
    .join("\n");
}

export {
  enterFullscreen,
  exitFullscreen,
  jsonDiagramIsValid,
  ddbDiagramIsValid,
  dataURItoBlob,
  jsonToSQL,
};
