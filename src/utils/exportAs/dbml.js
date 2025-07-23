import { Cardinality } from "../../data/constants";
import { parseDefault } from "../exportSQL/shared";

function hasColumnSettings(field) {
  return (
    field.primary ||
    field.notNull ||
    field.increment ||
    field.unique ||
    (field.comment && field.comment.trim() != "") ||
    (field.default && field.default.trim() != "")
  );
}

function columnDefault(field, database) {
  if (!field.default || field.default.trim() === "") {
    return "";
  }

  return `default: ${parseDefault(field, database)}`;
}

function columnComment(field) {
  if (!field.comment || field.comment.trim() === "") {
    return "";
  }

  return `note: '${field.comment}'`;
}

function columnSettings(field, database) {
  if (!hasColumnSettings(field)) {
    return "";
  }

  return ` [ ${field.primary ? "pk " : ""}${
    field.increment ? "increment " : ""
  }${field.notNull ? "not null " : ""}${
    field.unique ? "unique " : ""
  }${columnDefault(field, database)}${columnComment(field, database)}]`;
}

function cardinality(rel) {
  switch (rel.cardinality) {
    case Cardinality.ONE_TO_ONE:
      return "-";
    case Cardinality.ONE_TO_MANY:
      return "<";
    case Cardinality.MANY_TO_ONE:
      return ">";
  }
}

export function toDBML(diagram) {
  return `${diagram.enums
    .map(
      (en) =>
        `enum ${en.name} {\n${en.values.map((v) => `\t${v}`).join("\n")}\n}\n\n`,
    )
    .join("\n\n")}${diagram.tables
    .map(
      (table) =>
        `Table ${table.name} {\n${table.fields
          .map(
            (field) =>
              `\t${field.name} ${field.type.toLowerCase()}${columnSettings(
                field,
                diagram.database,
              )}`,
          )
          .join("\n")}${
          table.indices.length > 0
            ? "\n\n\tindexes {\n" +
              table.indices
                .map(
                  (index) =>
                    `\t\t(${index.fields.join(", ")}) [ name: '${
                      index.name
                    }'${index.unique ? " unique" : ""} ]`,
                )
                .join("\n") +
              "\n\t}"
            : ""
        }${
          table.comment && table.comment.trim() !== ""
            ? `\n\n\tNote: '${table.comment}'`
            : ""
        }\n}`,
    )
    .join("\n\n")}\n\n${diagram.relationships
    .map(
      (rel) =>
        `Ref ${rel.name} {\n\t${
          diagram.tables[rel.startTableId].name
        }.${diagram.tables[rel.startTableId].fields[rel.startFieldId].name} ${cardinality(
          rel,
        )} ${diagram.tables[rel.endTableId].name}.${
          diagram.tables[rel.endTableId].fields[rel.endFieldId].name
        } [ delete: ${rel.deleteConstraint.toLowerCase()}, on update: ${rel.updateConstraint.toLowerCase()} ]\n}`,
    )
    .join("\n\n")}`;
}
