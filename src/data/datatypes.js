import { strHasQuotes } from "../utils/utils";

const intRegex = /^-?\d*$/;
const doubleRegex = /^-?\d*.?\d+$/;
const binaryRegex = /^[01]+$/;

/* eslint-disable no-unused-vars */
export const defaultTypes = {
  INTEGER: {
    type: "INTEGER",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  SMALLINT: {
    type: "SMALLINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  BIGINT: {
    type: "BIGINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    isSized: false,
    hasCheck: true,
    hasPrecision: false,
    canIncrement: true,
  },
  DECIMAL: {
    type: "DECIMAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  FLOAT: {
    type: "FLOAT",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DOUBLE: {
    type: "DOUBLE",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  REAL: {
    type: "REAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
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
    checkDefault: (field) => true,
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
    hasQuotes: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    checkDefault: (field) => {
      return (
        field.default.toLowerCase() === "false" ||
        field.default.toLowerCase() === "true" ||
        field.default === "0" ||
        field.default === "1"
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
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
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  JSON: {
    type: "JSON",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  UUID: {
    type: "UUID",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  ENUM: {
    type: "ENUM",
    checkDefault: (field) => {
      return field.values.includes(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
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
    noDefault: true,
  },
};

export const mysqlTypes = {
  TINYINT: {
    type: "TINYINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  SMALLINT: {
    type: "SMALLINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  MEDIUMINT: {
    type: "MEDIUMINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  INTEGER: {
    type: "INTEGER",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  BIGINT: {
    type: "BIGINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  DECIMAL: {
    type: "DECIMAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  FLOAT: {
    type: "FLOAT",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DOUBLE: {
    type: "DOUBLE",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BIT: {
    type: "BIT",
    checkDefault: (field) => {
      return field.default === "1" || field.default === "0";
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    checkDefault: (field) => {
      return (
        field.default.toLowerCase() === "false" ||
        field.default.toLowerCase() === "true" ||
        field.default === "0" ||
        field.default === "1"
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
  },
  TIME: {
    type: "TIME",
    checkDefault: (field) => {
      return /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
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
    hasQuotes: true,
  },
  YEAR: {
    type: "YEAR",
    checkDefault: (field) => {
      return /^\d{4}$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
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
  TINYBLOB: {
    type: "TINYBLOB",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  BLOB: {
    type: "BLOB",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MEDIUMBLOB: {
    type: "MEDIUMBLOB",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  LONGBLOB: {
    type: "LONGBLOB",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  TINYTEXT: {
    type: "TINYTEXT",
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  TEXT: {
    type: "TEXT",
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  MEDIUMTEXT: {
    type: "MEDIUMTEXT",
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  LONGTEXT: {
    type: "LONGTEXT",
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  ENUM: {
    type: "ENUM",
    checkDefault: (field) => {
      return field.values.includes(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
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
    noDefault: true,
  },
  GEOMETRY: {
    type: "GEOMETRY",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  POINT: {
    type: "POINT",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  LINESTRING: {
    type: "LINESTRING",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  POLYGON: {
    type: "POLYGON",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTIPOINT: {
    type: "MULTIPOINT",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTILINESTRING: {
    type: "MULTILINESTRING",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTIPOLYGON: {
    type: "MULTIPOLYGON",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  GEOMETRYCOLLECTION: {
    type: "GEOMETRYCOLLECTION",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  JSON: {
    type: "JSON",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
};

export const postgresTypes = {
  SMALLINT: {
    type: "SMALLINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  INTEGER: {
    type: "INTEGER",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  BIGINT: {
    type: "BIGINT",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  DECIMAL: {
    type: "DECIMAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  REAL: {
    type: "REAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  "DOUBLE PRECISION": {
    type: "DOUBLE PRECISION",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  SMALLSERIAL: {
    type: "SMALLSERIAL",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
  },
  SERIAL: {
    type: "SERIAL",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
  },
  BIGSERIAL: {
    type: "BIGSERIAL",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
  },
  MONEY: {
    type: "MONEY",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
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
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  BYTEA: {
    type: "BYTEA",
    checkDefault: (field) => {
      return /^[0-9a-fA-F]*$/.test(field.default);
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
    hasQuotes: true,
  },
  TIMESTAMPTZ: {
    type: "TIMESTAMPTZ",
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})?$/.test(
        field.default,
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  INTERVAL: {
    type: "INTERVAL",
    checkDefault: (field) => /^['"\d\s\\-]+$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    checkDefault: (field) => /^(true|false)$/i.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  ENUM: {
    type: "ENUM",
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  POINT: {
    type: "POINT",
    checkDefault: (field) => /^\(\d+,\d+\)$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  LINE: {
    type: "LINE",
    checkDefault: (field) => /^(\(\d+,\d+\),)+\(\d+,\d+\)$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  LSEG: {
    type: "LSEG",
    checkDefault: (field) => /^(\(\d+,\d+\),)+\(\d+,\d+\)$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  BOX: {
    type: "BOX",
    checkDefault: (field) =>
      /^\(\d+(\.\d+)?,\d+(\.\d+)?\),\(\d+(\.\d+)?,\d+(\.\d+)?\)$/.test(
        field.default,
      ),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  PATH: {
    type: "PATH",
    checkDefault: (field) =>
      /^\((\d+(\.\d+)?,\d+(\.\d+)?(,\d+(\.\d+)?,\d+(\.\d+)?)*?)\)$/.test(
        field.default,
      ),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  POLYGON: {
    type: "POLYGON",
    checkDefault: (field) =>
      /^\((\d+(\.\d+)?,\d+(\.\d+)?(,\d+(\.\d+)?,\d+(\.\d+)?)*?)\)$/.test(
        field.default,
      ),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  CIRCLE: {
    type: "CIRCLE",
    checkDefault: (field) =>
      /^<\(\d+(\.\d+)?,\d+(\.\d+)?\),\d+(\.\d+)?\\>$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  CIDR: {
    type: "CIDR",
    checkDefault: (field) =>
      /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  INET: {
    type: "INET",
    checkDefault: (field) =>
      /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  MACADDR: {
    type: "MACADDR",
    checkDefault: (field) =>
      /^([A-Fa-f0-9]{2}:){5}[A-Fa-f0-9]{2}$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  MACADDR8: {
    type: "MACADDR8",
    checkDefault: (field) =>
      /^([A-Fa-f0-9]{2}:){7}[A-Fa-f0-9]{2}$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  BIT: {
    type: "BIT",
    checkDefault: (field) => /^[01]{1,}$/.test(field.default),
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: false,
  },
  VARBIT: {
    type: "VARBIT",
    checkDefault: (field) => /^[01]*$/.test(field.default),
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: false,
  },
  TSVECTOR: {
    type: "TSVECTOR",
    checkDefault: (field) => /^[A-Za-z0-9: ]*$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  TSQUERY: {
    type: "TSQUERY",
    checkDefault: (field) => /^[A-Za-z0-9: &|!()]*$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  JSON: {
    type: "JSON",
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  JSONB: {
    type: "JSONB",
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  UUID: {
    type: "UUID",
    checkDefault: (field) =>
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        field.default,
      ),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  XML: {
    type: "XML",
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  ARRAY: {
    type: "ARRAY",
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
    noDefault: true,
  },
};

export const sqliteTypes = {
  INTEGER: {
    type: "INTEGER",
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  REAL: {
    type: "REAL",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    checkDefault: (field) => {
      return (
        field.default.toLowerCase() === "false" ||
        field.default.toLowerCase() === "true" ||
        field.default === "0" ||
        field.default === "1"
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
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
    checkDefault: (field) => true,
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  BLOB: {
    type: "BLOB",
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  TIME: {
    type: "TIME",
    checkDefault: (field) => {
      return /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
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
    hasQuotes: true,
  },
};

export const mssqlTypes = {
  BIGINT: { type: "", checkDefault: (field) => {} },
  INTEGER: { type: "", checkDefault: (field) => {} },
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
  mariadb: mysqlTypes,
};

export const dbToTypes = new Proxy(dbToTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : []),
});
