import { Cardinality, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import { buildSQLFromAST } from "./shared";

const affinity = {
  [DB.MSSQL]: new Proxy(
    { INT: "INTEGER" },
    { get: (target, prop) => (prop in target ? target[prop] : "TEXT") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INT: "INTEGER",
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

  const parseSingleStatement = (e) => {
    if (e.type === "create") {
      if (e.keyword === "table") {
        const table = {};
        table.name = e.table[0].table;
        table.comment = "";
        table.color = "#175e7a";
        table.fields = [];
        table.indices = [];
        table.id = tables.length;
        e.create_definitions.forEach((d) => {
          if (d.resource === "column") {
            const field = {};
            field.name = d.column.column;

            let type = d.definition.dataType;
            if (!dbToTypes[diagramDb][type]) {
              type = affinity[diagramDb][type];
            }
            field.type = type;

            if (d.definition.expr && d.definition.expr.type === "expr_list") {
              field.values = d.definition.expr.value.map((v) => v.value);
            }
            field.comment = "";
            field.unique = false;
            if (d.unique) field.unique = true;
            field.increment = false;
            if (d.auto_increment) field.increment = true;
            field.notNull = false;
            if (d.nullable) field.notNull = true;
            field.primary = false;
            if (d.primary_key) field.primary = true;
            field.default = "";
            if (d.default_val) {
              let defaultValue = "";
              if (d.default_val.value.type === "function") {
                defaultValue = d.default_val.value.name.name[0].value;
                if (d.default_val.value.args) {
                  defaultValue +=
                    "(" +
                    d.default_val.value.args.value
                      .map((v) => {
                        if (
                          v.type === "single_quote_string" ||
                          v.type === "double_quote_string"
                        )
                          return "'" + v.value + "'";
                        return v.value;
                      })
                      .join(", ") +
                    ")";
                }
              } else if (d.default_val.value.type === "null") {
                defaultValue = "NULL";
              } else {
                defaultValue = d.default_val.value.value.toString();
              }
              field.default = defaultValue;
            }
            if (d.definition["length"]) {
              if (d.definition.scale) {
                field.size = d.definition["length"] + "," + d.definition.scale;
              } else {
                field.size = d.definition["length"];
              }
            }
            field.check = "";
            if (d.check) {
              field.check = buildSQLFromAST(d.check.definition[0], DB.MSSQL);
            }

            table.fields.push(field);
          } else if (d.resource === "constraint") {
            if (d.constraint_type === "primary key") {
              d.definition.forEach((c) => {
                table.fields.forEach((f) => {
                  if (f.name === c.column && !f.primary) {
                    f.primary = true;
                  }
                });
              });
            } else if (d.constraint_type === "FOREIGN KEY") {
              const relationship = {};
              const startTableId = table.id;
              const startTable = e.table[0].table;
              const startField = d.definition[0].column;
              const endTable = d.reference_definition.table[0].table;
              const endField = d.reference_definition.definition[0].column;

              const endTableId = tables.findIndex((t) => t.name === endTable);
              if (endTableId === -1) return;

              const endFieldId = tables[endTableId].fields.findIndex(
                (f) => f.name === endField,
              );
              if (endField === -1) return;

              const startFieldId = table.fields.findIndex(
                (f) => f.name === startField,
              );
              if (startFieldId === -1) return;

              relationship.name = startTable + "_" + startField + "_fk";
              relationship.startTableId = startTableId;
              relationship.endTableId = endTableId;
              relationship.endFieldId = endFieldId;
              relationship.startFieldId = startFieldId;
              let updateConstraint = "No action";
              let deleteConstraint = "No action";
              d.reference_definition.on_action.forEach((c) => {
                if (c.type === "on update") {
                  updateConstraint = c.value.value;
                  updateConstraint =
                    updateConstraint[0].toUpperCase() +
                    updateConstraint.substring(1);
                } else if (c.type === "on delete") {
                  deleteConstraint = c.value.value;
                  deleteConstraint =
                    deleteConstraint[0].toUpperCase() +
                    deleteConstraint.substring(1);
                }
              });

              relationship.updateConstraint = updateConstraint;
              relationship.deleteConstraint = deleteConstraint;
              relationship.cardinality = Cardinality.ONE_TO_ONE;
              relationships.push(relationship);
            }
          }
        });
        table.fields.forEach((f, j) => {
          f.id = j;
        });
        tables.push(table);
      } else if (e.keyword === "index") {
        const index = {};
        index.name = e.index;
        index.unique = false;
        if (e.index_type === "unique") index.unique = true;
        index.fields = [];
        e.index_columns.forEach((f) => index.fields.push(f.column));

        let found = -1;
        tables.forEach((t, i) => {
          if (found !== -1) return;
          if (t.name === e.table.table) {
            t.indices.push(index);
            found = i;
          }
        });

        if (found !== -1) tables[found].indices.forEach((i, j) => (i.id = j));
      }
    } else if (e.type === "alter") {
      e.expr.forEach((expr) => {
        if (
          expr.action === "add" &&
          expr.create_definitions.constraint_type === "FOREIGN KEY"
        ) {
          const relationship = {};
          const startTable = e.table[0].table;
          const startField = expr.create_definitions.definition[0].column;
          const endTable =
            expr.create_definitions.reference_definition.table[0].table;
          const endField =
            expr.create_definitions.reference_definition.definition[0].column;
          let updateConstraint = "No action";
          let deleteConstraint = "No action";
          expr.create_definitions.reference_definition.on_action.forEach(
            (c) => {
              if (c.type === "on update") {
                updateConstraint = c.value.value;
                updateConstraint =
                  updateConstraint[0].toUpperCase() +
                  updateConstraint.substring(1);
              } else if (c.type === "on delete") {
                deleteConstraint = c.value.value;
                deleteConstraint =
                  deleteConstraint[0].toUpperCase() +
                  deleteConstraint.substring(1);
              }
            },
          );

          const startTableId = tables.findIndex((t) => t.name === startTable);
          if (startTable === -1) return;

          const endTableId = tables.findIndex((t) => t.name === endTable);
          if (endTableId === -1) return;

          const endFieldId = tables[endTableId].fields.findIndex(
            (f) => f.name === endField,
          );
          if (endField === -1) return;

          const startFieldId = tables[startTableId].fields.findIndex(
            (f) => f.name === startField,
          );
          if (startFieldId === -1) return;

          relationship.name = startTable + "_" + startField + "_fk";
          relationship.startTableId = startTableId;
          relationship.startFieldId = startFieldId;
          relationship.endTableId = endTableId;
          relationship.endFieldId = endFieldId;
          relationship.updateConstraint = updateConstraint;
          relationship.deleteConstraint = deleteConstraint;
          relationship.cardinality = Cardinality.ONE_TO_ONE;
          relationships.push(relationship);

          relationships.forEach((r, i) => (r.id = i));
        }
      });
    }
  };

  if (ast.go_next) {
    let x = { ...ast };
    let done = Array.isArray(x.go_next);
    while (!done) {
      parseSingleStatement(x.ast);
      x = { ...x.go_next };
      done = Array.isArray(x.go_next);
    }
  } else if (Array.isArray(ast)) {
    ast.forEach((e) => {
      parseSingleStatement(e);
    });
  }

  return { tables, relationships };
}
