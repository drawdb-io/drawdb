import { nanoid } from "nanoid";
import { Cardinality, DB } from "../../data/constants";
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
  [DB.MSSQL]: new Proxy(
    { INT: "INTEGER" },
    { get: (target, prop) => (prop in target ? target[prop] : "TEXT") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INTEGER: "INT",
      TINYINT: "SMALLINT",
      MEDIUMINT: "INTEGER",
      BIT: "BOOLEAN",
      DATETIME2: "DATETIME",
      MONEY: "NUMERIC",
      SMALLMONEY: "NUMERIC",
      NCHAR: "CHAR",
      NVARCHAR: "VARCHAR",
      NTEXT: "TEXT",
      IMAGE: "BLOB",
      XML: "BLOB",
      DATETIMEOFFSET: "TEXT",
      SQL_VARIANT: "TEXT",
      UNIQUEIDENTIFIER: "UUID",
      SMALLDATETIME: "DATETIME",
      CURSOR: "BLOB",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "TEXT") },
  ),
};

export function fromMSSQL(ast, diagramDb = DB.GENERIC) {
  const tables = [];
  const relationships = [];

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
        // Handle Custom types for MSSQL-specific types
        if (col.data_type?.Custom) {
          const customName = getTableName(col.data_type.Custom[0]);
          type = customName.toUpperCase();
        }
        if (!dbToTypes[diagramDb][type]) {
          type = affinity[diagramDb][type];
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
        // Handle Custom type args for size (e.g. NVARCHAR(100))
        if (col.data_type?.Custom) {
          const [, args] = col.data_type.Custom;
          if (args && args.length > 0) {
            field.size = args.join(",");
          }
        }

        col.options.forEach((opt) => {
          const o = opt.option;
          if (o === "NotNull") field.notNull = true;
          if (o === "Null") field.notNull = false;
          if (o.PrimaryKey) field.primary = true;
          if (o.Unique) field.unique = true;
          if (o.Identity) field.increment = true;
          if (o === "AutoIncrement") field.increment = true;
          if (o.Default) field.default = extractDefaultValue(o.Default);
          if (o.Check) field.check = buildSQLFromAST(o.Check.expr, DB.MSSQL);
          if (o.Comment !== undefined && typeof o.Comment === "string")
            field.comment = o.Comment;
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
          relationship.id = nanoid();

          if (startField.unique) {
            relationship.cardinality = Cardinality.ONE_TO_ONE;
          } else {
            relationship.cardinality = Cardinality.MANY_TO_ONE;
          }

          relationships.push(relationship);
        }
      });
    }
  };

  ast.forEach((stmt) => parseSingleStatement(stmt));

  return { tables, relationships };
}
