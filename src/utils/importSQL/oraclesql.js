import { nanoid } from "nanoid";
import { Cardinality, Constraint, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";

const affinity = {
  [DB.ORACLESQL]: new Proxy(
    { INT: "INTEGER" },
    { NUMERIC: "NUMBER" },
    { DECIMAL: "NUMBER" },
    { CHARACTER: "CHAR" },
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

  const parseSingleStatement = (e) => {
    console.log(e);
    if (e.operation === "create") {
      if (e.object === "table") {
        const table = {};
        table.name = e.name.name;
        table.comment = "";
        table.color = "#175e7a";
        table.fields = [];
        table.indices = [];
        table.id = nanoid();
        e.table.relational_properties.forEach((d) => {
          if (d.resource === "column") {
            const field = {};
            field.id = nanoid();
            field.name = d.name;

            let type = d.type.type.toUpperCase();
            if (!dbToTypes[diagramDb][type]) {
              type = affinity[diagramDb][type];
            }
            field.type = type;

            if (d.type.scale && d.type.precision) {
              field.size = d.type.precision + "," + d.type.scale;
            } else if (d.type.size || d.type.precision) {
              field.size = d.type.size || d.type.precision;
            }

            field.comment = "";
            field.check = "";
            field.default = "";
            field.unique = false;
            field.increment = false;
            field.notNull = false;
            field.primary = false;

            for (const c of d.constraints) {
              if (c.constraint.primary_key === "primary key")
                field.primary = true;
              if (c.constraint.not_null === "not null") field.notNull = true;
              if (c.constraint.unique === "unique") field.unique = true;
            }

            if (d.identity) {
              field.increment = true;
            }

            // TODO: reconstruct default when implemented in parser
            if (d.default) {
              field.default = JSON.stringify(d.default.expr);
            }

            table.fields.push(field);
          } else if (d.resource === "constraint") {
            const relationship = {};
            const startFieldName = d.constraint.columns[0];
            const endFieldName = d.constraint.reference.columns[0];
            const endTableName = d.constraint.reference.object.name;

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

            relationship.startTableId = table.id;
            relationship.startFieldId = startField.id;
            relationship.endTableId = endTable.id;
            relationship.endFieldId = endField.id;
            relationship.updateConstraint = Constraint.NONE;
            relationship.name =
              d.name && Boolean(d.name.trim())
                ? d.name
                : `fk_${table.name}_${startFieldName}_${endTableName}`;
            relationship.deleteConstraint =
              d.constraint.reference.on_delete &&
              Boolean(d.constraint.reference.on_delete.trim())
                ? d.constraint.reference.on_delete[0].toUpperCase() +
                  d.constraint.reference.on_delete.substring(1)
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
    }
  };

  ast.forEach((e) => parseSingleStatement(e));

  relationships.forEach((r, i) => (r.id = i));

  return { tables, relationships, enums };
}
