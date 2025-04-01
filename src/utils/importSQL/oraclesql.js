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
        table.id = tables.length;
        e.table.relational_properties.forEach((d) => {
          if (d.resource === "column") {
            const field = {};
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
            const startTableId = table.id;
            const startField = d.constraint.columns[0];
            const endField = d.constraint.reference.columns[0];
            const endTable = d.constraint.reference.object.name;

            const endTableId = tables.findIndex((t) => t.name === endTable);
            if (endTableId === -1) return;

            const endFieldId = tables[endTableId].fields.findIndex(
              (f) => f.name === endField,
            );
            if (endFieldId === -1) return;

            const startFieldId = table.fields.findIndex(
              (f) => f.name === startField,
            );
            if (startFieldId === -1) return;

            relationship.startTableId = startTableId;
            relationship.startFieldId = startFieldId;
            relationship.endTableId = endTableId;
            relationship.endFieldId = endFieldId;
            relationship.updateConstraint = Constraint.NONE;
            relationship.name =
              d.name && Boolean(d.name.trim())
                ? d.name
                : "fk_" + table.name + "_" + startField + "_" + endTable;
            relationship.deleteConstraint =
              d.constraint.reference.on_delete &&
              Boolean(d.constraint.reference.on_delete.trim())
                ? d.constraint.reference.on_delete[0].toUpperCase() +
                  d.constraint.reference.on_delete.substring(1)
                : Constraint.NONE;

            if (table.fields[startFieldId].unique) {
              relationship.cardinality = Cardinality.ONE_TO_ONE;
            } else {
              relationship.cardinality = Cardinality.MANY_TO_ONE;
            }

            relationships.push(relationship);
          }
        });
        table.fields.forEach((f, j) => {
          f.id = j;
        });
        tables.push(table);
      }
    }
  };

  ast.forEach((e) => parseSingleStatement(e));

  relationships.forEach((r, i) => (r.id = i));

  return { tables, relationships, enums };
}
