import { databases } from "../data/databases";

export function diagramToDrawDbFile(diagram) {
    const { 
        name,
        lastModified,
        tables,
        references,
        notes,
        areas,
        database,
        types,
        enums
    } = diagram;

    return {
        author: "Unnamed",
        title: name,
        date: lastModified.toISOString(),
        tables: tables,
        relationships: references,
        notes: notes,
        subjectAreas: areas,
        database: database,
        ...(databases[database].hasTypes && { types: types }),
        ...(databases[database].hasEnums && { enums: enums }),
      }
}