import { DB } from "../data/constants";

function mapDataTypes(fromDb, toDb) {
    if (!fromDb || !toDb) {
        throw new Error("Please provide both from/to database names.");
    }

    fromDb = fromDb.toLowerCase();
    toDb = toDb.toLowerCase();

    if (fromDb === toDb || [fromDb, toDb].includes(DB.GENERIC)) {
        return "";
    }

    const typeMapping = {
        postgresql: {
            mysql: {
                "SMALLINT": "TINYINT",
                "INTEGER": "INT",
                "BIGINT": "BIGINT",
                "SERIAL": "INT AUTO_INCREMENT",
                "BIGSERIAL": "BIGINT AUTO_INCREMENT",
                "DECIMAL": "DECIMAL",
                "NUMERIC": "DECIMAL",
                "REAL": "FLOAT",
                "DOUBLE PRECISION": "DOUBLE",
                "MONEY": "DECIMAL(19,4)",
                "VARCHAR": "VARCHAR",
                "CHAR": "CHAR",
                "TEXT": "TEXT",
                "BYTEA": "BLOB",
                "BOOLEAN": "TINYINT(1)",
                "DATE": "DATE",
                "TIME": "TIME",
                "TIMETZ": "TIME",
                "TIMESTAMP": "DATETIME",
                "TIMESTAMPTZ": "DATETIME",
                "INTERVAL": "TIME",
                "UUID": "CHAR(36)",
                "JSON": "JSON",
                "JSONB": "JSON",
                "XML": "TEXT",
            },
            sqlite: {
                "SMALLINT": "INTEGER",
                "INTEGER": "INTEGER",
                "BIGINT": "INTEGER",
                "SERIAL": "INTEGER PRIMARY KEY AUTOINCREMENT",
                "BIGSERIAL": "INTEGER",
                "DECIMAL": "REAL",
                "NUMERIC": "REAL",
                "REAL": "REAL",
                "DOUBLE PRECISION": "REAL",
                "MONEY": "REAL",
                "VARCHAR": "TEXT",
                "CHAR": "TEXT",
                "TEXT": "TEXT",
                "BYTEA": "BLOB",
                "BOOLEAN": "INTEGER",
                "DATE": "TEXT",
                "TIME": "TEXT",
                "TIMETZ": "TEXT",
                "TIMESTAMP": "TEXT",
                "TIMESTAMPTZ": "TEXT",
                "INTERVAL": "TEXT",
                "UUID": "TEXT",
                "JSON": "TEXT",
                "JSONB": "TEXT",
                "XML": "TEXT",
            },
        },
        mysql: {
            postgresql: {
                "TINYINT": "SMALLINT",
                "SMALLINT": "SMALLINT",
                "MEDIUMINT": "INTEGER",
                "INT": "INTEGER",
                "BIGINT": "BIGINT",
                "FLOAT": "REAL",
                "DOUBLE": "DOUBLE PRECISION",
                "DECIMAL": "DECIMAL",
                "NUMERIC": "NUMERIC",
                "VARCHAR": "VARCHAR",
                "CHAR": "CHAR",
                "TEXT": "TEXT",
                "BLOB": "BYTEA",
                "TINYBLOB": "BYTEA",
                "MEDIUMBLOB": "BYTEA",
                "LONGBLOB": "BYTEA",
                "BIT": "BOOLEAN",
                "BOOLEAN": "BOOLEAN",
                "DATE": "DATE",
                "TIME": "TIME",
                "DATETIME": "TIMESTAMP",
                "TIMESTAMP": "TIMESTAMP",
                "YEAR": "DATE",
                "JSON": "JSON",
                "ENUM": "VARCHAR",
                "SET": "TEXT",
                "POINT": "POINT",
                "LINESTRING": "LINE",
                "POLYGON": "POLYGON"
            },
            sqlite: {
                "TINYINT": "INTEGER",
                "SMALLINT": "INTEGER",
                "MEDIUMINT": "INTEGER",
                "INT": "INTEGER",
                "BIGINT": "INTEGER",
                "FLOAT": "REAL",
                "DOUBLE": "REAL",
                "DECIMAL": "REAL",
                "NUMERIC": "REAL",
                "VARCHAR(n)": "TEXT",
                "CHAR(n)": "TEXT",
                "TEXT": "TEXT",
                "BLOB": "BLOB",
                "TINYBLOB": "BLOB",
                "MEDIUMBLOB": "BLOB",
                "LONGBLOB": "BLOB",
                "BIT": "INTEGER",
                "BOOLEAN": "INTEGER",
                "DATE": "TEXT",
                "TIME": "TEXT",
                "DATETIME": "TEXT",
                "TIMESTAMP": "TEXT",
                "YEAR": "TEXT",
                "JSON": "TEXT",
                "ENUM": "TEXT",
                "SET": "TEXT",
                "POINT": "TEXT",
                "LINESTRING": "TEXT",
                "POLYGON": "TEXT"
            },
        },
        sqlite: {
            postgresql: {
                "INTEGER": "INTEGER",
                "REAL": "DOUBLE PRECISION",
                "TEXT": "TEXT",
                "BLOB": "BYTEA",
                "BOOLEAN": "BOOLEAN",
                "DATE": "DATE",
                "TIME": "TIME",
                "DATETIME": "TIMESTAMP",
                "NUMERIC": "NUMERIC",
                "VARCHAR": "VARCHAR",
                "CHAR": "CHAR",
                "JSON": "JSON",
                "POINT": "POINT",
                "LINESTRING": "LINE",
                "POLYGON": "POLYGON",
            },
            mysql: {
                "INTEGER": "INTEGER",
                "REAL": "DOUBLE",
                "TEXT": "TEXT",
                "BLOB": "BLOB",
                "BOOLEAN": "TINYINT(1)",
                "DATE": "DATE",
                "TIME": "TIME",
                "DATETIME": "DATETIME",
                "NUMERIC": "DECIMAL",
                "VARCHAR": "VARCHAR",
                "CHAR": "CHAR",
                "JSON": "JSON",
                "POINT": "POINT",
                "LINESTRING": "LINESTRING",
                "POLYGON": "POLYGON",
            },
        },
    };

    if (typeMapping[fromDb] && typeMapping[fromDb][toDb]) {
        return typeMapping[fromDb][toDb];
    } else {
        return ''; // Unsupported data type mapping
    }
}

export function convertTableSchema(table, fromDb, toDb) {
    
    return {
        ...table,
        fields: table.fields.map(field => {
            let mappedType = mapDataTypes(fromDb, toDb)?.[field.type];

            // Handle ENUM values if they exist
            if (field.type === "ENUM" && [DB.POSTGRES, DB.SQLITE].includes(toDb)) {
                mappedType = toDb === DB.POSTGRES ? "VARCHAR" : "TEXT";

                if (field.values?.length) {
                    field.check = `${field.name} IN (${field.values.join(", ")})`;
                }
            }

            if (field.type === "VARCHAR" && field.check && DB.MYSQL === toDb) {
                mappedType = `ENUM`;
                const regex = /\(([^)]+)\)/;
                const match = field.check.match(regex);

                if (match) {
                    field.values = match[1].split(',').map(value => value.trim());
                    mappedType += `(${field.values.join(", ")})`;
                }
            }

            if (DB.POSTGRES === toDb && field.increment) {
                mappedType = `SERIAL`;
            }

            return {
                ...field,
                type: mappedType || field.type,
                // Remove MySQL-specific properties if necessary
                values: field.values || undefined
            };
        })
    };
}
