import { escapeQuotes, parseDefault } from "./shared";

import { dbToTypes } from "../../data/datatypes";
import { Cardinality, DB } from "../../data/constants";

function parseType(field) {
  let res = field.type;

  if (field.type === "SET" || field.type === "ENUM") {
    res += `${field.values ? "(" + field.values.map((value) => "'" + value + "'").join(", ") + ")" : ""}`;
  }

  if (
    dbToTypes[DB.MYSQL][field.type].isSized ||
    dbToTypes[DB.MYSQL][field.type].hasPrecision
  ) {
    res += `${field.size && field.size !== "" ? "(" + field.size + ")" : ""}`;
  }

  return res;
}

export function toMySQL(diagram) {
  return `${diagram.tables
    .map(
      (table) =>
        `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n${table.fields
          .map(
            (field) =>
              `\t\`${field.name}\` ${parseType(field)}${
                dbToTypes[DB.MYSQL][field.type]?.signed && field.unsigned
                  ? " UNSIGNED"
                  : ""
              }${field.notNull ? " NOT NULL" : ""}${
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
        }\n)${table.comment ? ` COMMENT='${escapeQuotes(table.comment)}'` : ""};\n${`\n${table.indices
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
      const isInverted = r.cardinality === Cardinality.ONE_TO_MANY;
      const fkTableId = isInverted ? r.endTableId : r.startTableId;
      const fkFieldId = isInverted ? r.endFieldId : r.startFieldId;
      const refTableId = isInverted ? r.startTableId : r.endTableId;
      const refFieldId = isInverted ? r.startFieldId : r.endFieldId;

      const { name: fkName, fields: fkFields } = diagram.tables.find(
        (t) => t.id === fkTableId,
      );
      const { name: refName, fields: refFields } = diagram.tables.find(
        (t) => t.id === refTableId,
      );
      return `ALTER TABLE \`${fkName}\`\nADD FOREIGN KEY(\`${
        fkFields.find((f) => f.id === fkFieldId).name
      }\`) REFERENCES \`${refName}\`(\`${
        refFields.find((f) => f.id === refFieldId).name
      }\`)\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`;
    })
    .join("\n")}`;
}
