import { Parser } from "@dbml/core";
import { arrangeTables } from "../arrangeTables";

const parser = new Parser();

/**

{
      "id": 0,
      "name": "some_table",
      "x": 812.9083754222163,
      "y": 400.3451698134321,
      "fields": [
        {
          "name": "id",
          "type": "INT",
          "default": "",
          "check": "",
          "primary": true,
          "unique": true,
          "notNull": true,
          "increment": true,
          "comment": "",
          "id": 0
        }
      ],
      "comment": "",
      "indices": [],
      "color": "#175e7a",
      "key": 1737222753837
    }
 */

export function fromDBML(src) {
  const ast = parser.parse(src, "dbml");

  const tables = [];
  const enums = [];

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
        field.unique = true;
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

      console.log(table);

      tables.push(parsedTable);
    }

    for (const schemaEnum of schema.enums) {
      const parsedEnum = {};

      parsedEnum.name = schemaEnum.name;
      parsedEnum.values = schemaEnum.values.map((x) => x.name);

      enums.push(parsedEnum);
    }
  }

  console.log(ast);

  const diagram = { tables, enums };

  arrangeTables(diagram);

  return diagram;
}
