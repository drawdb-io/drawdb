import { dbToTypes, defaultTypes } from "../../data/datatypes";
import { parseDefault } from "./shared";

export function getJsonType(f) {
  if (!Object.keys(defaultTypes).includes(f.type)) {
    return '{ "type" : "object", additionalProperties : true }';
  }
  switch (f.type) {
    case "INT":
    case "SMALLINT":
    case "BIGINT":
    case "DECIMAL":
    case "NUMERIC":
    case "REAL":
    case "FLOAT":
      return '{ "type" : "number" }';
    case "BOOLEAN":
      return '{ "type" : "boolean" }';
    case "JSON":
      return '{ "type" : "object", "additionalProperties" : true }';
    case "ENUM":
      return `{\n\t\t\t\t\t"type" : "string",\n\t\t\t\t\t"enum" : [${f.values
        .map((v) => `"${v}"`)
        .join(", ")}]\n\t\t\t\t}`;
    case "SET":
      return `{\n\t\t\t\t\t"type": "array",\n\t\t\t\t\t"items": {\n\t\t\t\t\t\t"type": "string",\n\t\t\t\t\t\t"enum": [${f.values
        .map((v) => `"${v}"`)
        .join(", ")}]\n\t\t\t\t\t}\n\t\t\t\t}`;
    default:
      return '{ "type" : "string"}';
  }
}

export function generateSchema(type) {
  return `{\n\t\t\t"$schema": "http://json-schema.org/draft-04/schema#",\n\t\t\t"type": "object",\n\t\t\t"properties": {\n\t\t\t\t${type.fields
    .map((f) => `"${f.name}" : ${getJsonType(f)}`)
    .join(
      ",\n\t\t\t\t",
    )}\n\t\t\t},\n\t\t\t"additionalProperties": false\n\t\t}`;
}

export function getTypeString(
  field,
  currentDb,
  dbms = "mysql",
  baseType = false,
) {
  if (dbms === "mysql") {
    if (field.type === "UUID") {
      return `VARCHAR(36)`;
    }
    if (
      dbToTypes[currentDb][field.type].isSized ||
      dbToTypes[currentDb][field.type].hasPrecision
    ) {
      return `${field.type}${field.size ? `(${field.size})` : ""}`;
    }
    if (field.type === "SET" || field.type === "ENUM") {
      return `${field.type}(${field.values.map((v) => `"${v}"`).join(", ")})`;
    }
    if (!Object.keys(defaultTypes).includes(field.type)) {
      return "JSON";
    }
    return field.type;
  } else if (dbms === "postgres") {
    if (field.type === "SMALLINT" && field.increment) {
      return "smallserial";
    }
    if (field.type === "INT" && field.increment) {
      return "serial";
    }
    if (field.type === "BIGINT" && field.increment) {
      return "bigserial";
    }
    if (field.type === "ENUM") {
      return `${field.name}_t`;
    }
    if (field.type === "SET") {
      return `${field.name}_t[]`;
    }
    if (field.type === "TIMESTAMP") {
      return "TIMESTAMPTZ";
    }
    if (field.type === "DATETIME") {
      return `timestamp`;
    }
    if (dbToTypes[currentDb][field.type].isSized) {
      const type =
        field.type === "BINARY"
          ? "bit"
          : field.type === "VARBINARY"
            ? "bit varying"
            : field.type.toLowerCase();
      return `${type}(${field.size})`;
    }
    if (dbToTypes[currentDb][field.type].hasPrecision && field.size !== "") {
      return `${field.type}${field.size}`;
    }
    return field.type.toLowerCase();
  } else if (dbms === "mssql") {
    let type = field.type;
    switch (field.type) {
      case "ENUM":
        return baseType
          ? "NVARCHAR(255)"
          : `NVARCHAR(255) CHECK([${field.name}] in (${field.values
              .map((v) => `'${v}'`)
              .join(", ")}))`;
      case "VARCHAR":
        type = `NVARCHAR`;
        break;
      case "UUID":
        type = "UNIQUEIDENTIFIER";
        break;
      case "DOUBLE":
        type = "FLOAT";
        break;
      case "BOOLEAN":
        return "BIT";
      case "SET":
        return "NVARCHAR(255)";
      case "BLOB":
        return "VARBINARY(MAX)";
      case "JSON":
        return "NVARCHAR(MAX)";
      case "TEXT":
        return "TEXT";
      default:
        type = field.type;
        break;
    }
    if (dbToTypes[currentDb][field.type].isSized) {
      return `${type}(${field.size})`;
    }

    return type;
  }
}

