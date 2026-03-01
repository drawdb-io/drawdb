import { nanoid } from "nanoid";
import { Cardinality, Constraint, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import {
  extractDefaultValue,
  getTableName,
  getTypeName,
  getTypeSize,
  getCustomTypeArgs,
  getIndexColumnName,
  mapReferentialAction,
} from "./shared";

const affinity = {
  [DB.ORACLESQL]: new Proxy(
    {
      INT: "INTEGER",
      NUMERIC: "NUMBER",
      DECIMAL: "NUMBER",
      CHARACTER: "CHAR",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INTEGER: "INT",
      MEDIUMINT: "INTEGER",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
};

export function fromOracleSQL(ast, diagramDb = DB.GENERIC) {
  const tables = [];
  const relationships = [];
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
        // Handle Custom types (Oracle-specific like NUMBER, VARCHAR2)
        if (col.data_type?.Custom) {
          const customName = getTableName(col.data_type.Custom[0]);
          type = customName.toUpperCase();
        }
        if (!dbToTypes[diagramDb][type]) {
          type = affinity[diagramDb][type];
        }
        field.type = type;

        field.comment = "";
        field.check = "";
        field.default = "";
        field.unique = false;
        field.increment = false;
        field.notNull = false;
        field.primary = false;

        // Handle size from standard types
        const size = getTypeSize(col.data_type);
        if (size) {
          field.size = size.scale
            ? `${size.length},${size.scale}`
            : `${size.length}`;
        }
        // Handle Custom type args for size (e.g. NUMBER(10,2), VARCHAR2(100))
        const customArgs = getCustomTypeArgs(col.data_type);
        if (customArgs && customArgs.length > 0) {
          field.size = customArgs.join(",");
        }

        col.options.forEach((opt) => {
          const o = opt.option;
          if (o === "NotNull") field.notNull = true;
          if (o.PrimaryKey) field.primary = true;
          if (o.Unique) field.unique = true;
          if (o.Identity || o === "AutoIncrement") field.increment = true;
          if (o.Default) field.default = extractDefaultValue(o.Default);
        });

        table.fields.push(field);
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
          relationship.id = nanoid();
          relationship.startTableId = table.id;
          relationship.startFieldId = startField.id;
          relationship.endTableId = endTable.id;
          relationship.endFieldId = endField.id;
          relationship.updateConstraint = Constraint.NONE;
          relationship.name = fk.name?.value
            ? fk.name.value
            : `fk_${table.name}_${startFieldName}_${endTableName}`;
          relationship.deleteConstraint = fk.on_delete
            ? mapReferentialAction(fk.on_delete)
            : Constraint.NONE;

          if (startField.unique) {
            relationship.cardinality = Cardinality.ONE_TO_ONE;
          } else {
            relationship.cardinality = Cardinality.MANY_TO_ONE;
          }

          relationships.push(relationship);
        }
      });

      tables.push(table);
    }
  };

  ast.forEach((stmt) => parseSingleStatement(stmt));

  return { tables, relationships, enums };
}
