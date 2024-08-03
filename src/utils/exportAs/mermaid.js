import { dbToTypes } from "../../data/datatypes";

export function jsonToMermaid(obj) {
  function getMermaidRelationship(relationship) {
    switch (relationship) {
      case "One to one":
        return "||--||";
      case "One to many":
        return "||--o{";
      case "Many to one":
        return "}o--||";
      default:
        return "--";
    }
  }

  const mermaidEntities = obj.tables
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
          return `\t\t${fieldType} ${field.name}`;
        })
        .join("\n");
      return `\t${table.name} {\n${fields}\n\t}`;
    })
    .join("\n\n");

  const mermaidRelationships = obj.relationships?.length
    ? obj.relationships
        .map((r) => {
          const startTable = obj.tables[r.startTableId].name;
          const endTable = obj.tables[r.endTableId].name;
          return `\t${startTable} ${getMermaidRelationship(r.cardinality)} ${endTable} : references`;
        })
        .join("\n")
    : "";

  return `erDiagram\n${mermaidRelationships ? `${mermaidRelationships}\n\n` : ""}${mermaidEntities}`;
}
