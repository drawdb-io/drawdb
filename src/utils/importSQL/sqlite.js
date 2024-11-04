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
    const endField = referenceDefinition.definition[0].column;

    const endTableId = tables.findIndex((t) => t.name === endTableName);
    if (endTableId === -1) return;

    const endFieldId = tables[endTableId].fields.findIndex(
      (f) => f.name === endField,
    );
    if (endFieldId === -1) return;

    const startFieldId = startTable.fields.findIndex(
      (f) => f.name === startFieldName,
    );
    if (startFieldId === -1) return;

    relationship.name = startTable.name + "_" + startFieldName + "_fk";
    relationship.startTableId = startTable.id;
    relationship.endTableId = endTableId;
    relationship.endFieldId = endFieldId;
    relationship.startFieldId = startFieldId;
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

    if (startTable.fields[startFieldId].unique) {
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
