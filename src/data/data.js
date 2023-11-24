const sqlDataTypes = [
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

const noteThemes = ["#ffdfd9", "#fcf7ac", "#cffcb1", "#c7d2ff", "#e7c7ff"];

const avatarThemes = [
  "amber",
  "blue",
  "cyan",
  "green",
  "grey",
  "indigo",
  "light-blue",
  "light-green",
  "lime",
  "orange",
  "pink",
  "red",
  "teal",
  "violet",
  "yellow",
  "white",
];

const defaultTableTheme = "#175e7a";
const defaultNoteTheme = "#fcf7ac";
const bgBlue = "#124559";

const Cardinality = {
  ONE_TO_ONE: "One to one",
  ONE_TO_MANY: "One to many",
  MANY_TO_ONE: "Many to one",
};

const Constraint = {
  none: "No action",
  restrict: "Restrict",
  cascade: "Cascade",
  setNull: "Set null",
  setDefault: "Set default",
};

const Tab = {
  tables: "1",
  relationships: "2",
  subject_areas: "3",
  notes: "4",
  types: "5",
};

const ObjectType = {
  NONE: 0,
  TABLE: 1,
  AREA: 2,
  NOTE: 3,
  RELATIONSHIP: 4,
  TYPE: 5,
};

const Action = {
  ADD: 0,
  MOVE: 1,
  DELETE: 2,
  EDIT: 3,
  PAN: 4,
};

const State = {
  NONE: 0,
  SAVING: 1,
  SAVED: 2,
  LOADING: 3,
};

export {
  bgBlue,
  sqlDataTypes,
  tableThemes,
  noteThemes,
  defaultTableTheme,
  defaultNoteTheme,
  avatarThemes,
  Cardinality,
  Constraint,
  Tab,
  ObjectType,
  Action,
  State,
};
