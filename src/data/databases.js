import mysqlImage from "../assets/mysql-icon.png";
import postgresImage from "../assets/postgres-icon.png";
import sqliteImage from "../assets/sqlite-icon.png";
import mariadbImage from "../assets/mariadb-icon.png";
import mssqlImage from "../assets/mssql-icon.png";
import oraclesqlImage from "../assets/oraclesql-icon.png";
import i18n from "../i18n/i18n";
import { DB } from "./constants";

export const databases = new Proxy(
  {
    [DB.MYSQL]: {
      name: "MySQL",
      label: DB.MYSQL,
      image: mysqlImage,
      description: i18n.t("db_mysql_description"),
      hasTypes: false,
      hasUnsignedTypes: true,
    },
    [DB.POSTGRES]: {
      name: "PostgreSQL",
      label: DB.POSTGRES,
      image: postgresImage,
      description: i18n.t("db_postgresql_description"),
      hasTypes: true,
      hasEnums: true,
      hasArrays: true,
    },
    [DB.SQLITE]: {
      name: "SQLite",
      label: DB.SQLITE,
      image: sqliteImage,
      description: i18n.t("db_sqlite_description"),
      hasTypes: false,
    },
    [DB.MARIADB]: {
      name: "MariaDB",
      label: DB.MARIADB,
      image: mariadbImage,
      description: i18n.t("db_mariadb_description"),
      hasTypes: false,
      hasUnsignedTypes: true,
    },
    [DB.MSSQL]: {
      name: "MSSQL",
      label: DB.MSSQL,
      image: mssqlImage,
      description: i18n.t("db_transactsql_description"),
      hasTypes: false,
    },
    [DB.ORACLESQL]: {
      name: "Oracle SQL",
      label: DB.ORACLESQL,
      image: oraclesqlImage,
      description: i18n.t("db_oraclesql_description"),
      hasTypes: false,
      hasEnums: false,
      hasArrays: false,
      beta: true,
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
