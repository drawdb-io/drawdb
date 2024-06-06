export const defaultTypes = [
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

export const mysqlTypes = [
  // Numeric Data Types
  "TINYINT",
  "SMALLINT",
  "MEDIUMINT",
  "INT",
  "INTEGER",
  "BIGINT",
  "DECIMAL",
  "NUMERIC",
  "FLOAT",
  "DOUBLE",
  "BIT",
  "BOOLEAN",

  // Date and Time Data Types
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "TIME",
  "YEAR",

  // String Data Types
  "CHAR",
  "VARCHAR",
  "BINARY",
  "VARBINARY",
  "TINYBLOB",
  "BLOB",
  "MEDIUMBLOB",
  "LONGBLOB",
  "TINYTEXT",
  "TEXT",
  "MEDIUMTEXT",
  "LONGTEXT",
  "ENUM",
  "SET",

  // Spatial Data Types
  "GEOMETRY",
  "POINT",
  "LINESTRING",
  "POLYGON",
  "MULTIPOINT",
  "MULTILINESTRING",
  "MULTIPOLYGON",
  "GEOMETRYCOLLECTION",

  // JSON Data Type
  "JSON",
];

export const postgresTypes = [
  // Numeric Data Types
  "SMALLINT",
  "INTEGER",
  "BIGINT",
  "DECIMAL",
  "NUMERIC",
  "REAL",
  "DOUBLE PRECISION",
  "SMALLSERIAL",
  "SERIAL",
  "BIGSERIAL",
  "MONEY",

  // Character Types
  "CHARACTER",
  "CHAR",
  "VARCHAR",
  "TEXT",

  // Binary Data Types
  "BYTEA",

  // Date and Time Types
  "DATE",
  "TIME",
  "TIMESTAMP",
  "TIMESTAMPTZ",
  "INTERVAL",

  // Boolean Type
  "BOOLEAN",

  // Enumerated Types
  "ENUM",

  // Geometric Types
  "POINT",
  "LINE",
  "LSEG",
  "BOX",
  "PATH",
  "POLYGON",
  "CIRCLE",

  // Network Address Types
  "CIDR",
  "INET",
  "MACADDR",
  "MACADDR8",

  // Bit String Types
  "BIT",
  "VARBIT",

  // Text Search Types
  "TSVECTOR",
  "TSQUERY",

  // JSON Types
  "JSON",
  "JSONB",

  // UUID Type
  "UUID",

  // XML Type
  "XML",

  // Arrays
  "ARRAY",
];

export const sqliteTypes = [
  // Numeric Data Types
  "INTEGER",
  "REAL",

  // Text Data Types
  "TEXT",

  // Blob Data Type
  "BLOB",

  // Affinity Types
  "NUMERIC",

  // Boolean Type (Alias of INTEGER)
  "BOOLEAN",

  // Date and Time Types (Recommended to store as TEXT)
  "DATE",
  "DATETIME",
  "TIME",
  "TIMESTAMP",
];

export const mariadbTypes = [
  // Numeric Data Types
  "TINYINT",
  "SMALLINT",
  "MEDIUMINT",
  "INT",
  "INTEGER",
  "BIGINT",
  "DECIMAL",
  "NUMERIC",
  "FLOAT",
  "DOUBLE",
  "BIT",
  "BOOLEAN",

  // Date and Time Data Types
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "TIME",
  "YEAR",

  // String Data Types
  "CHAR",
  "VARCHAR",
  "BINARY",
  "VARBINARY",
  "TINYBLOB",
  "BLOB",
  "MEDIUMBLOB",
  "LONGBLOB",
  "TINYTEXT",
  "TEXT",
  "MEDIUMTEXT",
  "LONGTEXT",
  "ENUM",
  "SET",

  // Spatial Data Types
  "GEOMETRY",
  "POINT",
  "LINESTRING",
  "POLYGON",
  "MULTIPOINT",
  "MULTILINESTRING",
  "MULTIPOLYGON",
  "GEOMETRYCOLLECTION",

  // JSON Data Type
  "JSON",
];

export const mssqlTypes = [
  // Exact Numeric Data Types
  "BIGINT",
  "INT",
  "SMALLINT",
  "TINYINT",
  "BIT",
  "DECIMAL",
  "NUMERIC",
  "MONEY",
  "SMALLMONEY",

  // Approximate Numeric Data Types
  "FLOAT",
  "REAL",

  // Date and Time Data Types
  "DATE",
  "TIME",
  "DATETIME",
  "DATETIME2",
  "DATETIMEOFFSET",
  "SMALLDATETIME",
  "TIMESTAMP",

  // Character Strings
  "CHAR",
  "VARCHAR",
  "TEXT",

  // Unicode Character Strings
  "NCHAR",
  "NVARCHAR",
  "NTEXT",

  // Binary Data Types
  "BINARY",
  "VARBINARY",
  "IMAGE",

  // Other Data Types
  "UNIQUEIDENTIFIER",
  "XML",
  "CURSOR",
  "TABLE",
  "SQL_VARIANT",

  // JSON Data Type
  "JSON", // Note: JSON is not a native type in MSSQL; it uses NVARCHAR to store JSON data
];

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
