import { dbToTypes } from "../../data/datatypes";
import { parseDefault } from "./shared";

export function toPostgres(diagram) {
  return `${diagram.types.map((type) => {
    const typeStatements = type.fields
      .filter((f) => f.type === "ENUM" || f.type === "SET")
      .map(
        (f) =>
          `CREATE TYPE "${f.name}_t" AS ENUM (${f.values
            .map((v) => `'${v}'`)
            .join(", ")});\n`,
      );
    if (typeStatements.length > 0) {
      return (
        typeStatements.join("") +
        `${
          type.comment === "" ? "" : `/**\n${type.comment}\n*/\n`
        }CREATE TYPE ${type.name} AS (\n${type.fields
          .map((f) => `\t${f.name} ${f.type}`)
          .join("\n")}\n);`
      );
    } else {
      return `${
        type.comment === "" ? "" : `/**\n${type.comment}\n*/\n`
      }CREATE TYPE ${type.name} AS (\n${type.fields
        .map((f) => `\t${f.name} ${f.type}`)
        .join("\n")}\n);`;
    }
  })}\n${diagram.tables
    .map(
      (table) =>
        `${table.comment === "" ? "" : `/**\n${table.comment}\n*/\n`}${
          table.fields.filter((f) => f.type === "ENUM" || f.type === "SET")
            .length > 0
            ? `${table.fields
                .filter((f) => f.type === "ENUM" || f.type === "SET")
                .map(
                  (f) =>
                    `CREATE TYPE "${f.name}_t" AS ENUM (${f.values
                      .map((v) => `'${v}'`)
                      .join(", ")});\n\n`,
                )}`
            : ""
        }CREATE TABLE "${table.name}" (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
                field.name
              }" ${field.type}${field.notNull ? " NOT NULL" : ""}${
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
                .map((f) => `"${f.name}"`)
                .join(", ")})`
            : ""
        }\n);\n${
          table.indices.length > 0
            ? `${table.indices.map(
                (i) =>
                  `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX "${
                    i.name
                  }"\nON "${table.name}" (${i.fields
                    .map((f) => `"${f}"`)
                    .join(", ")});`,
              )}`
            : ""
        }`,
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
