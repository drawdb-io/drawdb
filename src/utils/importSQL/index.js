import { DB } from "../../data/constants";
import { arrangeTables } from "../arrangeTables";
import { fromMariaDB } from "./mariadb";
import { fromMSSQL } from "./mssql";
import { fromMySQL } from "./mysql";
import { fromOracleSQL } from "./oraclesql";
import { fromPostgres } from "./postgres";
import { fromSQLite } from "./sqlite";

export function importSQL(
  ast,
  toDb = DB.MYSQL,
  diagramDb = DB.GENERIC,
  existingTables = [],
) {
  let diagram;
  switch (toDb) {
    case DB.SQLITE:
      diagram = fromSQLite(ast, diagramDb, existingTables);
      break;
    case DB.MYSQL:
      diagram = fromMySQL(ast, diagramDb, existingTables);
      break;
    case DB.POSTGRES:
      diagram = fromPostgres(ast, diagramDb, existingTables);
      break;
    case DB.MARIADB:
      diagram = fromMariaDB(ast, diagramDb, existingTables);
      break;
    case DB.MSSQL:
      diagram = fromMSSQL(ast, diagramDb, existingTables);
      break;
    case DB.ORACLESQL:
      diagram = fromOracleSQL(ast, diagramDb, existingTables);
      break;
    default:
      diagram = { tables: [], relationships: [] };
      break;
  }

  arrangeTables(diagram);

  return diagram;
}
