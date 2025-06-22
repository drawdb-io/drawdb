import { Cardinality } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import i18n from "../../i18n/i18n";
import { escapeQuotes, parseDefault } from "../exportSQL/shared";

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

  return `note: '${escapeQuotes(field.comment)}'`;
}

function columnSettings(field, database) {
  let constraints = [];

  field.primary && constraints.push("pk");
  field.increment && constraints.push("increment");
  field.notNull && constraints.push("not null");
  field.unique && constraints.push("unique");
  constraints.push(columnDefault(field, database));
  constraints.push(columnComment(field, database));

  constraints = constraints.filter((x) => Boolean(x));

  if (!constraints.length) {
    return "";
  }

  return ` [ ${constraints.join(", ")} ]`;
}

function cardinality(rel) {
  switch (rel.cardinality) {
    case i18n.t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      return "-";
    case i18n.t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      return "<";
    case i18n.t(Cardinality.MANY_TO_ONE):
    case Cardinality.MANY_TO_ONE:
      return ">";
  }
}

function fieldSize(field, database) {
  const typeMetadata = dbToTypes[database][field.type];

  if ((typeMetadata?.isSized || typeMetadata?.hasPrecision) && field.size)
    return `(${field.size})`;

  return "";
}

export function toDBML(diagram) {
  const generateRelString = (rel) => {
    const { fields: startTableFields, name: startTableName } =
      diagram.tables.find((t) => t.id === rel.startTableId);
    const { name: startFieldName } = startTableFields.find(
      (f) => f.id === rel.startFieldId,
    );
    const { fields: endTableFields, name: endTableName } = diagram.tables.find(
      (t) => t.id === rel.endTableId,
    );
    const { name: endFieldName } = endTableFields.find(
      (f) => f.id === rel.endFieldId,
    );

    return `Ref ${rel.name} {\n\t${startTableName}.${startFieldName} ${cardinality(rel)} ${endTableName}.${endFieldName} [ delete: ${rel.deleteConstraint.toLowerCase()}, update: ${rel.updateConstraint.toLowerCase()} ]\n}`;
  };

  let enumDefinitions = "";

  for (const table of diagram.tables) {
    for (const field of table.fields) {
      if (
        (field.type === "ENUM" || field.type === "SET") &&
        Array.isArray(field.values)
      ) {
        enumDefinitions += `enum ${field.name}_${field.values.join("_")}_t {\n\t${field.values.join("\n\t")}\n}\n\n`;
      }
    }
  }

  return `${diagram.enums
    .map(
      (en) =>
        `enum ${en.name} {\n${en.values.map((v) => `\t${v}`).join("\n")}\n}\n\n`,
    )
    .join("\n\n")}${enumDefinitions}${diagram.tables
    .map(
      (table) =>
        `Table ${table.name} {\n${table.fields
          .map(
            (field) =>
              `\t${field.name} ${
                field.type === "ENUM" || field.type === "SET"
                  ? `${field.name}_${field.values.join("_")}_t`
                  : field.type.toLowerCase()
              }${fieldSize(
                field,
                diagram.database,
              )}${columnSettings(field, diagram.database)}`,
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
            ? `\n\n\tNote: '${escapeQuotes(table.comment)}'`
            : ""
        }\n}`,
    )
    .join("\n\n")}\n\n${diagram.relationships
    .map((rel) => generateRelString(rel))
    .join("\n\n")}`;
}
