import { nanoid } from "nanoid";
import { Cardinality, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import { buildSQLFromAST } from "./shared";

const affinity = {
  [DB.SQLITE]: new Proxy(
    {
      INT: "INTEGER",
      TINYINT: "INTEGER",
      SMALLINT: "INTEGER",
      MEDIUMINT: "INTEGER",
      BIGINT: "INTEGER",
      "UNSIGNED BIG INT": "INTEGER",
      INT2: "INTEGER",
      INT8: "INTEGER",
      CHARACTER: "TEXT",
      NCHARACTER: "TEXT",
      NVARCHAR: "VARCHAR",
      DOUBLE: "REAL",
      FLOAT: "REAL",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INTEGER: "INT",
      TINYINT: "SMALLINT",
      MEDIUMINT: "INTEGER",
      INT2: "INTEGER",
      INT8: "INTEGER",
      CHARACTER: "TEXT",
      NCHARACTER: "TEXT",
      NVARCHAR: "VARCHAR",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "BLOB") },
  ),
};

export function fromSQLite(ast, diagramDb = DB.GENERIC) {
  const tables = [];
  const relationships = [];

  const addRelationshipFromReferenceDef = (
    startTable,
    startFieldName,
    referenceDefinition,
  ) => {
    const relationship = {};
    const endTableName = referenceDefinition.table[0].table;
    const endFieldName = referenceDefinition.definition[0].column;

    const endTable = tables.find((t) => t.name === endTableName);
    if (!endTable) return;

    const endField = endTable.fields.find((f) => f.name === endFieldName);
    if (!endField) return;

    const startField = startTable.fields.find((f) => f.name === startFieldName);
    if (!startField) return;

    relationship.name =
      "fk_" + startTable.name + "_" + startFieldName + "_" + endTableName;
    relationship.startTableId = startTable.id;
    relationship.endTableId = endTable.id;
    relationship.endFieldId = endField.id;
    relationship.startFieldId = startField.id;
    let updateConstraint = "No action";
    let deleteConstraint = "No action";
    referenceDefinition.on_action.forEach((c) => {
      if (c.type === "on update") {
        updateConstraint = c.value.value;
        updateConstraint =
          updateConstraint[0].toUpperCase() + updateConstraint.substring(1);
      } else if (c.type === "on delete") {
        deleteConstraint = c.value.value;
        deleteConstraint =
          deleteConstraint[0].toUpperCase() + deleteConstraint.substring(1);
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
  };

  const parseSingleStatement = (e) => {
    if (e.type === "create") {
      if (e.keyword === "table") {
        const table = {};
        table.name = e.table[0].table;
        table.comment = "";
        table.color = "#175e7a";
        table.fields = [];
        table.indices = [];
        table.id = nanoid();
        e.create_definitions.forEach((d) => {
          if (d.resource === "column") {
            const field = {};
            field.id = nanoid();
            field.name = d.column.column;

            let type = d.definition.dataType;
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
              field.check = buildSQLFromAST(d.check.definition[0], DB.SQLITE);
            }
            table.fields.push(field);

            if (d.reference_definition) {
              addRelationshipFromReferenceDef(
                table,
                field.name,
                d.reference_definition,
              );
            }
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
              addRelationshipFromReferenceDef(
                table,
                d.definition[0].column,
                d.reference_definition,
              );
            }
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
    }
  };

  if (Array.isArray(ast)) {
    ast.forEach((e) => parseSingleStatement(e));
  } else {
    parseSingleStatement(ast);
  }

  relationships.forEach((r, i) => (r.id = i));

  return { tables, relationships };
}
