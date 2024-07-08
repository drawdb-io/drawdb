import mysqlImage from "../assets/mysql-icon.png";
import postgresImage from "../assets/postgres-icon.png";
import sqliteImage from "../assets/sqlite-icon.png";
import mariadbImage from "../assets/mariadb-icon.png";
import mssqlImage from "../assets/mssql-icon.png";
import i18n from "../i18n/i18n";
import { DB } from "./constants";

export const databases = new Proxy(
  {
    [DB.MYSQL]: {
      name: "MySQL",
      label: DB.MYSQL,
      image: mysqlImage,
      hasTypes: false,
    },
    [DB.POSTGRES]: {
      name: "PostgreSQL",
      label: DB.POSTGRES,
      image: postgresImage,
      hasTypes: true,
      hasEnums: true,
      hasArrays: true,
    },
    [DB.SQLITE]: {
      name: "SQLite",
      label: DB.SQLITE,
      image: sqliteImage,
      hasTypes: false,
    },
    [DB.MARIADB]: {
      name: "MariaDB",
      label: DB.MARIADB,
      image: mariadbImage,
      hasTypes: false,
    },
    [DB.MSSQL]: {
      name: "MSSQL",
      label: DB.MSSQL,
      image: mssqlImage,
      hasTypes: false,
    },
    [DB.GENERIC]: {
      name: i18n.t("generic"),
      label: DB.GENERIC,
      image: null,
      description: i18n.t("generic_description"),
      hasTypes: true,
    },
  },
  { get: (target, prop) => (prop in target ? target[prop] : {}) },
);
