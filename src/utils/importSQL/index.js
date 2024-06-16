import {
  DB,
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
} from "../../data/constants";
import { fromMariaDB } from "./mariadb";
import { fromMySQL } from "./mysql";
import { fromSQLite } from "./sqlite";

export function importSQL(ast, toDb = DB.MYSQL, diagramDb = DB.GENERIC) {
  let diagram = { tables: [], relationships: [] };
  switch (toDb) {
    case DB.SQLITE:
      diagram = fromSQLite(ast, diagramDb);
      break;
    case DB.MYSQL:
      diagram = fromMySQL(ast, diagramDb);
      break;
    case DB.POSTGRES:
      diagram = { tables: [], relationships: [] };
      break;
    case DB.MARIADB:
      diagram = fromMariaDB(ast, diagramDb);
      break;
    case DB.MSSQL:
      diagram = { tables: [], relationships: [] };
      break;
    default:
      diagram = { tables: [], relationships: [] };
      break;
  }

  let maxHeight = -1;
  const tableWidth = 200;
  const gapX = 54;
  const gapY = 40;
  diagram.tables.forEach((table, i) => {
    if (i < diagram.tables.length / 2) {
      table.x = i * tableWidth + (i + 1) * gapX;
      table.y = gapY;
      const height =
        table.fields.length * tableFieldHeight +
        tableHeaderHeight +
        tableColorStripHeight;
      maxHeight = Math.max(height, maxHeight);
    } else {
      const index = diagram.tables.length - i - 1;
      table.x = index * tableWidth + (index + 1) * gapX;
      table.y = maxHeight + 2 * gapY;
    }
  });

  return diagram;
}
