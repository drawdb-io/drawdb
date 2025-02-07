import { parseDefault } from "./shared";

export function toOracle(diagram) {
  return `${diagram.tables
    .map(
      (table) =>
        `CREATE TABLE ${table.name} (\n${table.fields
          .map(
            (field) =>
              `\t"${field.name}" ${field.type}${field.size ? `(${field.size})` : ""}${
                field.default !== "" ? ` DEFAULT ${parseDefault(field, diagram.database)}` : ""
              }${field.notNull ? " NOT NULL" : ""}`
          )
          .join(",\n")}${
          table.fields.filter((f) => f.unique && !f.primary).length > 0
            ? `,\n\t${table.fields
                .filter((f) => f.unique && !f.primary)
                .map((f) => `CONSTRAINT ${table.name}_${f.name}_uk UNIQUE("${f.name}")`)
                .join(",\n\t")}`
            : ""
        }${
          table.fields.filter((f) => f.check).length > 0
            ? `,\n\t${table.fields
                .filter((f) => f.check)
                .map((f) => `CONSTRAINT ${table.name}_${f.name}_chk CHECK("${f.name}" ${f.check})`)
                .join(",\n\t")}`
            : ""
        }${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tCONSTRAINT ${table.name}_pk PRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `"${f.name}"`)
                .join(", ")})`
            : ""
        }\n);\n${table.comment ? `COMMENT ON TABLE ${table.name} IS '${table.comment}';` : ""}${table.fields
          .map(
            (field) =>
              field.comment ? `\nCOMMENT ON COLUMN "${table.name}"."${field.name}" IS '${field.comment}';` : ""
          )
          .join("")}\n${table.indices
          .map(
            (i) =>
              `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX "${i.name}" ON ${table.name} (${i.fields
                .map((f) => `"${f}"`)
                .join(", ")});`
          )
          .join("")}`
    )
    .join("\n")}\n${diagram.references
      .map(
        (r) => {
          const deleteConstraint = r.deleteConstraint && ['CASCADE', 'SET NULL'].includes(r.deleteConstraint.toUpperCase()) 
            ? ` ON DELETE ${r.deleteConstraint.toUpperCase()}` 
            : '';
          return `ALTER TABLE ${diagram.tables[r.startTableId].name} ADD CONSTRAINT ${diagram.tables[r.startTableId].name}_${diagram.tables[r.startTableId].fields[r.startFieldId].name}_fk\nFOREIGN KEY("${diagram.tables[r.startTableId].fields[r.startFieldId].name}") REFERENCES ${diagram.tables[r.endTableId].name}("${diagram.tables[r.endTableId].fields[r.endFieldId].name}")${deleteConstraint};`
        }
      )
      .join("\n")}`;
}
