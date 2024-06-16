import { DB } from "../../data/constants";
import { toMariaDB } from "./mariadb";
import { toSqlite } from "./sqlite";

export function exportSQL(diagram) {
  switch (diagram.database) {
    case DB.SQLITE:
      return toSqlite(diagram);
    case DB.MYSQL:
      return "hi from mysql";
    case DB.POSTGRES:
      return "hi from postgres";
    case DB.MARIADB:
      return toMariaDB(diagram);
    case DB.MSSQL:
      return "hi from mssql";
    default:
      return "";
  }
}
