import { parseDefault } from "./shared";

import { dbToTypes } from "../../data/datatypes";

export function toMySQL(diagram) {
  return `${diagram.tables
    .map(
      (table) =>
        `CREATE TABLE \`${table.name}\` (\n${table.fields
          .map(
            (field) =>
              `\t\`${field.name}\` ${field.type}${field.values ? "(" + field.values.map((value) => "'" + value + "'").join(", ") + ")" : ""}${field.unsigned ? " UNSIGNED" : ""}${field.size !== undefined && field.size !== "" ? "(" + field.size + ")" : ""}${
                field.notNull ? " NOT NULL" : ""
              }${
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
              }${field.comment ? ` COMMENT '${field.comment}'` : ""}`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `\`${f.name}\``)
                .join(", ")})`
            : ""
        }\n)${table.comment ? ` COMMENT='${table.comment}'` : ""};\n${`\n${table.indices
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
    .map(
      (r) =>
        `ALTER TABLE \`${
          diagram.tables[r.startTableId].name
        }\`\nADD FOREIGN KEY(\`${
          diagram.tables[r.startTableId].fields[r.startFieldId].name
        }\`) REFERENCES \`${diagram.tables[r.endTableId].name}\`(\`${
          diagram.tables[r.endTableId].fields[r.endFieldId].name
        }\`)\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`,
    )
    .join("\n")}`;
}
