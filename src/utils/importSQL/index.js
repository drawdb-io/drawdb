import { DB } from "../../data/constants";
import { fromMySQL } from "./mysql";

export function importSQL(ast, database = DB.MYSQL) {
  switch (database) {
    case DB.SQLITE:
      return { tables: [], relationships: [] };
    case DB.MYSQL:
      return fromMySQL(ast);
    case DB.POSTGRES:
      return { tables: [], relationships: [] };
    case DB.MARIADB:
      return { tables: [], relationships: [] };
    case DB.MSSQL:
      return { tables: [], relationships: [] };
    default:
      return { tables: [], relationships: [] };
  }
}
