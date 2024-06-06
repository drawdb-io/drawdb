import mysqlImage from "../assets/mysql-icon.png";
import postgresImage from "../assets/postgres-icon.png";
import sqliteImage from "../assets/sqlite-icon.png";
import mariadbImage from "../assets/mariadb-icon.png";
import mssqlImage from "../assets/mssql-icon.png";

export const databases = [
  {
    name: "MySQL",
    label: "mysql",
    image: mysqlImage,
  },
  {
    name: "PostgreSQL",
    label: "postgresql",
    image: postgresImage,
  },
  {
    name: "SQLite",
    label: "sqlite",
    image: sqliteImage,
  },
  {
    name: "MariaDB",
    label: "mariadb",
    image: mariadbImage,
  },
  {
    name: "MSSQL",
    label: "mssql",
    image: mssqlImage,
  },
  {
    name: "Generic",
    label: "generic",
    image: null,
    description:
      "Generic diagrams can be exported to any SQL flavor but support few data types.",
  },
];
