import { strHasQuotes } from "../utils/utils";
import {
  binaryColor,
  booleanColor,
  dateColor,
  decimalColor,
  documentColor,
  enumSetColor,
  geometricColor,
  intColor,
  networkIdColor,
  otherColor,
  stringColor,
  vectorColor,
} from "./constants";
import { DB } from "./constants";

const intRegex = /^-?\d*$/;
const doubleRegex = /^-?\d*.?\d+$/;
const binaryRegex = /^[01]+$/;

/* eslint-disable no-unused-vars */
const defaultTypesBase = {
  INT: {
    type: "INT",
    color: intColor,
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
    color: intColor,
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
    color: intColor,
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
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMBER: {
    type: "NUMBER",
    color: decimalColor,
    checkDefault: (field) => {
      return /^-?\d+(\.\d+)?$/.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    canIncrement: false,
  },
  FLOAT: {
    type: "FLOAT",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DOUBLE: {
    type: "DOUBLE",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  REAL: {
    type: "REAL",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
  },
  CHAR: {
    type: "CHAR",
    color: stringColor,
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
    color: stringColor,
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
  VARCHAR2: {
    type: "VARCHAR2",
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 225,
    hasQuotes: true,
  },
  TEXT: {
    type: "TEXT",
    color: stringColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  TIME: {
    type: "TIME",
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");
      return (
        Number.parseInt(date[0]) >= 1970 && Number.parseInt(date[0]) <= 2038
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  DATE: {
    type: "DATE",
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return Number.parseInt(d[0]) >= 1000 && Number.parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    color: booleanColor,
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
    color: binaryColor,
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
    color: binaryColor,
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
    color: binaryColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  CLOB: {
    type: "CLOB",
    color: stringColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  NCLOB: {
    type: "NCLOB",
    color: stringColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  JSON: {
    type: "JSON",
    color: documentColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  UUID: {
    type: "UUID",
    color: networkIdColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: false,
  },
  ENUM: {
    type: "ENUM",
    color: enumSetColor,
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
    color: enumSetColor,
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

export const defaultTypes = new Proxy(defaultTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});

const mysqlTypesBase = {
  TINYINT: {
    type: "TINYINT",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  SMALLINT: {
    type: "SMALLINT",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  MEDIUMINT: {
    type: "MEDIUMINT",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  INTEGER: {
    type: "INTEGER",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  BIGINT: {
    type: "BIGINT",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  DECIMAL: {
    type: "DECIMAL",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  FLOAT: {
    type: "FLOAT",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DOUBLE: {
    type: "DOUBLE",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BIT: {
    type: "BIT",
    color: binaryColor,
    checkDefault: (field) => {
      return field.default === "1" || field.default === "0";
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    color: booleanColor,
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
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");
      return (
        Number.parseInt(date[0]) >= 1970 && Number.parseInt(date[0]) <= 2038
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  DATE: {
    type: "DATE",
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return Number.parseInt(d[0]) >= 1000 && Number.parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  YEAR: {
    type: "YEAR",
    color: dateColor,
    checkDefault: (field) => {
      return /^\d{4}$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
  },
  CHAR: {
    type: "CHAR",
    color: stringColor,
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
    color: stringColor,
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
    color: binaryColor,
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
    color: binaryColor,
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
    color: binaryColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  BLOB: {
    type: "BLOB",
    color: binaryColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MEDIUMBLOB: {
    type: "MEDIUMBLOB",
    color: binaryColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  LONGBLOB: {
    type: "LONGBLOB",
    color: binaryColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  TINYTEXT: {
    type: "TINYTEXT",
    color: stringColor,
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
    color: stringColor,
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
    color: stringColor,
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
    color: stringColor,
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
    color: enumSetColor,
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
    color: enumSetColor,
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
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  POINT: {
    type: "POINT",
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  LINESTRING: {
    type: "LINESTRING",
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  POLYGON: {
    type: "POLYGON",
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTIPOINT: {
    type: "MULTIPOINT",
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTILINESTRING: {
    type: "MULTILINESTRING",
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTIPOLYGON: {
    type: "MULTIPOLYGON",
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  GEOMETRYCOLLECTION: {
    type: "GEOMETRYCOLLECTION",
    color: geometricColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  JSON: {
    type: "JSON",
    color: documentColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
};

export const mysqlTypes = new Proxy(mysqlTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});

const postgresTypesBase = {
  SMALLINT: {
    type: "SMALLINT",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    compatibleWith: ["SMALLSERIAL", "SERIAL", "BIGSERIAL", "INTEGER", "BIGINT"],
  },
  INTEGER: {
    type: "INTEGER",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    compatibleWith: [
      "SMALLSERIAL",
      "SERIAL",
      "BIGSERIAL",
      "SMALLINT",
      "BIGINT",
    ],
  },
  BIGINT: {
    type: "BIGINT",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    compatibleWith: [
      "SMALLSERIAL",
      "SERIAL",
      "BIGSERIAL",
      "INTEGER",
      "SMALLINT",
    ],
  },
  DECIMAL: {
    type: "DECIMAL",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  REAL: {
    type: "REAL",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  "DOUBLE PRECISION": {
    type: "DOUBLE PRECISION",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  SMALLSERIAL: {
    type: "SMALLSERIAL",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    compatibleWith: ["INTEGER", "SERIAL", "BIGSERIAL", "SMALLINT", "BIGINT"],
  },
  SERIAL: {
    type: "SERIAL",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    compatibleWith: [
      "INTEGER",
      "SMALLSERIAL",
      "BIGSERIAL",
      "SMALLINT",
      "BIGINT",
    ],
  },
  BIGSERIAL: {
    type: "BIGSERIAL",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    compatibleWith: ["INTEGER", "SERIAL", "SMALLSERIAL", "SMALLINT", "BIGINT"],
  },
  MONEY: {
    type: "MONEY",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  CHAR: {
    type: "CHAR",
    color: stringColor,
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
    color: stringColor,
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
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  BYTEA: {
    type: "BYTEA",
    color: binaryColor,
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
    color: dateColor,
    checkDefault: (field) => {
      const specialValues = [
        "epoch",
        "infinity",
        "-infinity",
        "now",
        "today",
        "tomorrow",
        "yesterday",
      ];
      return (
        /^\d{4}-\d{2}-\d{2}$/.test(field.default) ||
        specialValues.includes(field.default.toLowerCase())
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  TIME: {
    type: "TIME",
    color: dateColor,
    checkDefault: (field) => {
      const specialValues = ["now", "allballs"];
      return (
        /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/.test(field.default) ||
        specialValues.includes(field.default.toLowerCase())
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  TIMETZ: {
    type: "TIMETZ",
    color: dateColor,
    checkDefault: (field) => {
      const specialValues = ["now", "allballs"];
      return (
        /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d([+-]\d{2}:\d{2})?$/.test(
          field.default,
        ) || specialValues.includes(field.default.toLowerCase())
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  TIMESTAMP: {
    type: "TIMESTAMP",
    color: dateColor,
    checkDefault: (field) => {
      const content = field.default.split(" ");
      const date = content[0].split("-");
      const specialValues = [
        "epoch",
        "infinity",
        "-infinity",
        "now",
        "today",
        "tomorrow",
        "yesterday",
        "current_timestamp",
      ];
      return (
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default) ||
        (Number.parseInt(date[0]) >= 1970 &&
          Number.parseInt(date[0]) <= 2038) ||
        specialValues.includes(field.default.toLowerCase())
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  TIMESTAMPTZ: {
    type: "TIMESTAMPTZ",
    color: dateColor,
    checkDefault: (field) => {
      const specialValues = [
        "epoch",
        "infinity",
        "-infinity",
        "now",
        "today",
        "tomorrow",
        "yesterday",
        "current_timestamp",
      ];
      return (
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})?$/.test(
          field.default,
        ) || specialValues.includes(field.default.toLowerCase())
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  INTERVAL: {
    type: "INTERVAL",
    color: dateColor,
    checkDefault: (field) => /^['"\d\s\\-]+$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    color: booleanColor,
    checkDefault: (field) => /^(true|false)$/i.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  POINT: {
    type: "POINT",
    color: geometricColor,
    checkDefault: (field) => /^\(\d+,\d+\)$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  LINE: {
    type: "LINE",
    color: geometricColor,
    checkDefault: (field) => /^(\(\d+,\d+\),)+\(\d+,\d+\)$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  LSEG: {
    type: "LSEG",
    color: geometricColor,
    checkDefault: (field) => /^(\(\d+,\d+\),)+\(\d+,\d+\)$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  BOX: {
    type: "BOX",
    color: geometricColor,
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
    color: geometricColor,
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
    color: geometricColor,
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
    color: geometricColor,
    checkDefault: (field) =>
      /^<\(\d+(\.\d+)?,\d+(\.\d+)?\),\d+(\.\d+)?\\>$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  CIDR: {
    type: "CIDR",
    color: networkIdColor,
    checkDefault: (field) =>
      /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  INET: {
    type: "INET",
    color: networkIdColor,
    checkDefault: (field) =>
      /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  MACADDR: {
    type: "MACADDR",
    color: networkIdColor,
    checkDefault: (field) =>
      /^([A-Fa-f0-9]{2}:){5}[A-Fa-f0-9]{2}$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  MACADDR8: {
    type: "MACADDR8",
    color: networkIdColor,
    checkDefault: (field) =>
      /^([A-Fa-f0-9]{2}:){7}[A-Fa-f0-9]{2}$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  BIT: {
    type: "BIT",
    color: binaryColor,
    checkDefault: (field) => /^[01]{1,}$/.test(field.default),
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: false,
  },
  VARBIT: {
    type: "VARBIT",
    color: binaryColor,
    checkDefault: (field) => /^[01]*$/.test(field.default),
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: false,
  },
  VECTOR: {
    type: "VECTOR",
    color: vectorColor,
    checkDefault: (field) => {
      let elements;
      let elementsStr = field.default;
      try {
        if (strHasQuotes(field.default)) {
          elementsStr = field.default.slice(1, -1);
        }
        elements = JSON.parse(elementsStr);
        return (
          Array.isArray(elements) &&
          elements.length === field.size &&
          elements.every(Number.isFinite)
        );
      } catch (e) {
        return false;
      }
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    hasQuotes: true,
  },
  HALFVEC: {
    type: "HALFVEC",
    color: vectorColor,
    checkDefault: (field) => {
      let elements;
      let elementsStr = field.default;
      try {
        if (strHasQuotes(field.default)) {
          elementsStr = field.default.slice(1, -1);
        }
        elements = JSON.parse(elementsStr);
        return (
          Array.isArray(elements) &&
          elements.length === field.size &&
          elements.every(Number.isFinite)
        );
      } catch (e) {
        return false;
      }
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    hasQuotes: true,
  },
  SPARSEVEC: {
    type: "SPARSEVEC",
    color: vectorColor,
    checkDefault: (field) => {
      let elementsStr = field.default;
      if (strHasQuotes(field.default)) {
        elementsStr = field.default.slice(1, -1);
      }
      const lengthStr = elementsStr.split("/")[1];
      const length = Number.parseInt(lengthStr);
      return length === field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    hasQuotes: true,
  },
  TSVECTOR: {
    type: "TSVECTOR",
    color: otherColor,
    checkDefault: (field) => /^[A-Za-z0-9: ]*$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  TSQUERY: {
    type: "TSQUERY",
    color: otherColor,
    checkDefault: (field) => /^[A-Za-z0-9: &|!()]*$/.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
  },
  JSON: {
    type: "JSON",
    color: documentColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  JSONB: {
    type: "JSONB",
    color: documentColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  UUID: {
    type: "UUID",
    color: networkIdColor,
    checkDefault: (field) =>
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        field.default,
      ),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: false,
  },
  XML: {
    type: "XML",
    color: documentColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
};

export const postgresTypes = new Proxy(postgresTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});

const sqliteTypesBase = {
  INTEGER: {
    type: "INTEGER",
    color: intColor,
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
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    color: booleanColor,
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
    color: stringColor,
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
    color: stringColor,
    checkDefault: (field) => true,
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  BLOB: {
    type: "BLOB",
    color: binaryColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  TIME: {
    type: "TIME",
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");
      return (
        Number.parseInt(date[0]) >= 1970 && Number.parseInt(date[0]) <= 2038
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  DATE: {
    type: "DATE",
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return Number.parseInt(d[0]) >= 1000 && Number.parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
};

export const sqliteTypes = new Proxy(sqliteTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});

const mssqlTypesBase = {
  TINYINT: {
    type: "TINYINT",
    color: intColor,
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
    color: intColor,
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
    color: intColor,
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
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  BIT: {
    type: "BIT",
    color: binaryColor,
    checkDefault: (field) => {
      return field.default === "1" || field.default === "0";
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DECIMAL: {
    type: "DECIMAL",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  FLOAT: {
    type: "FLOAT",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DOUBLE: {
    type: "DOUBLE",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  REAL: {
    type: "REAL",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
  },
  MONEY: {
    type: "MONEY",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  SMALLMONEY: {
    type: "MONEY",
    color: decimalColor,
    checkDefault: (field) => {
      return doubleRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DATE: {
    type: "DATE",
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return Number.parseInt(d[0]) >= 1000 && Number.parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  DATETIME2: {
    type: "DATETIME2",
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return Number.parseInt(d[0]) >= 1000 && Number.parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: true,
    hasQuotes: true,
  },
  DATETIMEOFFSET: {
    type: "DATETIMEOFFSET",
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (
        !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,7})?([+-]\d{2}:\d{2})?$/.test(
          field.default,
        )
      ) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return Number.parseInt(d[0]) >= 1000 && Number.parseInt(d[0]) <= 9999;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: true,
    hasQuotes: true,
  },
  SMALLDATETIME: {
    type: "SMALLDATETIME",
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return Number.parseInt(d[0]) >= 1900 && Number.parseInt(d[0]) <= 2079;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  TIME: {
    type: "TIME",
    color: dateColor,
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
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");
      return (
        Number.parseInt(date[0]) >= 1970 && Number.parseInt(date[0]) <= 2038
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  CHAR: {
    type: "CHAR",
    color: stringColor,
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
    color: stringColor,
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
    color: stringColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  NCHAR: {
    type: "CHAR",
    color: stringColor,
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
  NVARCHAR: {
    type: "VARCHAR",
    color: stringColor,
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
  NTEXT: {
    type: "TEXT",
    color: stringColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65535,
    hasQuotes: true,
  },
  BINARY: {
    type: "BINARY",
    color: binaryColor,
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
    color: binaryColor,
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
  IMAGE: {
    type: "IMAGE",
    color: binaryColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  UNIQUEIDENTIFIER: {
    type: "UNIQUEIDENTIFIER",
    color: networkIdColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  XML: {
    type: "XML",
    color: documentColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
  CURSOR: {
    type: "CURSOR",
    color: otherColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
    noDefault: true,
  },
  SQL_VARIANT: {
    type: "SQL_VARIANT",
    color: otherColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: false,
    noDefault: true,
  },
  JSON: {
    type: "JSON",
    color: documentColor,
    checkDefault: (field) => true,
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
    noDefault: true,
  },
};

export const mssqlTypes = new Proxy(mssqlTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});

const oraclesqlTypesBase = {
  INTEGER: {
    type: "INTEGER",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  NUMBER: {
    type: "NUMBER",
    color: decimalColor,
    checkDefault: (field) => {
      return /^-?\d+(\.\d+)?$/.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
    canIncrement: false,
  },
  FLOAT: {
    type: "FLOAT",
    color: decimalColor,
    checkDefault: (field) => {
      return /^-?\d+(\.\d+)?$/.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  LONG: {
    type: "LONG",
    color: intColor,
    checkDefault: (field) => {
      return intRegex.test(field.default);
    },
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
  },
  VARCHAR2: {
    type: "VARCHAR2",
    color: stringColor,
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
  NVARCHAR2: {
    type: "VARCHAR2",
    color: stringColor,
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
  CHAR: {
    type: "CHAR",
    color: stringColor,
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
  NCHAR: {
    type: "NCHAR",
    color: stringColor,
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
  CLOB: {
    type: "CLOB",
    color: stringColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  NCLOB: {
    type: "NCLOB",
    color: stringColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  BLOB: {
    type: "BLOB",
    color: binaryColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  BFILE: {
    type: "BFILE",
    color: otherColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  JSON: {
    type: "JSON",
    color: documentColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  VECTOR: {
    type: "VECTOR",
    color: vectorColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  DATE: {
    type: "DATE",
    color: dateColor,
    checkDefault: (field) => {
      return /^\d{4}-\d{2}-\d{2}$/.test(field.default);
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  TIMESTAMP: {
    type: "TIMESTAMP",
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(
        field.default,
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: true,
    hasQuotes: true,
  },
  INTERVAL: {
    type: "INTERVAL",
    color: dateColor,
    checkDefault: (field) => {
      return /^INTERVAL\s'\d+'(\s+DAY|HOUR|MINUTE|SECOND)?$/.test(
        field.default,
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    color: booleanColor,
    checkDefault: (field) => {
      return (
        field.default === "0" ||
        field.default === "1" ||
        field.default.toUpperCase() === "TRUE" ||
        field.default.toUpperCase() === "FALSE"
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
  },
  RAW: {
    type: "RAW",
    color: binaryColor,
    checkDefault: (field) => {
      return /^[0-9A-Fa-f]+$/.test(field.default);
    },
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 255,
    hasQuotes: false,
  },
};

export const oraclesqlTypes = new Proxy(oraclesqlTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});

export const mariadbTypesBase = {
  UUID: {
    type: "UUID",
    color: networkIdColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: true,
    hasPrecision: false,
    noDefault: false,
  },
  INET4: {
    type: "INET4",
    color: networkIdColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: true,
    hasPrecision: false,
    noDefault: false,
  },
  INET6: {
    type: "INET6",
    color: networkIdColor,
    checkDefault: (field) => true,
    isSized: false,
    hasCheck: true,
    hasPrecision: false,
    noDefault: false,
  },
};

export const mariadbTypes = new Proxy(
  { ...mysqlTypes, ...mariadbTypesBase },
  {
    get: (target, prop) => (prop in target ? target[prop] : false),
  },
);

const dbToTypesBase = {
  [DB.GENERIC]: defaultTypes,
  [DB.MYSQL]: mysqlTypes,
  [DB.POSTGRES]: postgresTypes,
  [DB.SQLITE]: sqliteTypes,
  [DB.MSSQL]: mssqlTypes,
  [DB.MARIADB]: mariadbTypes,
  [DB.ORACLESQL]: oraclesqlTypes,
};

export const dbToTypes = new Proxy(dbToTypesBase, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});
