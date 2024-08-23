import { dbToTypes } from "../../data/datatypes";
import { jsonToMermaid } from "./mermaid";

export function jsonToDocumentation(obj) {

  const documentationSummary = obj.tables
    .map((table) => {
      return `\t- [${table.name}](#${table.name})\n`;
    }).join("");

  const documentationEntities = obj.tables
    .map((table) => {
      const fields = table.fields
        .map((field) => {
          const fieldType =
            field.type +
            ((dbToTypes[obj.database][field.type].isSized ||
              dbToTypes[obj.database][field.type].hasPrecision) &&
            field.size &&
            field.size !== ""
              ? "(" + field.size + ")"
              : "");
          return `| **${field.name}** | ${fieldType} | ${field.primary ? "🔑 PK, " : ""}` +
            `${field.nullable ? "null " : "not null "}${field.unique ? ", unique" : ""}${field.increment?", autoincrement":""}` +
            `${field.default ? `, default: ${field.default}` : ""} | |${field.comment ? field.comment : ""} |`;

        }).join("\n");
      return `### ${table.name}\n${table.comment ? table.comment : ""}\n` +
        `| Name        | Type          | Settings                      | References                    | Note                           |\n` +
        `|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|\n` +
        `${fields}\n\n`;
    }).join("");
  
  const documentationRelationships = obj.relationships?.length
    ? obj.relationships
      .map((r) => {
        console.log(r);
        const startTable = obj.tables[r.startTableId].name;
        const endTable = obj.tables[r.endTableId].name;
        return `- **${startTable} to ${endTable}**: ${r.cardinality} (${r.comment ? r.comment : ""})\n`;
      }).join("") : "";
  
  return `# ${obj.title} Database Documentation\n## Summary\n- [Introduction](#introduction)\n- [Database Type](#database-type)\n`+
          `- [Table Structure](#table-structure)\n${documentationSummary}\n- [Relationships](#relationships)\n- [Database Diagram](#database-Diagram)\n`+
          `## Introduction\n${obj.notes}\n## Database type\n- **Database system:** `+
          `${obj.database.type}\n## Table structure\n\n${documentationEntities}`+
          `\n\n## Relationships\n${documentationRelationships}\n\n`+
          `## Database Diagram\n\`\`\`${jsonToMermaid(obj)}\`\`\``;
}