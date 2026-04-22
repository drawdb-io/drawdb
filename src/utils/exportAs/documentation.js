import { dbToTypes } from "../../data/datatypes";
import { jsonToMermaid } from "./mermaid";
import { databases } from "../../data/databases";

function formatMarkdownTable(headers, rows) {
  const allRows = [headers, ...rows];
  const colWidths = headers.map((_, colIndex) =>
    Math.max(...allRows.map((row) => (row[colIndex] ?? "").length)),
  );

  const pad = (cell, width) => (cell ?? "").padEnd(width);
  const separator = colWidths.map((w) => "-".repeat(w)).join(" | ");
  const headerRow = headers.map((h, i) => pad(h, colWidths[i])).join(" | ");
  const dataRows = rows
    .map((row) => `| ${row.map((cell, i) => pad(cell, colWidths[i])).join(" | ")} |`)
    .join("\n");

  return `| ${headerRow} |\n| ${separator} |\n${dataRows}`;
}

export function jsonToDocumentation(obj) {
  const documentationSummary = obj.tables
    .map((table) => {
      return `\t- [${table.name}](#${table.name.toLowerCase()})`;
    })
    .join("\n");

  const documentationEntities = obj.tables
    .map((table) => {
      let enums = "";

      const fieldRows = table.fields.map((field) => {
        const fieldType =
          field.type +
          ((dbToTypes[obj.database][field.type].isSized ||
            dbToTypes[obj.database][field.type].hasPrecision) &&
          field.size &&
          field.size !== ""
            ? "(" + field.size + ")"
            : "");

        enums +=
          field.type === "ENUM" && field.values && field.values.length > 0
            ? `##### ${field.name}\n\n${field.values.map((v) => `- ${v}`).join("\n")}\n`
            : "";

        const settings =
          `${field.primary ? "🔑 PK, " : ""}` +
          `${field.notNull ? "not null" : "null"}` +
          `${field.unique ? ", unique" : ""}` +
          `${field.increment ? ", autoincrement" : ""}` +
          `${field.default ? `, default: ${field.default}` : ""}`;

        const references = relationshipByField(
          table.id,
          obj.relationships,
          field.id,
        ).join(", ");

        return [`**${field.name}**`, fieldType, settings, references, field.comment ?? ""];
      });

      const fieldsTable = formatMarkdownTable(
        ["Name", "Type", "Settings", "References", "Note"],
        fieldRows,
      );

      let indexesSection = "";
      if (table.indices.length > 0) {
        const indexRows = table.indices.map((index) => [
          index.name,
          index.unique ? "✅" : "",
          index.fields.join(", "),
        ]);
        indexesSection =
          "\n#### Indexes\n" +
          formatMarkdownTable(["Name", "Unique", "Fields"], indexRows);
      }

      return (
        `### ${table.name}\n${table.comment ? table.comment : ""}\n` +
        `${fieldsTable} \n${enums.length > 0 ? "\n#### Enums\n" + enums : ""}\n` +
        indexesSection
      );
    })
    .join("\n");

  function relationshipByField(table, relationships, fieldId) {
    return relationships
      .filter((r) => r.startTableId === table && r.startFieldId === fieldId)
      .map((rel) => rel.name);
  }

  const documentationRelationships = obj.relationships?.length
    ? obj.relationships
        .map((r) => {
          const startTable = obj.tables.find(
            (t) => t.id === r.startTableId,
          ).name;
          const endTable = obj.tables.find((t) => t.id === r.endTableId).name;
          return `- **${startTable} to ${endTable}**: ${r.cardinality}\n`;
        })
        .join("")
    : "";

  const documentationTypes =
    databases[obj.database].hasTypes && obj.types.length > 0
      ? obj.types
          .map((type) => {
            const rows = [[type.name, type.fields.map((f) => f.name).join(", "), type.comment ?? ""]];
            return formatMarkdownTable(["Name", "Fields", "Note"], rows);
          })
          .join("\n")
      : "";

  return (
    `# ${obj.title} documentation\n## Summary\n\n- [Introduction](#introduction)\n- [Database Type](#database-type)\n` +
    `- [Table Structure](#table-structure)\n${documentationSummary}\n- [Relationships](#relationships)\n- [Database Diagram](#database-diagram)\n\n` +
    `## Introduction\n\n## Database type\n\n- **Database system:** ` +
    `${databases[obj.database].name}\n## Table structure\n\n${documentationEntities}` +
    `\n## Relationships\n\n${documentationRelationships}\n` +
    `${databases[obj.database].hasTypes && obj.types.length > 0 ? `## Types\n\n` + documentationTypes + `\n\n` : ""}` +
    `## Database Diagram\n\n\`\`\`mermaid\n${jsonToMermaid(obj)}\n\`\`\``
  );
}
