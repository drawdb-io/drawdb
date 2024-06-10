import { strHasQuotes } from "../utils/utils";

const intRegex = /^-?\d*$/;
const doubleRegex = /^-?\d*.?\d+$/;
const binaryRegex = /^[01]+$/;

/* eslint-disable no-unused-vars */
export const defaultTypes = {
  INT: {
    type: "INT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
  },
  SMALLINT: {
    type: "SMALLINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
  },
  BIGINT: {
    type: "BIGINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    isSized: false,
    hasCheck: true,
    hasPrecision: false,
    defaultSize: null,
  },
  DECIMAL: {
    type: "DECIMAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    defaultSize: null,
  },
  NUMERIC: {
    type: "NUMERIC",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    defaultSize: null,
  },
  FLOAT: {
    type: "FLOAT",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    defaultSize: null,
  },
  DOUBLE: {
    type: "DOUBLE",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    defaultSize: null,
  },
  REAL: {
    type: "REAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
  },
  CHAR: {
    type: "CHAR",
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: true,
  },
  VARCHAR: {
    type: "VARCHAR",
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 255,
    hasQuotes: true,
  },
  TEXT: {
    type: "TEXT",
    checkDefault: (field) => false,
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  TIME: {
    type: "TIME",
    checkDefault: (field) => {
      return /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  TIMESTAMP: {
    type: "TIMESTAMP",
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");
      return parseInt(date[0]) >= 1970 && parseInt(date[0]) <= 2038;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  DATE: {
    type: "DATE",
    checkDefault: (field) => {
      return /^\d{4}-\d{2}-\d{2}$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  DATETIME: {
    type: "DATETIME",
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return parseInt(d[0]) >= 1000 && parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    checkDefault: (field) => {
      return (
        field.default.trim().toLowerCase() === "false" ||
        field.default.trim().toLowerCase() === "true"
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
  },
  BINARY: {
    type: "BINARY",
    checkDefault: (field) => {
      return (
        field.default.length <= field.size && binaryRegex.test(field.default)
      );
    },
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: true,
  },
  VARBINARY: {
    type: "VARBINARY",
    checkDefault: (field) => {
      return (
        field.default.length <= field.size && binaryRegex.test(field.default)
      );
    },
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 255,
    hasQuotes: true,
  },
  BLOB: {
    type: "BLOB",
    checkDefault: (field) => false,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    defaultSize: null,
  },
  JSON: {
    type: "JSON",
    checkDefault: (field) => false,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    defaultSize: null,
  },
  UUID: {
    type: "UUID",
    checkDefault: (field) => false,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    defaultSize: null,
  },
  ENUM: {
    type: "ENUM",
    checkDefault: (field) => {
      return field.values.includes(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  SET: {
    type: "SET",
    checkDefault: (field) => {
      const defaultValues = field.default.split(",");
      for (let i = 0; i < defaultValues.length; i++) {
        if (!field.values.includes(defaultValues[i].trim())) return false;
      }
      return true;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
  },
};

export const mysqlTypes = {
  TINYINT: { type: "TINYINT", checkDefault: (field) => {} },
  SMALLINT: { type: "SMALLINT", checkDefault: (field) => {} },
  MEDIUMINT: { type: "MEDIUMINT", checkDefault: (field) => {} },
  INT: { type: "INT", checkDefault: (field) => {} },
  INTEGER: { type: "INTEGER", checkDefault: (field) => {} },
  BIGINT: { type: "BIGINT", checkDefault: (field) => {} },
  DECIMAL: { type: "DECIMAL", checkDefault: (field) => {} },
  NUMERIC: { type: "NUMERIC", checkDefault: (field) => {} },
  FLOAT: { type: "FLOAT", checkDefault: (field) => {} },
  DOUBLE: { type: "DOUBLE", checkDefault: (field) => {} },
  BIT: { type: "BIT", checkDefault: (field) => {} },
  BOOLEAN: { type: "BOOLEAN", checkDefault: (field) => {} },
  DATE: { type: "DATE", checkDefault: (field) => {} },
  DATETIME: { type: "DATETIME", checkDefault: (field) => {} },
  TIMESTAMP: { type: "TIMESTAMP", checkDefault: (field) => {} },
  TIME: { type: "TIME", checkDefault: (field) => {} },
  YEAR: { type: "YEAR", checkDefault: (field) => {} },
  CHAR: { type: "CHAR", checkDefault: (field) => {} },
  VARCHAR: { type: "VARCHAR", checkDefault: (field) => {} },
  BINARY: { type: "BINARY", checkDefault: (field) => {} },
  VARBINARY: { type: "VARBINARY", checkDefault: (field) => {} },
  TINYBLOB: { type: "TINYBLOB", checkDefault: (field) => {} },
  BLOB: { type: "BLOB", checkDefault: (field) => {} },
  MEDIUMBLOB: { type: "MEDIUMBLOB", checkDefault: (field) => {} },
  LONGBLOB: { type: "LONGBLOB", checkDefault: (field) => {} },
  TINYTEXT: { type: "TINYTEXT", checkDefault: (field) => {} },
  TEXT: { type: "TEXT", checkDefault: (field) => {} },
  MEDIUMTEXT: { type: "MEDIUMTEXT", checkDefault: (field) => {} },
  LONGTEXT: { type: "LONGTEXT", checkDefault: (field) => {} },
  ENUM: { type: "ENUM", checkDefault: (field) => {} },
  SET: { type: "SET", checkDefault: (field) => {} },
  GEOMETRY: { type: "GEOMETRY", checkDefault: (field) => {} },
  POINT: { type: "POINT", checkDefault: (field) => {} },
  LINESTRING: { type: "LINESTRING", checkDefault: (field) => {} },
  POLYGON: { type: "POLYGON", checkDefault: (field) => {} },
  MULTIPOINT: { type: "MULTIPOINT", checkDefault: (field) => {} },
  MULTILINESTRING: { type: "MULTILINESTRING", checkDefault: (field) => {} },
  MULTIPOLYGON: { type: "MULTIPOLYGON", checkDefault: (field) => {} },
  GEOMETRYCOLLECTION: {
    type: "GEOMETRYCOLLECTION",
    checkDefault: (field) => {},
  },
  JSON: { type: "JSON", checkDefault: (field) => {} },
};

export const postgresTypes = {
  SMALLINT: { type: "SMALLINT", checkDefault: (field) => {} },
  INTEGER: { type: "INTEGER", checkDefault: (field) => {} },
  BIGINT: { type: "BIGINT", checkDefault: (field) => {} },
  DECIMAL: { type: "DECIMAL", checkDefault: (field) => {} },
  NUMERIC: { type: "NUMERIC", checkDefault: (field) => {} },
  REAL: { type: "REAL", checkDefault: (field) => {} },
  "DOUBLE PRECISION": { type: "DOUBLE PRECISION", checkDefault: (field) => {} },
  SMALLSERIAL: { type: "SMALLSERIAL", checkDefault: (field) => {} },
  SERIAL: { type: "SERIAL", checkDefault: (field) => {} },
  BIGSERIAL: { type: "BIGSERIAL", checkDefault: (field) => {} },
  MONEY: { type: "MONEY", checkDefault: (field) => {} },
  CHARACTER: { type: "CHARACTER", checkDefault: (field) => {} },
  CHAR: { type: "CHAR", checkDefault: (field) => {} },
  VARCHAR: { type: "VARCHAR", checkDefault: (field) => {} },
  TEXT: { type: "TEXT", checkDefault: (field) => {} },
  BYTEA: { type: "BYTEA", checkDefault: (field) => {} },
  DATE: { type: "DATE", checkDefault: (field) => {} },
  TIME: { type: "TIME", checkDefault: (field) => {} },
  TIMESTAMP: { type: "TIMESTAMP", checkDefault: (field) => {} },
  TIMESTAMPTZ: { type: "TIMESTAMPTZ", checkDefault: (field) => {} },
  INTERVAL: { type: "INTERVAL", checkDefault: (field) => {} },
  BOOLEAN: { type: "BOOLEAN", checkDefault: (field) => {} },
  ENUM: { type: "ENUM", checkDefault: (field) => {} },
  POINT: { type: "POINT", checkDefault: (field) => {} },
  LINE: { type: "LINE", checkDefault: (field) => {} },
  LSEG: { type: "LSEG", checkDefault: (field) => {} },
  BOX: { type: "BOX", checkDefault: (field) => {} },
  PATH: { type: "PATH", checkDefault: (field) => {} },
  POLYGON: { type: "POLYGON", checkDefault: (field) => {} },
  CIRCLE: { type: "CIRCLE", checkDefault: (field) => {} },
  CIDR: { type: "CIDR", checkDefault: (field) => {} },
  INET: { type: "INET", checkDefault: (field) => {} },
  MACADDR: { type: "MACADDR", checkDefault: (field) => {} },
  MACADDR8: { type: "", checkDefault: (field) => {} },
  BIT: { type: "", checkDefault: (field) => {} },
  VARBIT: { type: "", checkDefault: (field) => {} },
  TSVECTOR: { type: "", checkDefault: (field) => {} },
  TSQUERY: { type: "", checkDefault: (field) => {} },
  JSON: { type: "", checkDefault: (field) => {} },
  JSONB: { type: "", checkDefault: (field) => {} },
  UUID: { type: "", checkDefault: (field) => {} },
  XML: { type: "", checkDefault: (field) => {} },
  ARRAY: { type: "", checkDefault: (field) => {} },
};

export const sqliteTypes = {
  INT: {
    type: "INT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
  },
  REAL: {
    type: "REAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    defaultSize: null,
  },
  TEXT: {
    type: "TEXT",
    checkDefault: (field) => false,
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  BLOB: {
    type: "BLOB",
    checkDefault: (field) => false,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    defaultSize: null,
  },
  NUMERIC: {
    type: "NUMERIC",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    defaultSize: null,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    checkDefault: (field) => {
      return (
        field.default.trim().toLowerCase() === "false" ||
        field.default.trim().toLowerCase() === "true"
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
  },
  TIME: {
    type: "TIME",
    checkDefault: (field) => {
      return /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  TIMESTAMP: {
    type: "TIMESTAMP",
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");
      return parseInt(date[0]) >= 1970 && parseInt(date[0]) <= 2038;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  DATE: {
    type: "DATE",
    checkDefault: (field) => {
      return /^\d{4}-\d{2}-\d{2}$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
  DATETIME: {
    type: "DATETIME",
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return parseInt(d[0]) >= 1000 && parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    defaultSize: null,
    hasQuotes: true,
  },
};

export const mariadbTypes = {
  TINYINT: { type: " ", checkDefault: (field) => {} },
  SMALLINT: { type: "", checkDefault: (field) => {} },
  MEDIUMINT: { type: "", checkDefault: (field) => {} },
  INT: { type: "", checkDefault: (field) => {} },
  INTEGER: { type: "", checkDefault: (field) => {} },
  BIGINT: { type: "", checkDefault: (field) => {} },
  DECIMAL: { type: "", checkDefault: (field) => {} },
  NUMERIC: { type: "", checkDefault: (field) => {} },
  FLOAT: { type: "", checkDefault: (field) => {} },
  DOUBLE: { type: "", checkDefault: (field) => {} },
  BIT: { type: "", checkDefault: (field) => {} },
  BOOLEAN: { type: "", checkDefault: (field) => {} },
  DATE: { type: "", checkDefault: (field) => {} },
  DATETIME: { type: "", checkDefault: (field) => {} },
  TIMESTAMP: { type: "", checkDefault: (field) => {} },
  TIME: { type: "", checkDefault: (field) => {} },
  YEAR: { type: "", checkDefault: (field) => {} },
  CHAR: { type: "", checkDefault: (field) => {} },
  VARCHAR: { type: "", checkDefault: (field) => {} },
  BINARY: { type: "", checkDefault: (field) => {} },
  VARBINARY: { type: "", checkDefault: (field) => {} },
  TINYBLOB: { type: "", checkDefault: (field) => {} },
  BLOB: { type: "", checkDefault: (field) => {} },
  MEDIUMBLOB: { type: "", checkDefault: (field) => {} },
  LONGBLOB: { type: "", checkDefault: (field) => {} },
  TINYTEXT: { type: "", checkDefault: (field) => {} },
  TEXT: { type: "", checkDefault: (field) => {} },
  MEDIUMTEXT: { type: "", checkDefault: (field) => {} },
  LONGTEXT: { type: "", checkDefault: (field) => {} },
  ENUM: { type: "", checkDefault: (field) => {} },
  SET: { type: "", checkDefault: (field) => {} },
  GEOMETRY: { type: "", checkDefault: (field) => {} },
  POINT: { type: "", checkDefault: (field) => {} },
  LINESTRING: { type: "", checkDefault: (field) => {} },
  POLYGON: { type: "", checkDefault: (field) => {} },
  MULTIPOINT: { type: "", checkDefault: (field) => {} },
  MULTILINESTRING: { type: "", checkDefault: (field) => {} },
  MULTIPOLYGON: { type: "", checkDefault: (field) => {} },
  GEOMETRYCOLLECTION: { type: "", checkDefault: (field) => {} },
  JSON: { type: "", checkDefault: (field) => {} },
};

export const mssqlTypes = {
  BIGINT: { type: "", checkDefault: (field) => {} },
  INT: { type: "", checkDefault: (field) => {} },
  SMALLINT: { type: "", checkDefault: (field) => {} },
  TINYINT: { type: "", checkDefault: (field) => {} },
  BIT: { type: "", checkDefault: (field) => {} },
  DECIMAL: { type: "", checkDefault: (field) => {} },
  NUMERIC: { type: "", checkDefault: (field) => {} },
  MONEY: { type: "", checkDefault: (field) => {} },
  SMALLMONEY: { type: "", checkDefault: (field) => {} },
  FLOAT: { type: "", checkDefault: (field) => {} },
  REAL: { type: "", checkDefault: (field) => {} },
  DATE: { type: "", checkDefault: (field) => {} },
  TIME: { type: "", checkDefault: (field) => {} },
  DATETIME: { type: "", checkDefault: (field) => {} },
  DATETIME2: { type: "", checkDefault: (field) => {} },
  DATETIMEOFFSET: { type: "", checkDefault: (field) => {} },
  SMALLDATETIME: { type: "", checkDefault: (field) => {} },
  TIMESTAMP: { type: "", checkDefault: (field) => {} },
  CHAR: { type: "", checkDefault: (field) => {} },
  VARCHAR: { type: "", checkDefault: (field) => {} },
  TEXT: { type: "", checkDefault: (field) => {} },
  NCHAR: { type: "", checkDefault: (field) => {} },
  NVARCHAR: { type: "", checkDefault: (field) => {} },
  NTEXT: { type: "", checkDefault: (field) => {} },
  BINARY: { type: "", checkDefault: (field) => {} },
  VARBINARY: { type: "", checkDefault: (field) => {} },
  IMAGE: { type: "", checkDefault: (field) => {} },
  UNIQUEIDENTIFIER: { type: "", checkDefault: (field) => {} },
  XML: { type: "", checkDefault: (field) => {} },
  CURSOR: { type: "", checkDefault: (field) => {} },
  TABLE: { type: "", checkDefault: (field) => {} },
  SQL_VARIANT: { type: "", checkDefault: (field) => {} },
  JSON: { type: "", checkDefault: (field) => {} },
};

const dbToTypesBase = {
  generic: defaultTypes,
  mysql: mysqlTypes,
  postgresql: postgresTypes,
  sqlite: sqliteTypes,
  mssql: mssqlTypes,
  mariadb: mariadbTypes,
};

export const dbToTypes = new Proxy(dbToTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : []),
});
