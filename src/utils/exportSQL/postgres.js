import { dbToTypes } from "../../data/datatypes";
import { parseDefault } from "./shared";

export function toPostgres(diagram) {
  const enumStatements = diagram.enums
    .map(
      (e) =>
        `CREATE TYPE "${e.name}" AS ENUM (\n${e.values.map((v) => `\t'${v}'`).join(",\n")}\n);`,
    )
    .join("\n\n");

  const typeStatements = diagram.types
    .map(
      (type) =>
        `\nCREATE TYPE ${type.name} AS (\n${type.fields
          .map((f) => `\t${f.name} ${f.type}`)
          .join("\n")}\n);\n\n${
          type.comment.trim() !== ""
            ? `\nCOMMENT ON TYPE "${type.name}" IS '${type.comment}';\n\n`
            : ""
        }`,
    )
    .join("\n");

  return `${enumStatements}${typeStatements}${diagram.tables
    .map(
      (table) =>
        `CREATE TABLE "${table.name}" (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
                field.name
              }" ${field.type}${field.isArray ? " ARRAY" : ""}${field.notNull ? " NOT NULL" : ""}${field.unique ? " UNIQUE" : ""}${
                field.default.trim() !== ""
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
                .map((f) => `"${f.name}"`)
                .join(", ")})`
            : ""
        }\n);\n${
          table.comment.trim() !== ""
            ? `\nCOMMENT ON TABLE "${table.name}" IS '${table.comment}';\n`
            : ""
        }${table.indices
          .map(
            (i) =>
              `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX "${
                i.name
              }"\nON "${table.name}" (${i.fields
                .map((f) => `"${f}"`)
                .join(", ")});`,
          )
          .join("\n")}\n`,
    )
    .join("\n")}\n${diagram.references
    .map(
      (r) =>
        `ALTER TABLE "${diagram.tables[r.startTableId].name}"\nADD FOREIGN KEY("${
          diagram.tables[r.startTableId].fields[r.startFieldId].name
        }") REFERENCES "${diagram.tables[r.endTableId].name}"("${
          diagram.tables[r.endTableId].fields[r.endFieldId].name
        }")\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`,
    )
    .join("\n")}`;
}
