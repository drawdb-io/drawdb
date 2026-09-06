import { dbToTypes } from "../../data/datatypes";
import { buildViewSQL, resolveViewColumns } from "../views";
import { jsonToMermaid } from "./mermaid";
import { databases } from "../../data/databases";
import { getRelationshipFields } from "../utils";

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
          formatMarkdownTable(["Name", "Unique", "Columns"], indexRows);
      }

      let uniqueConstraintsSection = "";
      if ((table.uniqueConstraints || []).length > 0) {
        const ucRows = table.uniqueConstraints.map((uc) => [
          uc.name,
          uc.fields.join(", "),
        ]);
        uniqueConstraintsSection =
          "\n#### Unique constraints\n" +
          formatMarkdownTable(["Name", "Columns"], ucRows);
      }

      return (
        `### ${table.name}\n${table.comment ? table.comment : ""}\n` +
        `${fieldsTable} \n${enums.length > 0 ? "\n#### Enums\n" + enums : ""}\n` +
        indexesSection +
        uniqueConstraintsSection
      );
    })
    .join("\n");

  function relationshipByField(table, relationships, fieldId) {
    return relationships
      .filter(
        (r) =>
          r.startTableId === table &&
          getRelationshipFields(r).some((p) => p.startFieldId === fieldId),
      )
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
            return formatMarkdownTable(["Name", "Columns", "Note"], rows);
          })
          .join("\n")
      : "";

  const views = obj.views ?? [];
  const documentationViews = views.length
    ? views
        .map((view) => {
          const columns = resolveViewColumns(view, obj.tables);
          const columnsTable = columns.length
            ? formatMarkdownTable(
                ["Name", "Type", "Source"],
                columns.map((c) => [c.name, c.type ?? "", c.source ?? ""]),
              )
            : "";
          const sql = buildViewSQL(view, obj.tables, obj.database);
          return (
            `### ${view.name}${view.materialized ? " (materialized)" : ""}\n\n` +
            `${view.comment ? `${view.comment}\n\n` : ""}` +
            `${columnsTable}${columnsTable ? "\n" : ""}` +
            `${sql ? `\`\`\`sql\n${sql}\n\`\`\`\n` : ""}`
          );
        })
        .join("\n")
    : "";

  return (
    `# ${obj.title} documentation\n## Summary\n\n- [Introduction](#introduction)\n- [Database Type](#database-type)\n` +
    `- [Table Structure](#table-structure)\n${documentationSummary}\n- [Relationships](#relationships)\n${views.length > 0 ? `- [Views](#views)\n` : ""}- [Database Diagram](#database-diagram)\n\n` +
    `## Introduction\n\n## Database type\n\n- **Database system:** ` +
    `${databases[obj.database].name}\n## Table structure\n\n${documentationEntities}` +
    `\n## Relationships\n\n${documentationRelationships}\n` +
    `${databases[obj.database].hasTypes && obj.types.length > 0 ? `## Types\n\n` + documentationTypes + `\n\n` : ""}` +
    `${views.length > 0 ? `## Views\n\n` + documentationViews + `\n` : ""}` +
    `## Database Diagram\n\n\`\`\`mermaid\n${jsonToMermaid(obj)}\n\`\`\``
  );
}
