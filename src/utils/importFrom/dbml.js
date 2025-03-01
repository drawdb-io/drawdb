import { Parser } from "@dbml/core";
import { arrangeTables } from "../arrangeTables";
import { Cardinality, Constraint } from "../../data/constants";

const parser = new Parser();

export function fromDBML(src) {
  const ast = parser.parse(src, "dbml");

  const tables = [];
  const enums = [];
  const relationships = [];

  for (const schema of ast.schemas) {
    for (const table of schema.tables) {
      let parsedTable = {};
      parsedTable.id = tables.length;
      parsedTable.name = table.name;
      parsedTable.comment = table.note ?? "";
      parsedTable.color = "#175e7a";
      parsedTable.fields = [];
      parsedTable.indices = [];

      for (const column of table.fields) {
        const field = {};

        field.id = parsedTable.fields.length;
        field.name = column.name;
        field.type = column.type.type_name.toUpperCase();
        field.default = column.dbdefault ?? "";
        field.check = "";
        field.primary = !!column.pk;
        field.unique = !!column.pk;
        field.notNull = !!column.not_null;
        field.increment = !!column.increment;
        field.comment = column.note ?? "";

        parsedTable.fields.push(field);
      }

      for (const idx of table.indexes) {
        const parsedIndex = {};

        parsedIndex.id = idx.id - 1;
        parsedIndex.fields = idx.columns.map((x) => x.value);
        parsedIndex.name =
          idx.name ?? `${parsedTable.name}_index_${parsedIndex.id}`;
        parsedIndex.unique = !!idx.unique;

        parsedTable.indices.push(parsedIndex);
      }

      tables.push(parsedTable);
    }

    for (const ref of schema.refs) {
      const startTable = ref.endpoints[0].tableName;
      const endTable = ref.endpoints[1].tableName;
      const startField = ref.endpoints[0].fieldNames[0];
      const endField = ref.endpoints[1].fieldNames[0];

      const startTableId = tables.findIndex((t) => t.name === startTable);
      if (startTableId === -1) continue;

      const endTableId = tables.findIndex((t) => t.name === endTable);
      if (endTableId === -1) continue;

      const endFieldId = tables[endTableId].fields.findIndex(
        (f) => f.name === endField,
      );
      if (endFieldId === -1) continue;

      const startFieldId = tables[startTableId].fields.findIndex(
        (f) => f.name === startField,
      );
      if (startFieldId === -1) continue;

      const relationship = {};

      relationship.name =
        "fk_" + startTable + "_" + startField + "_" + endTable;
      relationship.startTableId = startTableId;
      relationship.endTableId = endTableId;
      relationship.endFieldId = endFieldId;
      relationship.startFieldId = startFieldId;
      relationship.id = relationships.length;

      relationship.updateConstraint = ref.onDelete
        ? ref.onDelete[0].toUpperCase() + ref.onDelete.substring(1)
        : Constraint.NONE;
      relationship.deleteConstraint = ref.onUpdate
        ? ref.onUpdate[0].toUpperCase() + ref.onUpdate.substring(1)
        : Constraint.NONE;

      const startRelation = ref.endpoints[0].relation;
      const endRelation = ref.endpoints[1].relation;

      if (startRelation === "*" && endRelation === "1") {
        relationship.cardinality = Cardinality.MANY_TO_ONE;
      }

      if (startRelation === "1" && endRelation === "*") {
        relationship.cardinality = Cardinality.ONE_TO_MANY;
      }

      if (startRelation === "1" && endRelation === "1") {
        relationship.cardinality = Cardinality.ONE_TO_ONE;
      }

      relationships.push(relationship);
    }

    for (const schemaEnum of schema.enums) {
      const parsedEnum = {};

      parsedEnum.name = schemaEnum.name;
      parsedEnum.values = schemaEnum.values.map((x) => x.name);

      enums.push(parsedEnum);
    }
  }

  const diagram = { tables, enums, relationships };

  arrangeTables(diagram);

  return diagram;
}