export function jsonToMySQL(obj) {
  return `${obj.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/* ${table.comment} */\n`
        }CREATE TABLE \`${table.name}\` (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t\`${
                field.name
              }\` ${getTypeString(field, obj.database)}${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " AUTO_INCREMENT" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== ""
                  ? ` DEFAULT ${parseDefault(field, obj.database)}`
                  : ""
              }${
                field.check === "" ||
                !dbToTypes[obj.database][field.type].hasCheck
                  ? !Object.keys(defaultTypes).includes(field.type)
                    ? ` CHECK(\n\t\tJSON_SCHEMA_VALID("${generateSchema(
                        obj.types.find(
                          (t) => t.name === field.type.toLowerCase(),
                        ),
                      )}", \`${field.name}\`))`
                    : ""
                  : ` CHECK(${field.check})`
              }${field.comment ? ` COMMENT '${field.comment}'` : ""}`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `\`${f.name}\``)
                .join(", ")})`
            : ""
        }\n)${table.comment ? ` COMMENT='${table.comment}'` : ""};\n${`\n${table.indices
          .map(
            (i) =>
              `CREATE ${i.unique ? "UNIQUE " : ""}INDEX \`${i.name}\`\nON \`${table.name}\` (${i.fields
                .map((f) => `\`${f}\``)
                .join(", ")});`,
          )
          .join("\n")}`}`,
    )
    .join("\n")}\n${obj.references
    .map(
      (r) =>
        `ALTER TABLE \`${
          obj.tables[r.startTableId].name
        }\`\nADD FOREIGN KEY(\`${
          obj.tables[r.startTableId].fields[r.startFieldId].name
        }\`) REFERENCES \`${obj.tables[r.endTableId].name}\`(\`${
          obj.tables[r.endTableId].fields[r.endFieldId].name
        }\`)\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`,
    )
    .join("\n")}`;
}

export function jsonToPostgreSQL(obj) {
  return `${obj.types.map((type) => {
    const typeStatements = type.fields
      .filter((f) => f.type === "ENUM" || f.type === "SET")
      .map(
        (f) =>
          `CREATE TYPE "${f.name}_t" AS ENUM (${f.values
            .map((v) => `'${v}'`)
            .join(", ")});\n`,
      );
    if (typeStatements.length > 0) {
      return (
        typeStatements.join("") +
        `${
          type.comment === "" ? "" : `/**\n${type.comment}\n*/\n`
        }CREATE TYPE ${type.name} AS (\n${type.fields
          .map(
            (f) => `\t${f.name} ${getTypeString(f, obj.database, "postgres")}`,
          )
          .join("\n")}\n);`
      );
    } else {
      return `${
        type.comment === "" ? "" : `/**\n${type.comment}\n*/\n`
      }CREATE TYPE ${type.name} AS (\n${type.fields
        .map((f) => `\t${f.name} ${getTypeString(f, obj.database, "postgres")}`)
        .join("\n")}\n);`;
    }
  })}\n${obj.tables
    .map(
      (table) =>
        `${table.comment === "" ? "" : `/**\n${table.comment}\n*/\n`}${
          table.fields.filter((f) => f.type === "ENUM" || f.type === "SET")
            .length > 0
            ? `${table.fields
                .filter((f) => f.type === "ENUM" || f.type === "SET")
                .map(
                  (f) =>
                    `CREATE TYPE "${f.name}_t" AS ENUM (${f.values
                      .map((v) => `'${v}'`)
                      .join(", ")});\n\n`,
                )}`
            : ""
        }CREATE TABLE "${table.name}" (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
                field.name
              }" ${getTypeString(field, obj.database, "postgres")}${
                field.notNull ? " NOT NULL" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== "" ? ` DEFAULT ${parseDefault(field)}` : ""
              }${
                field.check === "" ||
                !dbToTypes[obj.database][field.type].hasCheck
                  ? ""
                  : ` CHECK(${field.check})`
              }`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `"${f.name}"`)
                .join(", ")})`
            : ""
        }\n);\n${table.indices
          .map(
            (i) =>
              `CREATE ${i.unique ? "UNIQUE " : ""}INDEX "${
                i.name
              }"\nON "${table.name}" (${i.fields
                .map((f) => `"${f}"`)
                .join(", ")});`,
          )
          .join("\n")}`,
    )
    .join("\n")}\n${obj.references
    .map(
      (r) =>
        `ALTER TABLE "${obj.tables[r.startTableId].name}"\nADD FOREIGN KEY("${
          obj.tables[r.startTableId].fields[r.startFieldId].name
        }") REFERENCES "${obj.tables[r.endTableId].name}"("${
          obj.tables[r.endTableId].fields[r.endFieldId].name
        }")\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`,
    )
    .join("\n")}`;
}

export function getSQLiteType(field) {
  switch (field.type) {
    case "INT":
    case "SMALLINT":
    case "BIGINT":
    case "BOOLEAN":
      return "INTEGER";
    case "DECIMAL":
    case "NUMERIC":
    case "FLOAT":
    case "DOUBLE":
    case "REAL":
      return "REAL";
    case "CHAR":
    case "VARCHAR":
    case "UUID":
    case "TEXT":
    case "DATE":
    case "TIME":
    case "TIMESTAMP":
    case "DATETIME":
    case "BINARY":
    case "VARBINARY":
      return "TEXT";
    case "ENUM":
      return `TEXT CHECK("${field.name}" in (${field.values
        .map((v) => `'${v}'`)
        .join(", ")}))`;
    default:
      return "BLOB";
  }
}

export function getInlineFK(table, obj) {
  let fk = "";
  obj.references.forEach((r) => {
    if (fk !== "") return;
    if (r.startTableId === table.id) {
      fk = `FOREIGN KEY ("${table.fields[r.startFieldId].name}") REFERENCES "${
        obj.tables[r.endTableId].name
      }"("${
        obj.tables[r.endTableId].fields[r.endFieldId].name
      }")\n\tON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()}`;
    }
  });
  return fk;
}

