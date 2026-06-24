import { Parser } from "@dbml/core";
import { arrangeTables } from "../arrangeTables";
import { Cardinality, Constraint } from "../../data/constants";
import { nanoid } from "nanoid";

const parser = new Parser();

export function fromDBML(src) {
  const ast = parser.parse(src, "dbmlv2");

  const tables = [];
  const enums = [];
  const relationships = [];

  for (const schema of ast.schemas) {
    for (const table of schema.tables) {
      let parsedTable = {};
      parsedTable.id = nanoid();
      parsedTable.name = table.name;
      parsedTable.comment = table.note ?? "";
      parsedTable.color = table.headerColor ?? "#175e7a";
      parsedTable.fields = [];
      parsedTable.indices = [];
      parsedTable.uniqueConstraints = [];

      for (const column of table.fields) {
        const field = {};

        field.id = nanoid();
        field.name = column.name;
        // type_name: 纯类型名（如 "VARCHAR"），args: 参数字符串（如 "50"）
        field.type = column.type.type_name.toUpperCase();
        field.size = column.type.args ?? "";
        field.default = column.dbdefault?.value ?? "";
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
      const startTableName = ref.endpoints[0].tableName;
      const endTableName = ref.endpoints[1].tableName;
      const startFieldNames = ref.endpoints[0].fieldNames;
      const endFieldNames = ref.endpoints[1].fieldNames;
      const startFieldName = startFieldNames[0];

      const startTable = tables.find((t) => t.name === startTableName);
      if (!startTable) continue;

      const endTable = tables.find((t) => t.name === endTableName);
      if (!endTable) continue;

      const fieldPairs = [];
      for (let i = 0; i < startFieldNames.length; i++) {
        const sf = startTable.fields.find((f) => f.name === startFieldNames[i]);
        const ef = endTable.fields.find((f) => f.name === endFieldNames[i]);
        if (!sf || !ef) break;
        fieldPairs.push({ startFieldId: sf.id, endFieldId: ef.id });
      }
      if (fieldPairs.length !== startFieldNames.length) continue;

      const relationship = {};

      relationship.name =
        "fk_" + startTableName + "_" + startFieldName + "_" + endTableName;
      relationship.startTableId = startTable.id;
      relationship.endTableId = endTable.id;
      relationship.fields = fieldPairs;
      relationship.endFieldId = fieldPairs[0].endFieldId;
      relationship.startFieldId = fieldPairs[0].startFieldId;
      relationship.id = nanoid();

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
