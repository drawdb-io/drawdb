import { dbToTypes } from "../../data/datatypes";
import { jsonToMermaid } from "./mermaid";
import { databases } from "../../data/databases";

export function jsonToDocumentation(obj) {

  const documentationSummary = obj.tables
    .map((table) => {
      return `\t- [${table.name}](#${table.name})`;
    }).join("\n");

  const documentationEntities = obj.tables
    .map((table) => {
      let enums = "";
      let indexes = table.indices.length > 0 ? table.indices.map((index) => {
        return `| ${index.name} | ${index.unique ? "✅" : ""} | ${index.fields.join(", ")} |`;
      }).join("\n") : "";
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
          enums += (field.type === "ENUM" && field.values && field.values.length > 0) ?
            `##### ${field.name}\n\n${field.values.map((index) => `- ${index}`).join("\n")}\n` : "";
          return `| **${field.name}** | ${fieldType} | ${field.primary ? "🔑 PK, " : ""}` +
            `${field.nullable ? "null " : "not null "}${field.unique ? ", unique" : ""}${field.increment?", autoincrement":""}` +
            `${field.default ? `, default: ${field.default}` : ""} | ` +
            `${relationshipByField(table.id, obj.relationships, field.id)}` +
            ` |${field.comment ? field.comment : ""} |`;
        }).join("\n");
      return `### ${table.name}\n${table.comment ? table.comment : ""}\n` +
        `| Name        | Type          | Settings                      | References                    | Note                           |\n` +
        `|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|\n` +
        `${fields} \n${enums.length > 0 ? "\n#### Enums\n" + enums : ""}\n` +
        `${indexes.length > 0 ? "\n#### Indexes\n| Name | Unique | Fields |\n|------|--------|--------|\n" + indexes : ""}`;
    }).join("\n");
  
  function relationshipByField(table, relationships, fieldId) {
    return relationships.filter(r => r.startTableId === table && r.startFieldId === fieldId)
              .map((rel) => rel.name);

  }
  
  const documentationRelationships = obj.relationships?.length
    ? obj.relationships
      .map((r) => {
        const startTable = obj.tables[r.startTableId].name;
        const endTable = obj.tables[r.endTableId].name;
        return `- **${startTable} to ${endTable}**: ${r.cardinality}\n`;
      }).join("") : "";
  
  const documentationTypes = databases[obj.database].hasTypes && obj.types.length > 0 ? obj.types.map((type) => {
    return `| Name        | fields        | Note                           |\n` +
           `|-------------|---------------|--------------------------------|\n` +
           `| ${type.name} | ${type.fields.map((field) => field.name).join(", ")} | ${type.comment ? type.comment : ""} |`;
  }).join("\n") : "";
  
  return `# ${obj.title} documentation\n## Summary\n\n- [Introduction](#introduction)\n- [Database Type](#database-type)\n`+
          `- [Table Structure](#table-structure)\n${documentationSummary}\n- [Relationships](#relationships)\n- [Database Diagram](#database-Diagram)\n\n`+
          `## Introduction\n\n## Database type\n\n- **Database system:** `+
          `${databases[obj.database].name}\n## Table structure\n\n${documentationEntities}`+
          `\n## Relationships\n\n${documentationRelationships}\n` +
          `${databases[obj.database].hasTypes && obj.types.length > 0 ? `## Types\n\n` + documentationTypes + `\n\n` : "" }` +
          `## Database Diagram\n\n\`\`\`mermaid\n${jsonToMermaid(obj)}\n\`\`\``;
}