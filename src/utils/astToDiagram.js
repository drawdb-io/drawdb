import { Cardinality } from "../data/constants";

export function astToDiagram(ast) {
  const tables = [];
  const relationships = [];
  const inlineForeignKeys = [];

  ast.forEach((e) => {
    if (e.type === "create") {
      if (e.keyword === "table") {
        const table = {};
        table.name = e.table[0].table;
        table.comment = "";
        table.color = "#175e7a";
        table.fields = [];
        table.indices = [];
        table.x = 0;
        table.y = 0;
        e.create_definitions.forEach((d) => {
          if (d.resource === "column") {
            const field = {};
            field.name = d.column.column;
            field.type = d.definition.dataType;
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
            if (d.default_val) field.default = d.default_val.value.value.toString();
            if (d.definition["length"]) field.size = d.definition["length"];
            field.check = "";
            if (d.check) {
              let check = "";
              if (d.check.definition[0].left.column) {
                let value = d.check.definition[0].right.value;
                if (
                  d.check.definition[0].right.type === "double_quote_string" ||
                  d.check.definition[0].right.type === "single_quote_string"
                )
                  value = "'" + value + "'";
                check =
                  d.check.definition[0].left.column +
                  " " +
                  d.check.definition[0].operator +
                  " " +
                  value;
              } else {
                let value = d.check.definition[0].right.value;
                if (
                  d.check.definition[0].left.type === "double_quote_string" ||
                  d.check.definition[0].left.type === "single_quote_string"
                )
                  value = "'" + value + "'";
                check =
                  value +
                  " " +
                  d.check.definition[0].operator +
                  " " +
                  d.check.definition[0].right.column;
              }
              field.check = check;
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
              inlineForeignKeys.push({ ...d, startTable: e.table[0].table });
            }
          }
        });
        tables.push(table);
        tables.forEach((e, i) => {
          e.id = i;
          e.fields.forEach((f, j) => {
            f.id = j;
          });
        });
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
      if (
        e.expr[0].action === "add" &&
        e.expr[0].create_definitions.constraint_type === "FOREIGN KEY"
      ) {
        const relationship = {};
        const startTable = e.table[0].table;
        const startField = e.expr[0].create_definitions.definition[0].column;
        const endTable =
          e.expr[0].create_definitions.reference_definition.table[0].table;
        const endField =
          e.expr[0].create_definitions.reference_definition.definition[0]
            .column;
        let updateConstraint = "No action";
        let deleteConstraint = "No action";
        e.expr[0].create_definitions.reference_definition.on_action.forEach(
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
          }
        );

        let startTableId = -1;
        let startFieldId = -1;
        let endTableId = -1;
        let endFieldId = -1;

        tables.forEach((t) => {
          if (t.name === startTable) {
            startTableId = t.id;
            return;
          }

          if (t.name === endTable) {
            endTableId = t.id;
          }
        });

        if (startTableId === -1 || endTableId === -1) return;

        tables[startTableId].fields.forEach((f) => {
          if (f.name === startField) {
            startFieldId = f.id;
            return;
          }

          if (f.name === endField) {
            endFieldId = f.id;
          }
        });

        if (startFieldId === -1 || endFieldId === -1) return;

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
    }
  });

  inlineForeignKeys.forEach((fk) => {
    const relationship = {};
    const startTable = fk.startTable;
    const startField = fk.definition[0].column;
    const endTable = fk.reference_definition.table[0].table;
    const endField = fk.reference_definition.definition[0].column;
    let updateConstraint = "No action";
    let deleteConstraint = "No action";
    fk.reference_definition.on_action.forEach((c) => {
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

    let startTableId = -1;
    let startFieldId = -1;
    let endTableId = -1;
    let endFieldId = -1;

    tables.forEach((t) => {
      if (t.name === startTable) {
        startTableId = t.id;
        return;
      }

      if (t.name === endTable) {
        endTableId = t.id;
      }
    });

    if (startTableId === -1 || endTableId === -1) return;

    tables[startTableId].fields.forEach((f) => {
      if (f.name === startField) {
        startFieldId = f.id;
        return;
      }

      if (f.name === endField) {
        endFieldId = f.id;
      }
    });

    if (startFieldId === -1 || endFieldId === -1) return;

    relationship.name = startTable + "_" + startField + "_fk";
    relationship.startTableId = startTableId;
    relationship.startFieldId = startFieldId;
    relationship.endTableId = endTableId;
    relationship.endFieldId = endFieldId;
    relationship.updateConstraint = updateConstraint;
    relationship.deleteConstraint = deleteConstraint;
    relationship.cardinality = Cardinality.ONE_TO_ONE;
    relationships.push(relationship);
  });

  relationships.forEach((r, i) => (r.id = i));

  return { tables, relationships };
}
