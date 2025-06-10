import { escapeQuotes, parseDefault } from "./shared";

import { dbToTypes } from "../../data/datatypes";
import { DB } from "../../data/constants";

function parseType(field) {
  let res = field.type;

  if (field.type === "SET" || field.type === "ENUM") {
    res += `${field.values ? "(" + field.values.map((value) => "'" + value + "'").join(", ") + ")" : ""}`;
  }

  if (dbToTypes[DB.MARIADB][field.type].isSized) {
    res += `${field.size && field.size !== "" ? "(" + field.size + ")" : ""}`;
  }

  return res;
}

export function toMariaDB(diagram) {
  return `${diagram.tables
    .map(
      (table) =>
        `CREATE OR REPLACE TABLE \`${table.name}\` (\n${table.fields
          .map(
            (field) =>
              `\t\`${field.name}\` ${parseType(field)}${field.unsigned ? " UNSIGNED" : ""}${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " AUTO_INCREMENT" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== ""
                  ? ` DEFAULT ${parseDefault(field, diagram.database)}`
                  : ""
              }${
                field.check === "" ||
                !dbToTypes[diagram.database][field.type].hasCheck
                  ? ""
                  : ` CHECK(${field.check})`
              }${field.comment ? ` COMMENT '${escapeQuotes(field.comment)}'` : ""}`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `\`${f.name}\``)
                .join(", ")})`
            : ""
        }\n)${table.comment ? ` COMMENT='${escapeQuotes(table.comment)}'` : ""};${`\n${table.indices
          .map(
            (i) =>
              `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX \`${
                i.name
              }\`\nON \`${table.name}\` (${i.fields
                .map((f) => `\`${f}\``)
                .join(", ")});`,
          )
          .join("")}`}`,
    )
    .join("\n")}\n${diagram.references
    .map((r) => {
      const { name: startName, fields: startFields } = diagram.tables.find(
        (t) => t.id === r.startTableId,
      );

      const { name: endName, fields: endFields } = diagram.tables.find(
        (t) => t.id === r.endTableId,
      );
      return `ALTER TABLE \`${startName}\`\nADD FOREIGN KEY(\`${
        startFields.find((f) => f.id === r.startFieldId).name
      }\`) REFERENCES \`${endName}\`(\`${
        endFields.find((f) => f.id === r.endFieldId).name
      }\`)\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`;
    })
    .join("\n")}`;
}
