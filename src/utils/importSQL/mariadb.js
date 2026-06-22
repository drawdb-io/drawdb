import { nanoid } from "nanoid";
import { Cardinality, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import { buildSQLFromAST } from "./shared";

const affinity = {
  [DB.MARIADB]: new Proxy(
    { INT: "INTEGER" },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INT: "INTEGER",
      TINYINT: "SMALLINT",
      MEDIUMINT: "INTEGER",
      BIT: "BOOLEAN",
      YEAR: "INTEGER",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
};

export function fromMariaDB(ast, diagramDb = DB.GENERIC) {
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
        table.uniqueConstraints = [];
        table.id = nanoid();
        e.create_definitions.forEach((d) => {
          if (d.resource === "column") {
            const field = {};
            field.id = nanoid();
            field.name = d.column.column;

            let type = d.definition.dataType;
            if (diagramDb === DB.MARIADB && type === "INTEGER") {
              type = "INT";
            }
            if (!dbToTypes[diagramDb][type]) {
              type = affinity[diagramDb][type];
            }
            field.type = type;

            if (d.definition.expr && d.definition.expr.type === "expr_list") {
              field.values = d.definition.expr.value.map((v) => v.value);
            }
            field.comment = d.comment ? d.comment.value.value : "";
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
              field.check = buildSQLFromAST(d.check.definition[0], DB.MARIADB);
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
            } else if (d.constraint_type.toLowerCase() === "foreign key") {
              const relationship = {};
              const startTableId = table.id;
              const startTableName = e.table[0].table;
              const startFieldNames = d.definition.map((c) => c.column);
              const endTableName = d.reference_definition.table[0].table;
              const endFieldNames = d.reference_definition.definition.map(
                (c) => c.column,
              );
              const startFieldName = startFieldNames[0];

              const endTable = tables.find((t) => t.name === endTableName);
              if (!endTable) return;

              const fieldPairs = [];
              for (let i = 0; i < startFieldNames.length; i++) {
                const sf = table.fields.find(
                  (f) => f.name === startFieldNames[i],
                );
                const ef = endTable.fields.find(
                  (f) => f.name === endFieldNames[i],
                );
                if (!sf || !ef) break;
                fieldPairs.push({ startFieldId: sf.id, endFieldId: ef.id });
              }
              if (fieldPairs.length !== startFieldNames.length) return;

              const startField = table.fields.find(
                (f) => f.name === startFieldName,
              );

              relationship.name = `fk_${startTableName}_${startFieldName}_${endTableName}`;
              relationship.startTableId = startTableId;
              relationship.endTableId = endTable.id;
              relationship.fields = fieldPairs;
              relationship.endFieldId = fieldPairs[0].endFieldId;
              relationship.startFieldId = fieldPairs[0].startFieldId;
              relationship.id = nanoid()
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

              if (startField.unique) {
                relationship.cardinality = Cardinality.ONE_TO_ONE;
              } else {
                relationship.cardinality = Cardinality.MANY_TO_ONE;
              }

              relationships.push(relationship);
            } else if (
              d.constraint_type &&
              d.constraint_type.toLowerCase().includes("unique")
            ) {
              const fields = d.definition.map((c) => c.column);
              const name =
                d.constraint ||
                d.index ||
                `${table.name}_unique_${table.uniqueConstraints.length}`;
              table.uniqueConstraints.push({ name, fields });
              table.uniqueConstraints.forEach((u, j) => {
                u.id = j;
              });
            }
          }
        });

        e.table_options?.forEach((opt) => {
          if (opt.keyword === "comment") {
            table.comment = opt.value.replace(/^["']|["']$/g, "");
          }
        });

        tables.push(table);
      } else if (e.keyword === "index") {
        const index = {
          name: e.index,
          unique: e.index_type === "unique",
          fields: e.index_columns.map((f) => f.column),
        };

        const table = tables.find((t) => t.name === e.table.table);

        if (table) {
          table.indices.push(index);
          table.indices.forEach((i, j) => {
            i.id = j;
          });
        }
      }
    } else if (e.type === "alter") {
      e.expr.forEach((expr) => {
        if (
          expr.action === "add" &&
          expr.create_definitions.constraint_type.toLowerCase() ===
            "foreign key"
        ) {
          const relationship = {};
          const startTableName = e.table[0].table;
          const startFieldNames = expr.create_definitions.definition.map(
            (c) => c.column,
          );
          const endTableName =
            expr.create_definitions.reference_definition.table[0].table;
          const endFieldNames =
            expr.create_definitions.reference_definition.definition.map(
              (c) => c.column,
            );
          const startFieldName = startFieldNames[0];
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

          const startTable = tables.find((t) => t.name === startTableName);
          if (!startTable) return;

          const endTable = tables.find((t) => t.name === endTableName);
          if (!endTable) return;

          const fieldPairs = [];
          for (let i = 0; i < startFieldNames.length; i++) {
            const sf = startTable.fields.find(
              (f) => f.name === startFieldNames[i],
            );
            const ef = endTable.fields.find(
              (f) => f.name === endFieldNames[i],
            );
            if (!sf || !ef) break;
            fieldPairs.push({ startFieldId: sf.id, endFieldId: ef.id });
          }
          if (fieldPairs.length !== startFieldNames.length) return;

          const startField = startTable.fields.find(
            (f) => f.name === startFieldName,
          );

          relationship.name =
            "fk_" + startTableName + "_" + startFieldName + "_" + endTableName;
          relationship.startTableId = startTable.id;
          relationship.startFieldId = fieldPairs[0].startFieldId;
          relationship.endTableId = endTable.id;
          relationship.endFieldId = fieldPairs[0].endFieldId;
          relationship.fields = fieldPairs;
          relationship.updateConstraint = updateConstraint;
          relationship.deleteConstraint = deleteConstraint;
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

  if (Array.isArray(ast)) {
    ast.forEach((e) => parseSingleStatement(e));
  } else {
    parseSingleStatement(ast);
  }

  return { tables, relationships };
}
