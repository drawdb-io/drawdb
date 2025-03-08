import { exportFieldComment, getInlineFK, parseDefault } from "./shared";

import { dbToTypes } from "../../data/datatypes";

export function toSqlite(diagram) {
  return diagram.tables
    .map((table) => {
      const inlineFK = getInlineFK(table, diagram);
      return `${
        table.comment === "" ? "" : `/* ${table.comment} */\n`
      }CREATE TABLE IF NOT EXISTS "${table.name}" (\n${table.fields
        .map(
          (field) =>
            `${exportFieldComment(field.comment)}\t"${
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
      }${inlineFK}\n);\n${table.indices
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