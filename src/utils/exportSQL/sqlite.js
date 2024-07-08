import { dbToTypes } from "../../data/datatypes";
import { parseDefault } from "./shared";

export function toSqlite(diagram) {
  return diagram.tables
    .map((table) => {
      const inlineFK = getInlineFK(table, diagram);
      return `${
        table.comment === "" ? "" : `/* ${table.comment} */\n`
      }CREATE TABLE IF NOT EXISTS "${table.name}" (\n${table.fields
        .map(
          (field) =>
            `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
              field.name
            }" ${field.type}${field.notNull ? " NOT NULL" : ""}${
              field.unique ? " UNIQUE" : ""
            }${field.default !== "" ? ` DEFAULT ${parseDefault(field, diagram.database)}` : ""}${
              field.check === "" ||
              !dbToTypes[diagram.database][field.type].hasCheck
                ? ""
                : ` CHECK(${field.check})`
            }`,
        )
        .join(",\n")}${
        table.fields.filter((f) => f.primary).length > 0
          ? `,\n\tPRIMARY KEY(${table.fields
              .filter((f) => f.primary)
              .map((f) => `"${f.name}"`)
              .join(", ")})${inlineFK !== "" ? ",\n" : ""}`
          : ""
      }\t${inlineFK}\n);\n${table.indices
        .map(
          (i) =>
            `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX IF NOT EXISTS "${
              i.name
            }"\nON "${table.name}" (${i.fields
              .map((f) => `"${f}"`)
              .join(", ")});`,
        )
        .join("\n")}`;
    })
    .join("\n");
}

export function getInlineFK(table, obj) {
  let fk = "";
  obj.references.forEach((r) => {
    if (fk !== "") return;
    if (r.startTableId === table.id) {
      fk = `FOREIGN KEY ("${table.fields[r.startFieldId].name}") REFERENCES "${
        obj.tables[r.endTableId].name
      }"("${
        obj.tables[r.endTableId].fields[r.endFieldId].name
      }")\n\tON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()}`;
    }
  });
  return fk;
}
