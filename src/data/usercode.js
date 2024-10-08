import { databases } from "./databases";
import { DB } from "./constants";

export function diagramToDdbFile(diagram) {
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

    let date = lastModified ?? new Date();
    if (typeof lastModified === "number" || typeof lastModified === "string") {
        date = new Date(lastModified)
    }

    return {
        author: "Unnamed",
        title: name,
        date: date.toISOString(),
        tables: tables,
        relationships: references,
        notes: notes,
        subjectAreas: areas,
        database: database,
        ...(databases[database].hasTypes && { types: types }),
        ...(databases[database].hasEnums && { enums: enums }),
    }
}

export function ddbFileToDiagram(ddb) {
    const {
        database = DB.GENERIC,
        title = "Untitled Diagram",
        tables,
        date,
        relationships,
        subjectAreas,
        notes,
        enums,
        types
    } = ddb;

    return {
        database: database,
        name: title,
        lastModified: date ? new Date(date) : new Date(),
        tables: tables,
        references: relationships,
        notes: notes,
        areas: subjectAreas,
        ...(databases[database].hasEnums && { enums: enums }),
        ...(databases[database].hasTypes && { types: types }),
    };
}

export function writeDdbFiles(ddbFiles) {
    const writePromises = ddbFiles.map(ddbFile => {
        return fetch('/api/usercode-files', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: `${ddbFile.title}.ddb`, content: ddbFile })
        });
    })
    return Promise.all(writePromises);
}

export function deleteDdbFiles(ddbFiles) {
    const deletePromises = ddbFiles.map(ddbFile => {
        return fetch(`/api/usercode-files/${ddbFile.title}.ddb`, { method: 'DELETE' });
    });
    return Promise.all(deletePromises);
}