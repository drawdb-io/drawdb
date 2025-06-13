export const defaultBlue = "#175e7a";
export const defaultNoteTheme = "#fcf7ac";
export const noteWidth = 180;
export const noteRadius = 3;
export const noteFold = 24;
export const darkBgTheme = "#16161A";
export const stringColor = "text-orange-500";
export const intColor = "text-yellow-500";
export const decimalColor = "text-lime-500";
export const booleanColor = "text-violet-500";
export const binaryColor = "text-emerald-500";
export const enumSetColor = "text-sky-500";
export const documentColor = "text-indigo-500";
export const networkIdColor = "text-rose-500";
export const geometricColor = "text-fuchsia-500";
export const vectorColor = "text-slate-500";
export const otherColor = "text-zinc-500";
export const dateColor = "text-cyan-500";
export const tableHeaderHeight = 50;
export const tableWidth = 220;
export const gridSize = 24;
export const gridCircleRadius = 0.85;
export const tableFieldHeight = 36;
export const tableColorStripHeight = 7;

export const Cardinality = {
  ONE_TO_ONE: "one_to_one",
  ONE_TO_MANY: "one_to_many",
  MANY_TO_ONE: "many_to_one",
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
  ENUMS: "6",
};

export const ObjectType = {
  NONE: 0,
  TABLE: 1,
  AREA: 2,
  NOTE: 3,
  RELATIONSHIP: 4,
  TYPE: 5,
  ENUM: 6,
};

export const Action = {
  ADD: 0,
  MOVE: 1,
  DELETE: 2,
  EDIT: 3,
};

export const State = {
  NONE: 0,
  SAVING: 1,
  SAVED: 2,
  LOADING: 3,
  ERROR: 4,
  FAILED_TO_LOAD: 5,
};

export const MODAL = {
  NONE: 0,
  IMG: 1,
  CODE: 2,
  IMPORT: 3,
  RENAME: 4,
  OPEN: 5,
  SAVEAS: 6,
  NEW: 7,
  IMPORT_SRC: 8,
  TABLE_WIDTH: 9,
  LANGUAGE: 10,
  SHARE: 11,
};

export const STATUS = {
  NONE: 0,
  WARNING: 1,
  ERROR: 2,
  OK: 3,
};

export const SIDESHEET = {
  NONE: 0,
  TODO: 1,
  TIMELINE: 2,
};

export const DB = {
  MYSQL: "mysql",
  POSTGRES: "postgresql",
  MSSQL: "transactsql",
  SQLITE: "sqlite",
  MARIADB: "mariadb",
  ORACLESQL: "oraclesql",
  GENERIC: "generic",
};

export const IMPORT_FROM = {
  JSON: 0,
  DBML: 1,
};
