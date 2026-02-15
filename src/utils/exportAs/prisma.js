import { Cardinality } from "../../data/constants";

const prismaTypeMap = {
    INT: "Int",
    INTEGER: "Int",
    SMALLINT: "Int",
    TINYINT: "Int",
    MEDIUMINT: "Int",
    BIGINT: "BigInt",
    DECIMAL: "Decimal",
    NUMERIC: "Decimal",
    FLOAT: "Float",
    DOUBLE: "Float",
    REAL: "Float",
    CHAR: "String",
    VARCHAR: "String",
    VARCHAR2: "String",
    TEXT: "String",
    TINYTEXT: "String",
    MEDIUMTEXT: "String",
    LONGTEXT: "String",
    BOOLEAN: "Boolean",
    BOOL: "Boolean",
    BIT: "Boolean",
    DATE: "DateTime",
    DATETIME: "DateTime",
    TIMESTAMP: "DateTime",
    TIME: "DateTime",
    JSON: "Json",
    BINARY: "Bytes",
    VARBINARY: "Bytes",
    BLOB: "Bytes",
    TINYBLOB: "Bytes",
    MEDIUMBLOB: "Bytes",
    LONGBLOB: "Bytes",
    UUID: "String",
};

const IDENT_SAFE_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

function sanitize(name) {
    if (IDENT_SAFE_RE.test(name)) return name;
    return name.replace(/[^A-Za-z0-9_]/g, "_");
}

function formatDefault(field) {
    if (!field.default) return "";

    const def = field.default;
    const type = getPrismaType(field.type);

    if (field.increment) {
        return "@default(autoincrement())";
    }

    if (
        def.toLowerCase() === "now()" ||
        def.toLowerCase() === "current_timestamp"
    ) {
        return "@default(now())";
    }
    if (def.toLowerCase().includes("uuid")) {
        return "@default(uuid())";
    }
    if (def.toLowerCase() === "cuid()") {
        return "@default(cuid())";
    }

    if (type === "Boolean") {
        if (def === "1" || def.toLowerCase() === "true") return "@default(true)";
        if (def === "0" || def.toLowerCase() === "false") return "@default(false)";
    }

    if (
        type === "Int" ||
        type === "BigInt" ||
        type === "Float" ||
        type === "Decimal"
    ) {
        if (!isNaN(def)) return `@default(${def})`;
    }

    if (type === "String") {
        const isQuoted =
            (def.startsWith('"') && def.endsWith('"')) ||
            (def.startsWith("'") && def.endsWith("'"));
        if (isQuoted) return `@default(${def})`;
        return `@default("${def}")`;
    }

    return "";
}

function getPrismaType(type) {
    return prismaTypeMap[type.toUpperCase()] || "String";
}

export function toPrisma(diagram) {
    let output = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

    for (const en of diagram.enums) {
        output += `\nenum ${sanitize(en.name)} {\n`;
        en.values.forEach((val) => {
            output += `  ${val}\n`;
        });
        output += "}\n";
    }

    const tableRelations = {};

    diagram.tables.forEach((t) => {
        tableRelations[t.id] = [];
    });

    diagram.relationships.forEach((rel) => {
        const startTable = diagram.tables.find((t) => t.id === rel.startTableId);
        const endTable = diagram.tables.find((t) => t.id === rel.endTableId);
        const startField = startTable.fields.find((f) => f.id === rel.startFieldId);
        const endField = endTable.fields.find((f) => f.id === rel.endFieldId);

        if (!startTable || !endTable || !startField || !endField) return;

        if (rel.cardinality === Cardinality.ONE_TO_MANY) {
            const startRelName = sanitize(endTable.name).toLowerCase() + "s";
            tableRelations[startTable.id].push({
                line: `  ${startRelName} ${sanitize(endTable.name)}[]`,
            });

            const endRelName = sanitize(startTable.name).toLowerCase();
            let finalEndRelName = endRelName;
            if (endTable.fields.some((f) => sanitize(f.name) === finalEndRelName)) {
                finalEndRelName += "_rel";
            }

            tableRelations[endTable.id].push({
                line: `  ${finalEndRelName} ${sanitize(startTable.name)} @relation(fields: [${sanitize(endField.name)}], references: [${sanitize(startField.name)}])`,
            });
        } else if (rel.cardinality === Cardinality.MANY_TO_ONE) {
            const endRelName = sanitize(startTable.name).toLowerCase() + "s";
            tableRelations[endTable.id].push({
                line: `  ${endRelName} ${sanitize(startTable.name)}[]`,
            });

            const startRelName = sanitize(endTable.name).toLowerCase();
            let finalStartRelName = startRelName;
            if (
                startTable.fields.some((f) => sanitize(f.name) === finalStartRelName)
            ) {
                finalStartRelName += "_rel";
            }

            tableRelations[startTable.id].push({
                line: `  ${finalStartRelName} ${sanitize(endTable.name)} @relation(fields: [${sanitize(startField.name)}], references: [${sanitize(endField.name)}])`,
            });
        } else if (rel.cardinality === Cardinality.ONE_TO_ONE) {
            const startRelName = sanitize(endTable.name).toLowerCase();
            tableRelations[startTable.id].push({
                line: `  ${startRelName} ${sanitize(endTable.name)}?`,
            });

            const endRelName = sanitize(startTable.name).toLowerCase();
            let finalEndRelName = endRelName;
            if (endTable.fields.some((f) => sanitize(f.name) === finalEndRelName)) {
                finalEndRelName = endRelName + "_rel";
            }

            tableRelations[endTable.id].push({
                line: `  ${finalEndRelName} ${sanitize(startTable.name)} @relation(fields: [${sanitize(endField.name)}], references: [${sanitize(startField.name)}])`,
            });
        }
    });

    for (const table of diagram.tables) {
        output += `\nmodel ${sanitize(table.name)} {\n`;

        for (const field of table.fields) {
            let line = `  ${sanitize(field.name)} `;

            const isEnum = diagram.enums.find((e) => e.name === field.type);
            if (isEnum) {
                line += sanitize(field.type);
            } else {
                line += getPrismaType(field.type);
            }

            if (!field.notNull) {
                line += "?";
            }

            if (field.primary) {
                line += " @id";
            }

            if (field.unique) {
                line += " @unique";
            }

            if (field.default || field.increment) {
                line += " " + formatDefault(field);
            }

            if (sanitize(field.name) !== field.name) {
                line += ` @map("${field.name}")`;
            }

            output += line + "\n";
        }

        if (tableRelations[table.id]) {
            tableRelations[table.id].forEach((r) => {
                output += r.line + "\n";
            });
        }

        if (sanitize(table.name) !== table.name) {
            output += `\n  @@map("${table.name}")`;
        }

        output += "}\n";
    }

    return output;
}
