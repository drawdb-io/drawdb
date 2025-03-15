export function fromOracleSQL(ast) {
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
            field.type = type;
            field.comment = "";
            field.unique = false;
            field.increment = false;
            field.notNull = false;
            field.primary = false;

            field.default = "";
            // if (d.default_val) {
            //   let defaultValue = "";
            //   if (d.default_val.value.type === "function") {
            //     defaultValue = d.default_val.value.name.name[0].value;
            //     if (d.default_val.value.args) {
            //       defaultValue +=
            //         "(" +
            //         d.default_val.value.args.value
            //           .map((v) => {
            //             if (
            //               v.type === "single_quote_string" ||
            //               v.type === "double_quote_string"
            //             )
            //               return "'" + v.value + "'";
            //             return v.value;
            //           })
            //           .join(", ") +
            //         ")";
            //     }
            //   } else if (d.default_val.value.type === "null") {
            //     defaultValue = "NULL";
            //   } else {
            //     defaultValue = d.default_val.value.value.toString();
            //   }
            //   field.default = defaultValue;
            // }
            // if (d.definition["length"]) {
            //   if (d.definition.scale) {
            //     field.size = d.definition["length"] + "," + d.definition.scale;
            //   } else {
            //     field.size = d.definition["length"];
            //   }
            // }
            // field.check = "";
            // if (d.check) {
            //   field.check = buildSQLFromAST(d.check.definition[0], DB.MYSQL);
            // }

            table.fields.push(field);
          } 
        //   else if (d.resource === "constraint") {
        //     if (d.constraint_type === "primary key") {
        //       d.definition.forEach((c) => {
        //         table.fields.forEach((f) => {
        //           if (f.name === c.column && !f.primary) {
        //             f.primary = true;
        //           }
        //         });
        //       });
        //     } else if (d.constraint_type.toLowerCase() === "foreign key") {
        //       const relationship = {};
        //       const startTableId = table.id;
        //       const startTable = e.table[0].table;
        //       const startField = d.definition[0].column;
        //       const endTable = d.reference_definition.table[0].table;
        //       const endField = d.reference_definition.definition[0].column;

        //       const endTableId = tables.findIndex((t) => t.name === endTable);
        //       if (endTableId === -1) return;

        //       const endFieldId = tables[endTableId].fields.findIndex(
        //         (f) => f.name === endField,
        //       );
        //       if (endFieldId === -1) return;

        //       const startFieldId = table.fields.findIndex(
        //         (f) => f.name === startField,
        //       );
        //       if (startFieldId === -1) return;

        //       relationship.name =
        //         "fk_" + startTable + "_" + startField + "_" + endTable;
        //       relationship.startTableId = startTableId;
        //       relationship.endTableId = endTableId;
        //       relationship.endFieldId = endFieldId;
        //       relationship.startFieldId = startFieldId;
        //       let updateConstraint = "No action";
        //       let deleteConstraint = "No action";
        //       d.reference_definition.on_action.forEach((c) => {
        //         if (c.type === "on update") {
        //           updateConstraint = c.value.value;
        //           updateConstraint =
        //             updateConstraint[0].toUpperCase() +
        //             updateConstraint.substring(1);
        //         } else if (c.type === "on delete") {
        //           deleteConstraint = c.value.value;
        //           deleteConstraint =
        //             deleteConstraint[0].toUpperCase() +
        //             deleteConstraint.substring(1);
        //         }
        //       });

        //       relationship.updateConstraint = updateConstraint;
        //       relationship.deleteConstraint = deleteConstraint;

        //       if (table.fields[startFieldId].unique) {
        //         relationship.cardinality = Cardinality.ONE_TO_ONE;
        //       } else {
        //         relationship.cardinality = Cardinality.MANY_TO_ONE;
        //       }

        //       relationships.push(relationship);
        //     }
        //   }
        });
        table.fields.forEach((f, j) => {
          f.id = j;
        });
        tables.push(table);
      }
    } 
    // else if (e.type === "alter") {
    //   e.expr.forEach((expr) => {
    //     if (
    //       expr.action === "add" &&
    //       expr.create_definitions.constraint_type.toLowerCase() ===
    //         "foreign key"
    //     ) {
    //       const relationship = {};
    //       const startTable = e.table[0].table;
    //       const startField = expr.create_definitions.definition[0].column;
    //       const endTable =
    //         expr.create_definitions.reference_definition.table[0].table;
    //       const endField =
    //         expr.create_definitions.reference_definition.definition[0].column;
    //       let updateConstraint = "No action";
    //       let deleteConstraint = "No action";
    //       expr.create_definitions.reference_definition.on_action.forEach(
    //         (c) => {
    //           if (c.type === "on update") {
    //             updateConstraint = c.value.value;
    //             updateConstraint =
    //               updateConstraint[0].toUpperCase() +
    //               updateConstraint.substring(1);
    //           } else if (c.type === "on delete") {
    //             deleteConstraint = c.value.value;
    //             deleteConstraint =
    //               deleteConstraint[0].toUpperCase() +
    //               deleteConstraint.substring(1);
    //           }
    //         },
    //       );

    //       const startTableId = tables.findIndex((t) => t.name === startTable);
    //       if (startTable === -1) return;

    //       const endTableId = tables.findIndex((t) => t.name === endTable);
    //       if (endTableId === -1) return;

    //       const endFieldId = tables[endTableId].fields.findIndex(
    //         (f) => f.name === endField,
    //       );
    //       if (endFieldId === -1) return;

    //       const startFieldId = tables[startTableId].fields.findIndex(
    //         (f) => f.name === startField,
    //       );
    //       if (startFieldId === -1) return;

    //       relationship.name =
    //         "fk_" + startTable + "_" + startField + "_" + endTable;
    //       relationship.startTableId = startTableId;
    //       relationship.startFieldId = startFieldId;
    //       relationship.endTableId = endTableId;
    //       relationship.endFieldId = endFieldId;
    //       relationship.updateConstraint = updateConstraint;
    //       relationship.deleteConstraint = deleteConstraint;

    //       if (tables[startTableId].fields[startFieldId].unique) {
    //         relationship.cardinality = Cardinality.ONE_TO_ONE;
    //       } else {
    //         relationship.cardinality = Cardinality.MANY_TO_ONE;
    //       }

    //       relationships.push(relationship);

    //       relationships.forEach((r, i) => (r.id = i));
    //     }
    //   });
    // }
  };

  ast.forEach((e) => parseSingleStatement(e));

  relationships.forEach((r, i) => (r.id = i));

  return { tables, relationships, enums };
}
