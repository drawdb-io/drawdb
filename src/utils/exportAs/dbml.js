import { Cardinality } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import i18n from "../../i18n/i18n";
import { escapeQuotes } from "../exportSQL/shared";
import { isFunction, isKeyword } from "../utils";

const IDENT_SAFE_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function escapeIdentifier(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function quoteIdentifier(name) {
  if (name == null) return name;
  const s = String(name);
  return IDENT_SAFE_RE.test(s) ? s : `"${escapeIdentifier(s)}"`;
}

function parseDefaultDbml(field, database) {
  if (isFunction(field.default)) {
    return `\`${field.default}\``;
  }

  if (isKeyword(field.default) || !dbToTypes[database][field.type]?.hasQuotes) {
    return field.default;
  }

  return `'${escapeQuotes(field.default)}'`;
}

function columnDefault(field, database) {
  if (!field.default) {
    return "";
  }

  if (typeof field.default === "string" && !field.default.trim()) {
    return "";
  }

  return `default: ${parseDefaultDbml(field, database)}`;
}

function columnSettings(field, database) {
  let constraints = [];

  field.primary && constraints.push("pk");
  field.increment && constraints.push("increment");
  field.notNull && constraints.push("not null");
  field.unique && constraints.push("unique");
  constraints.push(columnDefault(field, database));
  constraints.push(columnComment(field));

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

function processComment(comment) {
  if (comment.includes("\n")) {
    return `'''${comment}'''`;
  }

  return `'${escapeQuotes(comment)}'`;
}

function columnComment(field) {
  if (!field.comment || field.comment.trim() === "") {
    return "";
  }

  return `note: ${processComment(field.comment)}`;
}

function processType(type) {
  // TODO: remove after a while
  if (type.toUpperCase() === "TIMESTAMP WITH TIME ZONE") {
    return "timestamptz";
  }

  return type.toLowerCase();
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

    return `Ref ${quoteIdentifier(rel.name)} {\n\t${quoteIdentifier(startTableName)}.${quoteIdentifier(startFieldName)} ${cardinality(rel)} ${quoteIdentifier(endTableName)}.${quoteIdentifier(endFieldName)} [ delete: ${rel.deleteConstraint.toLowerCase()}, update: ${rel.updateConstraint.toLowerCase()} ]\n}`;
  };

  let enumDefinitions = "";

  for (const table of diagram.tables) {
    for (const field of table.fields) {
      if (
        (field.type === "ENUM" || field.type === "SET") &&
        Array.isArray(field.values)
      ) {
        enumDefinitions += `enum ${quoteIdentifier(`${field.name}_${field.values.join("_")}_t`)} {\n\t${field.values.map((v) => quoteIdentifier(v)).join("\n\t")}\n}\n\n`;
      }
    }
  }

  return `${diagram.enums
    .map(
      (en) =>
        `enum ${quoteIdentifier(en.name)} {\n${en.values.map((v) => `\t${quoteIdentifier(v)}`).join("\n")}\n}\n\n`,
    )
    .join("\n\n")}${enumDefinitions}${diagram.tables
    .map(
      (table) =>
        `Table ${quoteIdentifier(table.name)} [headercolor: ${table.color}] {\n${table.fields
          .map(
            (field) =>
              `\t${quoteIdentifier(field.name)} ${
                field.type === "ENUM" || field.type === "SET"
                  ? quoteIdentifier(`${field.name}_${field.values.join("_")}_t`)
                  : processType(field.type)
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
                    `\t\t(${index.fields
                      .map((f) => quoteIdentifier(f))
                      .join(", ")}) [ name: '${
                      index.name
                    }'${index.unique ? ", unique" : ""} ]`,
                )
                .join("\n") +
              "\n\t}"
            : ""
        }${
          table.comment && table.comment.trim() !== ""
            ? `\n\n\tNote: ${processComment(table.comment)}`
            : ""
        }\n}`,
    )
    .join("\n\n")}\n\n${diagram.relationships
    .map((rel) => generateRelString(rel))
    .join("\n\n")}`;
}
