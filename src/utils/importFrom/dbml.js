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
        field.type = column.type.type_name.toUpperCase();
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
      // Determine FK side: the endpoint with relation "*" is the FK (child) side,
      // the endpoint with relation "1" is the referenced (parent) side.
      // Endpoint order in the array is lexical, not semantic — do NOT trust
      // endpoints[0] to be the FK side.
      const ep0 = ref.endpoints[0];
      const ep1 = ref.endpoints[1];

      let fkEndpoint, pkEndpoint;
      if (ep0.relation === "*") {
        fkEndpoint = ep0;
        pkEndpoint = ep1;
      } else if (ep1.relation === "*") {
        fkEndpoint = ep1;
        pkEndpoint = ep0;
      } else {
        // 1-1 relationship: determine FK side by checking which endpoint's
        // fields are all primary keys or unique indexes. The side whose fields
        // are all PK/unique is the parent (referenced) side.
        const tablesMap = new Map(tables.map((t) => [t.name, t]));
        const pkTable = tablesMap.get(ep0.tableName);
        const fkTable = tablesMap.get(ep1.tableName);

        if (pkTable && fkTable) {
          const ep0FieldsAllPK = ep0.fieldNames.every((name) => {
            const f = pkTable.fields.find((f) => f.name === name);
            return f && (f.primary || f.unique);
          });
          const ep1FieldsAllPK = ep1.fieldNames.every((name) => {
            const f = fkTable.fields.find((f) => f.name === name);
            return f && (f.primary || f.unique);
          });

          if (ep0FieldsAllPK && !ep1FieldsAllPK) {
            // ep0 is all PK/unique → ep0 is parent, ep1 is FK side
            fkEndpoint = ep1;
            pkEndpoint = ep0;
          } else {
            // default: ep1 is FK side
            fkEndpoint = ep1;
            pkEndpoint = ep0;
          }
        } else {
          // default: ep1 is FK side
          fkEndpoint = ep1;
          pkEndpoint = ep0;
        }
      }

      const startTableName = fkEndpoint.tableName;
      const endTableName = pkEndpoint.tableName;
      const startFieldNames = fkEndpoint.fieldNames;
      const endFieldNames = pkEndpoint.fieldNames;
      const startFieldName = startFieldNames[0];
      const endFieldName = endFieldNames[0];

      const startTable = tables.find((t) => t.name === startTableName);
      if (!startTable) continue;

      const endTable = tables.find((t) => t.name === endTableName);
      if (!endTable) continue;

      const endField = endTable.fields.find((f) => f.name === endFieldName);
      if (!endField) continue;

      const startField = startTable.fields.find(
        (f) => f.name === startFieldName,
      );
      if (!startField) continue;

      const relationship = {};

      relationship.name =
        "fk_" + startTableName + "_" + startFieldName + "_" + endTableName;
      relationship.startTableId = startTable.id;
      relationship.endTableId = endTable.id;
      relationship.endFieldId = endField.id;
      relationship.startFieldId = startField.id;
      relationship.id = nanoid();

      relationship.updateConstraint = ref.onDelete
        ? ref.onDelete[0].toUpperCase() + ref.onDelete.substring(1)
        : Constraint.NONE;
      relationship.deleteConstraint = ref.onUpdate
        ? ref.onUpdate[0].toUpperCase() + ref.onUpdate.substring(1)
        : Constraint.NONE;

      const fkRelation = fkEndpoint.relation;
      const pkRelation = pkEndpoint.relation;

      if (fkRelation === "*" && pkRelation === "1") {
        // many-to-one: start is the FK side (child), end is the PK side (parent)
        relationship.cardinality = Cardinality.MANY_TO_ONE;
      } else if (fkRelation === "1" && pkRelation === "1") {
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
