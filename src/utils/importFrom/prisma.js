import { nanoid } from "nanoid";
import { Cardinality, Constraint, DB } from "../../data/constants";
import { arrangeTables } from "../arrangeTables";

/*
  Minimal Prisma schema parser (Beta):
  Supports parsing:
    - model blocks -> tables & fields
    - @@id([...]) and @id for primary keys
    - @unique
    - @default(value)
    - enums -> enums
    - relations via @relation(fields: [fk], references: [id])
  Limitations:
    - Ignores datasources & generators
    - Does not parse composite types or views
    - Limited cardinality inference (ONE_TO_MANY if fk field lists a single id, ONE_TO_ONE otherwise)
*/

const MODEL_BLOCK_REGEX = /model\s+(\w+)\s+{([\s\S]*?)}/g;
const ENUM_BLOCK_REGEX = /enum\s+(\w+)\s+{([\s\S]*?)}/g;

function parseFieldLine(line) {
  const cleaned = line.split("//")[0].trim();
  if (!cleaned) return null;
  if (cleaned.startsWith("@@")) return { kind: "directive", raw: cleaned };
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return null;
  const name = parts[0];
  const type = parts[1];
  const attributes = parts.slice(2).join(" ");
  return { kind: "field", name, type, attributes, raw: cleaned };
}

function extractDefault(attributes) {
  const match = attributes.match(/@default\(([^)]*)\)/);
  return match ? match[1].trim() : "";
}

function hasAttr(attributes, attr) {
  return attributes.includes(`@${attr}`);
}

function parseRelation(attributes) {
  const relMatch = attributes.match(/@relation\(([^)]*)\)/);
  if (!relMatch) return null;
  const inside = relMatch[1];
  const fieldsMatch = inside.match(/fields:\s*\[([^\]]+)\]/);
  const refsMatch = inside.match(/references:\s*\[([^\]]+)\]/);
  const nameMatch = inside.match(/name:\s*"([^"]+)"/);
  return {
    name: nameMatch ? nameMatch[1] : null,
    fields: fieldsMatch ? fieldsMatch[1].split(/\s*,\s*/) : [],
    references: refsMatch ? refsMatch[1].split(/\s*,\s*/) : [],
  };
}

export function fromPrisma(src) {
  if (typeof src !== "string") throw new Error("Source must be a string");

  const tables = [];
  const enums = [];
  const relationships = [];


  let database;
  const dsMatch = src.match(/datasource\s+\w+\s*{([\s\S]*?)}/);
  if (dsMatch) {
    const body = dsMatch[1];
    const provider = (body.match(/provider\s*=\s*"([^"]+)"/) || [])[1];
    if (provider) {
      const map = {
        postgresql: DB.POSTGRES,
        postgres: DB.POSTGRES,
        mysql: DB.MYSQL,
        mariadb: DB.MARIADB,
        sqlite: DB.SQLITE,
        sqlserver: DB.MSSQL,
        cockroachdb: DB.POSTGRES,
      };
      if (provider === "mongodb") {
        throw new Error("MongoDB provider is not supported for SQL diagrams.");
      }
      database = map[provider];
    }
  }

  // Parse enums
  for (const enumMatch of src.matchAll(ENUM_BLOCK_REGEX)) {
    const [, enumName, enumBody] = enumMatch;
    const values = enumBody
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//"));
    if (values.length) {
      enums.push({ name: enumName, values });
    }
  }

  // Model parsing
  for (const modelMatch of src.matchAll(MODEL_BLOCK_REGEX)) {
    const [, modelName, body] = modelMatch;
    const lines = body.split(/\n+/);
    const parsedTable = {
      id: nanoid(),
      name: modelName,
      comment: "",
      color: "#175e7a",
      fields: [],
      indices: [],
    };

    const directives = [];
    for (const line of lines) {
      const fieldLine = parseFieldLine(line);
      if (!fieldLine) continue;
      if (fieldLine.kind === "directive") {
        directives.push(fieldLine.raw);
        continue;
      }
      let { name, type, attributes } = fieldLine;
      const isList = /\[\]/.test(type);
      type = type.replace(/\[\]/, "");
      const field = {
        id: nanoid(),
        name,
        type: type.toUpperCase(),
        default: extractDefault(attributes),
        check: "",
        primary: hasAttr(attributes, "id"),
        unique: hasAttr(attributes, "unique") || hasAttr(attributes, "id"),
        notNull: !/\?/.test(fieldLine.type),
        increment: attributes.includes("autoincrement"),
        comment: "",
      };
      parsedTable.fields.push(field);

      const relation = parseRelation(attributes);
      if (relation && relation.fields.length && relation.references.length) {
        field._relationMeta = {
          relation,
          isList,
          targetModel: type,
        };
      }
    }

    const idDirective = directives.find((d) => /@@id\(/.test(d));
    if (idDirective) {
      const fieldsSection = idDirective.match(/@@id\(([^)]*)\)/);
      if (fieldsSection) {
        const compositeFields = fieldsSection[1]
          .replace(/\[|\]/g, "")
          .split(/\s*,\s*/)
          .filter((x) => x);
        parsedTable.fields = parsedTable.fields.map((f) => ({
          ...f,
          primary: compositeFields.includes(f.name) || f.primary,
          unique: compositeFields.includes(f.name) || f.unique,
        }));
      }
    }

    tables.push(parsedTable);
  }

  for (const table of tables) {
    for (const field of table.fields) {
      if (!field._relationMeta) continue;
      const { relation, targetModel, isList } = field._relationMeta;
      const targetTable = tables.find((t) => t.name === targetModel);
      if (!targetTable) continue;
      const fkFieldName = relation.fields[0];
      const refFieldName = relation.references[0];
      const fkField = table.fields.find((f) => f.name === fkFieldName);
      const refField = targetTable.fields.find((f) => f.name === refFieldName);
      if (!fkField || !refField) continue;

      const relationship = {
        id: nanoid(),
        name: relation.name || `fk_${table.name}_${fkFieldName}_${targetTable.name}`,
        startTableId: table.id,
        endTableId: targetTable.id,
        startFieldId: fkField.id,
        endFieldId: refField.id,
        updateConstraint: Constraint.NONE,
        deleteConstraint: Constraint.NONE,
        cardinality: isList ? Cardinality.ONE_TO_MANY : Cardinality.MANY_TO_ONE,
      };
      relationships.push(relationship);
    }
  }

  const diagram = { tables, enums, relationships, ...(database && { database }) };
  arrangeTables(diagram);
  return diagram;
}
