import { exportFieldComment, parseDefault } from "./shared";

import { dbToTypes } from "../../data/datatypes";

export function toMSSQL(diagram) {
  return `${diagram.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/**\n${table.comment}\n*/\n`
        }CREATE TABLE [${table.name}] (\n${table.fields
          .map(
            (field) =>
              `${exportFieldComment(field.comment)}\t[${
                field.name
              }] ${field.type}${
                field.notNull ? " NOT NULL" : ""
              }${field.increment ? " IDENTITY" : ""}${
                field.unique ? " UNIQUE" : ""
              }${
                field.default !== ""
                  ? ` DEFAULT ${parseDefault(field, diagram.database)}`
                  : ""
              }${
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
                .map((f) => `[${f.name}]`)
                .join(", ")})`
            : ""
        }\n);\nGO\n${`${table.indices
          .map(
            (i) =>
              `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX [${
                i.name
              }]\nON [${table.name}] (${i.fields
                .map((f) => `[${f}]`)
                .join(", ")});\nGO\n`,
          )
          .join("")}`}`,
    )
    .join("\n")}\n${diagram.references
    .map(
      (r) =>
        `ALTER TABLE [${diagram.tables[r.startTableId].name}]\nADD FOREIGN KEY([${
          diagram.tables[r.startTableId].fields[r.startFieldId].name
        }]) REFERENCES [${diagram.tables[r.endTableId].name}]([${
          diagram.tables[r.endTableId].fields[r.endFieldId].name
        }])\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};\nGO`,
    )
    .join("\n")}`;
}
