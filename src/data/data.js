const menu = {
  File: {
    New: {
      children: [],
      function: () => console.log("New"),
    },
    "New window": {
      children: [],
      function: () => {},
    },
    Save: {
      children: [],
      function: () => {},
    },
    "Save as": {
      children: [],
      function: () => {},
    },
    Share: {
      children: [],
      function: () => {},
    },
    Rename: {
      children: [],
      function: () => {},
    },
    Import: {
      children: [],
      function: () => {},
    },
    "Export as": {
      children: [{".png": ()=>console.log("exporting png")}, {".jpg": ()=>{}}, {".xml": ()=>{}},{".svg": ()=>{}}, {".xml": ()=>{}}],
      function: () => {},
    },
    "Export source": {
      children: [{"MySQL": ()=>{}}, {"PostgreSQL": ()=>{}}, {"DBML": ()=>{}}],
      function: () => {},
    },
    Properties: {
      children: [],
      function: () => {},
    },
    Close: {
      children: [],
      function: () => {},
    },
  },
  Edit: {
    Undo: {
      children: [],
      function: () => {},
    },
    Redo: {
      children: [],
      function: () => {},
    },
    Cut: {
      children: [],
      function: () => {},
    },
    Copy: {
      children: [],
      function: () => {},
    },
    "Copy as image": {
      children: [],
      function: () => {},
    },
    Paste: {
      children: [],
      function: () => {},
    },
    Delete: {
      children: [],
      function: () => {},
    },
    "Edit table": {
      children: [],
      function: () => {},
    },
  },
  View: {
    Toolbar: {
      children: [],
      function: () => {},
    },
    Grid: {
      children: [],
      function: () => {},
    },
    Sidebar: {
      children: [],
      function: () => {},
    },
    Editor: {
      children: [],
      function: () => {},
    },
    "Strict mode": {
      children: [],
      function: () => {},
    },
    "Reset view": {
      children: [],
      function: () => {},
    },
    "View schema": {
      children: [],
      function: () => {},
    },
    Theme: {
      children: [{Light: ()=>{}}, {Dark: ()=>{}}],
      function: ()=>{}
    },
    "Zoom in": {
      children: [],
      function: () => {},
    },
    "Zoom out": {
      children: [],
      function: () => {},
    },
    Fullscreen: {
      children: [],
      function: () => {},
    },
  },
  Insert: {
    "New table": {
      children: [],
      function: () => {},
    },
    "New relationship": {
      children: [],
      function: () => {},
    },
    Note: {
      children: [],
      function: () => {},
    },
    Image: {
      children: [],
      function: () => {},
    },
    Textbox: {
      children: [],
      function: () => {},
    },
    Shape: {
      children: [],
      function: () => {},
    },
  },
  Logs: {
    "Open logs": {
      children: [],
      function: () => {},
    },
    "Commit changes": {
      children: [],
      function: () => {},
    },
    "Revert changes": {
      children: [],
      function: () => {},
    },
    "View commits": {
      children: [],
      function: () => {},
    },
  },
  Help: {
    Shortcuts: {
      children: [],
      function: () => {},
    },
    "Ask us on discord": {
      children: [],
      function: () => {},
    },
    "Tweet us": {
      children: [],
      function: () => {},
    },
    "Found a bug": {
      children: [],
      function: () => {},
    },
  },
};

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

const defaultTableTheme = "#9e9e9e";
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

export {
  menu,
  bgBlue,
  sqlDataTypes,
  tableThemes,
  defaultTableTheme,
  Cardinality,
  Constraint,
};
