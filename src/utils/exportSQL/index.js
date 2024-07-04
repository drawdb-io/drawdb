import { DB } from "../../data/constants";
import { toMariaDB } from "./mariadb";
import { toMSSQL } from "./mssql";
import { toMySQL } from "./mysql";
import { toPostgres } from "./postgres";
import { toSqlite } from "./sqlite";

export function exportSQL(diagram) {
  switch (diagram.database) {
    case DB.SQLITE:
      return toSqlite(diagram);
    case DB.MYSQL:
      return toMySQL(diagram);
    case DB.POSTGRES:
      return toPostgres(diagram);
    case DB.MARIADB:
      return toMariaDB(diagram);
    case DB.MSSQL:
      return toMSSQL(diagram);
    default:
      return "";
  }
}