export function jsonToSQLite(obj) {
  return obj.tables
    .map((table) => {
      const inlineFK = getInlineFK(table, obj);
      return `${
        table.comment === "" ? "" : `/* ${table.comment} */\n`
      }CREATE TABLE IF NOT EXISTS "${table.name}" (\n${table.fields
        .map(
          (field) =>
            `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
              field.name
            }" ${getSQLiteType(field)}${field.notNull ? " NOT NULL" : ""}${
              field.unique ? " UNIQUE" : ""
            }${field.default !== "" ? ` DEFAULT ${parseDefault(field, obj.database)}` : ""}${
              field.check === "" ||
              !dbToTypes[obj.database][field.type].hasCheck
                ? ""
                : ` CHECK(${field.check})`
            }`,
        )
        .join(",\n")}${
        table.fields.filter((f) => f.primary).length > 0
          ? `,\n\tPRIMARY KEY(${table.fields
              .filter((f) => f.primary)
              .map((f) => `"${f.name}"`)
              .join(", ")})${inlineFK !== "" ? ",\n" : ""}`
          : ""
      }\t${inlineFK}\n);\n${table.indices
        .map(
          (i) =>
            `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX IF NOT EXISTS "${
              i.name
            }"\nON "${table.name}" (${i.fields
              .map((f) => `"${f}"`)
              .join(", ")});`,
        )
        .join("\n")}`;
    })
    .join("\n");
}

