import { appendViews } from "../views";
import {
  exportFieldComment,
  getInlineFK,
  getSQLiteAutoIncrementField,
  parseDefault,
  uniqueConstraintClause,
} from "./shared";

import { dbToTypes } from "../../data/datatypes";

function tablesToSqlite(diagram) {
  return diagram.tables
    .map((table) => {
      const inlineFK = getInlineFK(table, diagram);
      const primaryFields = table.fields.filter((field) => field.primary);
      const autoIncrementField = getSQLiteAutoIncrementField(primaryFields);
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
            }${field === autoIncrementField ? " PRIMARY KEY AUTOINCREMENT" : ""}`,
        )
        .join(",\n")}${
        primaryFields.length > 0 && !autoIncrementField
          ? `,\n\tPRIMARY KEY(${primaryFields
              .map((f) => `"${f.name}"`)
              .join(", ")})`
          : ""
      }${inlineFK !== "" ? ",\n" : ""}${inlineFK}${uniqueConstraintClause(table, (s) => `"${s}"`)}\n);\n${table.indices
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

export function toSqlite(diagram) {
  return appendViews(tablesToSqlite(diagram), diagram);
}
