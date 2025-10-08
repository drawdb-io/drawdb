import { DB } from "../../data/constants";
import { toMariaDB } from "./mariadb";
import { toMSSQL } from "./mssql";
import { toMySQL } from "./mysql";
import { toOracleSQL } from "./oraclesql";
import { toSqlite } from "./sqlite";
import { jsonToPostgreSQL } from "./generic";

export function exportSQL(diagram) {
  switch (diagram.database) {
    case DB.SQLITE:
      return toSqlite(diagram);
    case DB.MYSQL:
      return toMySQL(diagram);
    case DB.POSTGRES:
      return jsonToPostgreSQL(diagram);
    case DB.MARIADB:
      return toMariaDB(diagram);
    case DB.MSSQL:
      return toMSSQL(diagram);
    case DB.ORACLESQL:
      return toOracleSQL(diagram);
    default:
      return "";
  }
}