export function jsonToMariaDB(obj) {
  return `${obj.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/* ${table.comment} */\n`
        }CREATE OR REPLACE TABLE \`${table.name}\` (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t\`${
                field.name
              }\` ${getTypeString(field, obj.database)}${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " AUTO_INCREMENT" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== ""
                  ? ` DEFAULT ${parseDefault(field, obj.database)}`
                  : ""
              }${
                field.check === "" ||
                !dbToTypes[obj.database][field.type].hasCheck
                  ? !Object.keys(defaultTypes).includes(field.type)
                    ? ` CHECK(\n\t\tJSON_SCHEMA_VALID('${generateSchema(
                        obj.types.find(
                          (t) => t.name === field.type.toLowerCase(),
                        ),
                      )}', \`${field.name}\`))`
                    : ""
                  : ` CHECK(${field.check})`
              }`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `\`${f.name}\``)
                .join(", ")})`
            : ""
        }\n);${`\n${table.indices
          .map(
            (i) =>
              `CREATE ${i.unique ? "UNIQUE " : ""}INDEX \`${
                i.name
              }\`\nON \`${table.name}\` (${i.fields
                .map((f) => `\`${f}\``)
                .join(", ")});`,
          )
          .join("\n")}`}`,
    )
    .join("\n")}\n${obj.references
    .map(
      (r) =>
        `ALTER TABLE \`${
          obj.tables[r.startTableId].name
        }\`\nADD FOREIGN KEY(\`${
          obj.tables[r.startTableId].fields[r.startFieldId].name
        }\`) REFERENCES \`${obj.tables[r.endTableId].name}\`(\`${
          obj.tables[r.endTableId].fields[r.endFieldId].name
        }\`)\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`,
    )
    .join("\n")}`;
}

export function jsonToSQLServer(obj) {
  return `${obj.types
    .map((type) => {
      return `${
        type.comment === "" ? "" : `/**\n${type.comment}\n*/\n`
      }CREATE TYPE [${type.name}] FROM ${
        type.fields.length < 0
          ? ""
          : `${getTypeString(type.fields[0], obj.database, "mssql", true)}`
      };\nGO\n`;
    })
    .join("\n")}\n${obj.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/**\n${table.comment}\n*/\n`
        }CREATE TABLE [${table.name}] (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t[${
                field.name
              }] ${getTypeString(field, obj.database, "mssql")}${
                field.notNull ? " NOT NULL" : ""
              }${field.increment ? " IDENTITY" : ""}${
                field.unique ? " UNIQUE" : ""
              }${
                field.default !== ""
                  ? ` DEFAULT ${parseDefault(field, obj.database)}`
                  : ""
              }${
                field.check === "" ||
                !dbToTypes[obj.database][field.type].hasCheck
                  ? ""
                  : ` CHECK(${field.check})`
              }`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `[${f.name}]`)
                .join(", ")})`
            : ""
        }\n);\nGO\n${table.indices
          .map(
            (i) =>
              `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX [${
                i.name
              }]\nON [${table.name}] (${i.fields
                .map((f) => `[${f}]`)
                .join(", ")});\nGO\n`,
          )
          .join("")}`,
    )
    .join("\n")}\n${obj.references
    .map(
      (r) =>
        `ALTER TABLE [${obj.tables[r.startTableId].name}]\nADD FOREIGN KEY([${
          obj.tables[r.startTableId].fields[r.startFieldId].name
        }]) REFERENCES [${obj.tables[r.endTableId].name}]([${
          obj.tables[r.endTableId].fields[r.endFieldId].name
        }])\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};\nGO`,
    )
    .join("\n")}`;
}
