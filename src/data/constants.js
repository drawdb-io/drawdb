export const sqlDataTypes = [
  "INT",
  "SMALLINT",
  "BIGINT",
  "DECIMAL",
  "NUMERIC",
  "FLOAT",
  "DOUBLE",
  "REAL",
  "CHAR",
  "VARCHAR",
  "TEXT",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "DATETIME",
  "BOOLEAN",
  "BINARY",
  "VARBINARY",
  "BLOB",
  "JSON",
  "UUID",
  "ENUM",
  "SET",
];

export const tableThemes = [
  "#f03c3c",
  "#ff4f81",
  "#bc49c4",
  "#a751e8",
  "#7c4af0",
  "#6360f7",
  "#7d9dff",
  "#32c9b0",
  "#3cde7d",
  "#89e667",
  "#ffe159",
  "#ff9159",
];

export const noteThemes = [
  "#ffdfd9",
  "#fcf7ac",
  "#cffcb1",
  "#c7d2ff",
  "#e7c7ff",
];

export const defaultBlue = "#175e7a";
export const defaultNoteTheme = "#fcf7ac";

export const Cardinality = {
  ONE_TO_ONE: "One to one",
  ONE_TO_MANY: "One to many",
  MANY_TO_ONE: "Many to one",
};

export const Constraint = {
  NONE: "No action",
  RESTRICT: "Restrict",
  CASCADE: "Cascade",
  SET_NULL: "Set null",
  SET_DEFAULT: "Set default",
};

export const Tab = {
  TABLES: "1",
  RELATIONSHIPS: "2",
  AREAS: "3",
  NOTES: "4",
  TYPES: "5",
};

export const ObjectType = {
  NONE: 0,
  TABLE: 1,
  AREA: 2,
  NOTE: 3,
  RELATIONSHIP: 4,
  TYPE: 5,
};

export const Action = {
  ADD: 0,
  MOVE: 1,
  DELETE: 2,
  EDIT: 3,
  PAN: 4,
};

export const State = {
  NONE: 0,
  SAVING: 1,
  SAVED: 2,
  LOADING: 3,
  ERROR: 4,
};
