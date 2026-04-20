import { dbToTypes } from "../../data/datatypes";
import { parseDefault, resolveFKDirection } from "./shared";

export function toOracleSQL(diagram) {
  return `${diagram.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/* ${table.comment} */\n`
        }CREATE TABLE "${table.name}" (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
                field.name
              }" ${field.type}${
                field.size !== undefined && field.size !== ""
                  ? "(" + field.size + ")"
                  : ""
              }${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " GENERATED ALWAYS AS IDENTITY" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== ""
                  ? ` DEFAULT ${parseDefault(field, diagram.database)}`
                  : ""
              }${
                field.check === "" ||
                !dbToTypes[diagram.database][field.type].hasCheck
                  ? ""
                  : ` CHECK(${field.check})`
              }${field.comment ? ` -- ${field.comment}` : ""}`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `"${f.name}"`)
                .join(", ")})`
            : ""
        }\n)${table.comment ? ` -- ${table.comment}` : ""};\n${`\n${table.indices
          .map(
            (i) =>
              `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX "${i.name}"\nON "${table.name}" (${i.fields
                .map((f) => `"${f}"`)
                .join(", ")});`,
          )
          .join("")}`}`,
    )
    .join("\n")}\n${diagram.references
    .map((r) => {
      const { fkTableId, fkFieldId, refTableId, refFieldId } = resolveFKDirection(r);
      const { name: fkName, fields: fkFields } = diagram.tables.find(
        (t) => t.id === fkTableId,
      );
      const { name: refName, fields: refFields } = diagram.tables.find(
        (t) => t.id === refTableId,
      );
      return `ALTER TABLE "${fkName}"\nADD CONSTRAINT "${r.name}" FOREIGN KEY ("${
        fkFields.find((f) => f.id === fkFieldId).name
      }") REFERENCES "${refName}" ("${
        refFields.find((f) => f.id === refFieldId).name
      }")\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`;
    })
    .join("\n")}`;
}
