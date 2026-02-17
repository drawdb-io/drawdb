import { nanoid } from "nanoid";
import { Cardinality, Constraint, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import {
  buildSQLFromAST,
  extractDefaultValue,
  getTableName,
  getTypeName,
  getTypeSize,
  getIndexColumnName,
  mapReferentialAction,
} from "./shared";

const affinity = {
  [DB.POSTGRES]: new Proxy(
    { INT: "INTEGER" },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INTEGER: "INT",
      MEDIUMINT: "INTEGER",
      BIT: "BOOLEAN",
      "CHARACTER VARYING": "VARCHAR",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
};

export function fromPostgres(ast, diagramDb = DB.GENERIC) {
  const tables = [];
  const relationships = [];
  const types = [];
  const enums = [];

  const parseSingleStatement = (stmt) => {
    if (stmt.CreateTable) {
      const ct = stmt.CreateTable;
      const table = {};
      table.name = getTableName(ct.name);
      table.comment = "";
      table.color = "#175e7a";
      table.fields = [];
      table.indices = [];
      table.id = nanoid();

      ct.columns.forEach((col) => {
        const field = {};
        field.id = nanoid();
        field.name = col.name.value;

        let type = getTypeName(col.data_type);

        const matchedType = types.find((t) =>
          new RegExp(`^(${t.name}|"${t.name}")$`).test(type),
        )?.name;
        const matchedEnum = enums.find((t) =>
          new RegExp(`^(${t.name}|"${t.name}")$`).test(type),
        )?.name;

        if (matchedType) {
          type = matchedType;
        } else if (matchedEnum) {
          type = matchedEnum;
        } else {
          // Handle Custom types (user-defined or dialect-specific like SERIAL)
          if (col.data_type?.Custom) {
            const customName = getTableName(col.data_type.Custom[0]);
            const knownType = types.find((t) => t.name === customName)?.name;
            const knownEnum = enums.find((t) => t.name === customName)?.name;
            if (knownType) {
              type = knownType;
            } else if (knownEnum) {
              type = knownEnum;
            } else {
              type = customName.toUpperCase();
            }
          } else {
            type = type.toUpperCase();
            if (dbToTypes[diagramDb][type]) {
              type = dbToTypes[diagramDb][type].type || type;
            } else {
              type = affinity[diagramDb][type];
            }
          }
        }

        field.type = type;

        if (col.data_type?.Enum) {
          const [variants] = col.data_type.Enum;
          field.values = variants.map((v) => v.Name || v.value || v);
        }

        field.comment = "";
        field.unique = false;
        field.increment = false;
        field.notNull = false;
        field.primary = false;
        field.default = "";
        field.check = "";

        const size = getTypeSize(col.data_type);
        if (size) {
          field.size = size.scale
            ? `${size.length},${size.scale}`
            : `${size.length}`;
        }

        let inlineFk = null;

        col.options.forEach((opt) => {
          const o = opt.option;
          if (o === "NotNull") field.notNull = true;
          if (o === "Null") field.notNull = false;
          if (o.PrimaryKey) field.primary = true;
          if (o.Unique) field.unique = true;
          if (o === "AutoIncrement" || o.Identity) field.increment = true;
          if (o.Default) field.default = extractDefaultValue(o.Default);
          if (o.Check)
            field.check = buildSQLFromAST(o.Check.expr, DB.POSTGRES);
          if (o.Comment !== undefined && typeof o.Comment === "string")
            field.comment = o.Comment;
          if (o.ForeignKey) {
            inlineFk = o.ForeignKey;
          }
        });

        table.fields.push(field);

        if (inlineFk) {
          const endTableName = getTableName(inlineFk.foreign_table);
          const endFieldName = inlineFk.referred_columns[0]?.value;

          const endTable = tables.find((t) => t.name === endTableName);
          if (!endTable) return;
          const endField = endTable.fields.find(
            (f) => f.name === endFieldName,
          );
          if (!endField) return;

          const relationship = {};
          relationship.name = `fk_${table.name}_${field.name}_${endTableName}`;
          relationship.startTableId = table.id;
          relationship.startFieldId = field.id;
          relationship.endTableId = endTable.id;
          relationship.endFieldId = endField.id;
          relationship.updateConstraint = mapReferentialAction(
            inlineFk.on_update,
          );
          relationship.deleteConstraint = mapReferentialAction(
            inlineFk.on_delete,
          );
          relationship.id = nanoid();

          if (field.unique) {
            relationship.cardinality = Cardinality.ONE_TO_ONE;
          } else {
            relationship.cardinality = Cardinality.MANY_TO_ONE;
          }

          relationships.push(relationship);
        }
      });

      ct.constraints.forEach((c) => {
        if (c.PrimaryKey) {
          c.PrimaryKey.columns.forEach((pk) => {
            const colName = getIndexColumnName(pk);
            table.fields.forEach((f) => {
              if (f.name === colName && !f.primary) {
                f.primary = true;
              }
            });
          });
        } else if (c.ForeignKey) {
          const fk = c.ForeignKey;
          const startFieldName = fk.columns[0]?.value;
          const endTableName = getTableName(fk.foreign_table);
          const endFieldName = fk.referred_columns[0]?.value;

          const endTable = tables.find((t) => t.name === endTableName);
          if (!endTable) return;
          const endField = endTable.fields.find(
            (f) => f.name === endFieldName,
          );
          if (!endField) return;
          const startField = table.fields.find(
            (f) => f.name === startFieldName,
          );
          if (!startField) return;

          const relationship = {};
          relationship.name = `fk_${table.name}_${startFieldName}_${endTableName}`;
          relationship.startTableId = table.id;
          relationship.endTableId = endTable.id;
          relationship.endFieldId = endField.id;
          relationship.startFieldId = startField.id;
          relationship.id = nanoid();
          relationship.updateConstraint = mapReferentialAction(fk.on_update);
          relationship.deleteConstraint = mapReferentialAction(fk.on_delete);

          if (startField.unique) {
            relationship.cardinality = Cardinality.ONE_TO_ONE;
          } else {
            relationship.cardinality = Cardinality.MANY_TO_ONE;
          }

          relationships.push(relationship);
        }
      });

      tables.push(table);
    } else if (stmt.CreateIndex) {
      const ci = stmt.CreateIndex;
      const tableName = getTableName(ci.table_name);
      const indexName = ci.name ? getTableName(ci.name) : "";
      const index = {
        name: indexName,
        unique: ci.unique,
        fields: ci.columns.map((c) => getIndexColumnName(c)),
      };

      const table = tables.find((t) => t.name === tableName);
      if (table) {
        table.indices.push(index);
        table.indices.forEach((i, j) => {
          i.id = j;
        });
      }
    } else if (stmt.CreateType) {
      const ct = stmt.CreateType;
      const name = getTableName(ct.name);

      if (ct.representation?.Enum) {
        const newEnum = {
          name,
          values: ct.representation.Enum.labels.map(
            (l) => l.value || l.Name || l,
          ),
        };
        enums.push(newEnum);
      } else if (ct.representation?.Composite) {
        const type = {
          name,
          fields: [],
        };
        ct.representation.Composite.attributes.forEach((attr) => {
          const field = {};
          field.name = attr.name.value;
          let typeName = getTypeName(attr.data_type);
          if (!dbToTypes[diagramDb][typeName]) {
            typeName = affinity[diagramDb][typeName];
          }
          field.type = typeName;

          const size = getTypeSize(attr.data_type);
          if (size) {
            field.size = size.scale
              ? `${size.length},${size.scale}`
              : `${size.length}`;
          }

          type.fields.push(field);
        });
        types.push(type);
      }
    } else if (stmt.AlterTable) {
      const at = stmt.AlterTable;
      const startTableName = getTableName(at.name);

      at.operations.forEach((op) => {
        if (op.AddConstraint?.constraint?.ForeignKey) {
          const fk = op.AddConstraint.constraint.ForeignKey;
          const startFieldName = fk.columns[0]?.value;
          const endTableName = getTableName(fk.foreign_table);
          const endFieldName = fk.referred_columns[0]?.value;

          const startTable = tables.find((t) => t.name === startTableName);
          if (!startTable) return;
          const endTable = tables.find((t) => t.name === endTableName);
          if (!endTable) return;
          const endField = endTable.fields.find(
            (f) => f.name === endFieldName,
          );
          if (!endField) return;
          const startField = startTable.fields.find(
            (f) => f.name === startFieldName,
          );
          if (!startField) return;

          const relationship = {};
          relationship.name = `fk_${startTableName}_${startFieldName}_${endTableName}`;
          relationship.startTableId = startTable.id;
          relationship.startFieldId = startField.id;
          relationship.endTableId = endTable.id;
          relationship.endFieldId = endField.id;
          relationship.updateConstraint = mapReferentialAction(fk.on_update);
          relationship.deleteConstraint = mapReferentialAction(fk.on_delete);
          relationship.cardinality = Cardinality.ONE_TO_ONE;
          relationship.id = nanoid();

          if (startField.unique) {
            relationship.cardinality = Cardinality.ONE_TO_ONE;
          } else {
            relationship.cardinality = Cardinality.MANY_TO_ONE;
          }

          relationships.push(relationship);
        }
      });
    } else if (stmt.Comment) {
      const c = stmt.Comment;
      if (c.object_type === "Table") {
        const tableName = getTableName(c.object_name);
        const table = tables.find((t) => t.name === tableName);
        if (table) {
          table.comment = c.comment || "";
        }
      } else if (c.object_type === "Column") {
        const tableName =
          c.object_name.length >= 2
            ? c.object_name[c.object_name.length - 2]?.Identifier?.value
            : "";
        const colName =
          c.object_name[c.object_name.length - 1]?.Identifier?.value;
        const table = tables.find((t) => t.name === tableName);
        if (table) {
          const field = table.fields.find((f) => f.name === colName);
          if (field) {
            field.comment = c.comment || "";
          }
        }
      }
    }
  };

  ast.forEach((stmt) => parseSingleStatement(stmt));

  return { tables, relationships, types, enums };
}
