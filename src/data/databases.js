import mysqlImage from "../assets/mysql-icon.png";
import postgresImage from "../assets/postgres-icon.png";
import sqliteImage from "../assets/sqlite-icon.png";
import mariadbImage from "../assets/mariadb-icon.png";
import mssqlImage from "../assets/mssql-icon.png";
import i18n from "../i18n/i18n";
import { DB } from "./constants";

export const databases = [
  {
    name: "MySQL",
    label: DB.MYSQL,
    image: mysqlImage,
  },
  {
    name: "PostgreSQL",
    label: DB.POSTGRES,
    image: postgresImage,
  },
  {
    name: "SQLite",
    label: DB.SQLITE,
    image: sqliteImage,
  },
  {
    name: "MariaDB",
    label: DB.MARIADB,
    image: mariadbImage,
  },
  {
    name: "MSSQL",
    label: DB.MSSQL,
    image: mssqlImage,
  },
  {
    name: i18n.t("generic"),
    label: DB.GENERIC,
    image: null,
    description: i18n.t("generic_description"),
  },
];
