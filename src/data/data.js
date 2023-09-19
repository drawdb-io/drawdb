const sqlDataTypes = [
  "INT",
  "SMALLINT",
  "BIGINT",
  "DECIMAL",
  "NUMERIC",
  "FLOAT",
  "REAL",
  "DOUBLE PRECISION",
  "CHAR",
  "VARCHAR",
  "TEXT",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "INTERVAL",
  "BOOLEAN",
  "BINARY",
  "VARBINARY",
  "BLOB",
  "CLOB",
  "UUID",
  "XML",
  "JSON",
];

const tableThemes = [
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

const defaultTableTheme = "#175e7a";
const bgBlue = "#124559";

const Cardinality = {
  ONE_TO_ONE: "One to one",
  ONE_TO_MANY: "One to many",
  MANY_TO_ONE: "Many to one",
  MANY_TO_MANY: "Many to many",
};

const Constraint = {
  none: "None",
  restrict: "Restrict",
  cascade: "Cascade",
  setNull: "Set null",
  setDefault: "Set default",
};

const Tab = {
  tables: "1",
  relationships: "2",
  subject_areas: "3",
  editor: "4",
  notes: "5",
};

const ObjectType = {
  NONE: 0,
  TABLE: 1,
  AREA: 2,
  NOTE: 3,
};

export {
  bgBlue,
  sqlDataTypes,
  tableThemes,
  defaultTableTheme,
  Cardinality,
  Constraint,
  Tab, 
  ObjectType
};
