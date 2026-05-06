import pg from "pg";

const QUERY_TIMEOUT_MS = 10_000;

/**
 * Connect to PostgreSQL, introspect schema, and generate DDL.
 * Uses a temporary connection — credentials are never stored.
 */
export async function generateDDL({ host, port, database, user, password, schema, ssl }) {
  const client = new pg.Client({
    host,
    port,
    database,
    user,
    password,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
    statement_timeout: QUERY_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
    connectionTimeoutMillis: QUERY_TIMEOUT_MS,
  });

  try {
    await client.connect();
    const ddl = [];

    // 1. Enum types
    ddl.push(...(await enumTypes(client, schema)));

    // 2. Composite types
    ddl.push(...(await compositeTypes(client, schema)));

    // 3. Tables + columns
    ddl.push(...(await tableColumns(client, schema)));

    // 4. Primary keys (ALTER for composite PKs)
    ddl.push(...(await primaryKeys(client, schema)));

    // 5. Unique constraints
    ddl.push(...(await uniqueConstraints(client, schema)));

    // 6. Foreign keys
    ddl.push(...(await foreignKeys(client, schema)));

    // 7. Indexes (exclude PK/UK)
    ddl.push(...(await indexes(client, schema)));

    // 8. Comments
    ddl.push(...(await comments(client, schema)));

    const sql = ddl.join("\n\n");

    // Count tables and FK relationships for the response
    const countResult = await client.query(
      `SELECT count(*)::int AS tables FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'`,
      [schema],
    );
    const fkCountResult = await client.query(
      `SELECT count(*)::int AS rels FROM information_schema.table_constraints
       WHERE table_schema = $1 AND constraint_type = 'FOREIGN KEY'`,
      [schema],
    );

    return {
      sql,
      tables: countResult.rows[0].tables,
      relationships: fkCountResult.rows[0].rels,
    };
  } finally {
    await client.end();
  }
}

// ── 1. Enum Types ──────────────────────────────────────────────────────────

async function enumTypes(client, schema) {
  const { rows } = await client.query(
    `SELECT t.typname, e.enumlabel
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_namespace n ON t.typnamespace = n.oid
     WHERE n.nspname = $1
     ORDER BY t.typname, e.enumsortorder`,
    [schema],
  );

  const groups = {};
  for (const row of rows) {
    (groups[row.typname] ??= []).push(row.enumlabel);
  }

  return Object.entries(groups).map(
    ([name, values]) => `CREATE TYPE ${q(name)} AS ENUM (${values.map((v) => `'${v}'`).join(", ")});`,
  );
}

// ── 2. Composite Types ─────────────────────────────────────────────────────

async function compositeTypes(client, schema) {
  const { rows } = await client.query(
    `SELECT t.typname, a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
     FROM pg_type t
     JOIN pg_namespace n ON t.typnamespace = n.oid
     JOIN pg_attribute a ON a.attrelid = t.typrelid
     WHERE n.nspname = $1 AND t.typtype = 'c' AND a.attnum > 0 AND NOT a.attisdropped
     ORDER BY t.typname, a.attnum`,
    [schema],
  );

  const groups = {};
  for (const row of rows) {
    (groups[row.typname] ??= []).push({ name: row.attname, type: row.data_type });
  }

  return Object.entries(groups).map(
    ([name, fields]) =>
      `CREATE TYPE ${q(name)} AS (${fields.map((f) => `${q(f.name)} ${f.type}`).join(", ")});`,
  );
}

// ── 3. Tables + Columns ────────────────────────────────────────────────────

async function tableColumns(client, schema) {
  const { rows } = await client.query(
    `SELECT
       c.table_name,
       c.column_name,
       c.data_type,
       c.udt_name,
       c.character_maximum_length,
       c.numeric_precision,
       c.numeric_scale,
       c.column_default,
       c.is_nullable,
       c.is_identity,
       CASE WHEN c.is_identity = 'YES' THEN 'ALWAYS' END AS identity,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.table_schema = $1 AND tc.table_name = c.table_name
           AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = c.column_name
       ) THEN true ELSE false END AS is_primary
     FROM information_schema.columns c
     WHERE c.table_schema = $1
       AND c.table_name IN (
         SELECT table_name FROM information_schema.tables
         WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       )
     ORDER BY c.table_name, c.ordinal_position`,
    [schema],
  );

  const tables = {};
  for (const col of rows) {
    (tables[col.table_name] ??= []).push(col);
  }

  return Object.entries(tables).map(([table, cols]) => {
    const colDefs = cols.map((c) => {
      const parts = [`  ${q(c.column_name)}`];
      parts.push(columnType(c));

      if (c.is_primary && cols.filter((x) => x.is_primary).length === 1) {
        parts.push("PRIMARY KEY");
      }
      if (c.is_identity === "YES") parts.push("GENERATED ALWAYS AS IDENTITY");
      if (c.is_nullable === "NO" && !c.is_primary) parts.push("NOT NULL");
      if (c.column_default != null && c.is_identity !== "YES") {
        parts.push(`DEFAULT ${c.column_default}`);
      }

      return parts.join(" ");
    });

    return `CREATE TABLE ${q(table)} (\n${colDefs.join(",\n")}\n);`;
  });
}

function columnType(c) {
  const udt = c.udt_name;

  // Array types start with underscore in pg_type
  if (udt.startsWith("_")) {
    const inner = udt.slice(1);
    return `${upperInner(inner)}[]`;
  }

  if (c.data_type === "USER-DEFINED") return udt; // enum / composite
  if (c.data_type === "character varying") return `VARCHAR(${c.character_maximum_length ?? ""})`;
  if (c.data_type === "character") return `CHAR(${c.character_maximum_length ?? ""})`;
  if (c.data_type === "numeric" && c.numeric_precision != null) {
    return c.numeric_scale != null
      ? `NUMERIC(${c.numeric_precision},${c.numeric_scale})`
      : `NUMERIC(${c.numeric_precision})`;
  }

  return upperInner(udt);
}

function upperInner(udt) {
  // Common PostgreSQL built-in type mappings
  const map = {
    int4: "INTEGER",
    int8: "BIGINT",
    int2: "SMALLINT",
    float4: "REAL",
    float8: "DOUBLE PRECISION",
    bool: "BOOLEAN",
    varchar: "VARCHAR",
    bpchar: "CHAR",
    text: "TEXT",
    date: "DATE",
    time: "TIME",
    timetz: "TIME WITH TIME ZONE",
    timestamp: "TIMESTAMP",
    timestamptz: "TIMESTAMP WITH TIME ZONE",
    uuid: "UUID",
    json: "JSON",
    jsonb: "JSONB",
    bytea: "BYTEA",
    money: "MONEY",
    bit: "BIT",
    varbit: "BIT VARYING",
    cidr: "CIDR",
    inet: "INET",
    macaddr: "MACADDR",
    point: "POINT",
    line: "LINE",
    lseg: "LSEG",
    box: "BOX",
    path: "PATH",
    polygon: "POLYGON",
    circle: "CIRCLE",
    interval: "INTERVAL",
    xml: "XML",
    tsvector: "TSVECTOR",
    tsquery: "TSQUERY",
  };
  return map[udt] || udt.toUpperCase();
}

// ── 4. Primary Keys ────────────────────────────────────────────────────────

async function primaryKeys(client, schema) {
  const { rows } = await client.query(
    `SELECT
       tc.table_name,
       kcu.column_name,
       kcu.ordinal_position
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     WHERE tc.table_schema = $1 AND tc.constraint_type = 'PRIMARY KEY'
     ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position`,
    [schema],
  );

  // Group by (table, constraint)
  const groups = {};
  for (const row of rows) {
    const key = `${row.table_name}`;
    (groups[key] ??= []).push(row.column_name);
  }

  // Only emit ALTER for composite PKs; single-col PKs are inline
  return Object.entries(groups)
    .filter(([, cols]) => cols.length > 1)
    .map(
      ([table, cols]) =>
        `ALTER TABLE ${q(table)} ADD PRIMARY KEY (${cols.map(q).join(", ")});`,
    );
}

// ── 5. Unique Constraints ──────────────────────────────────────────────────

async function uniqueConstraints(client, schema) {
  const { rows } = await client.query(
    `SELECT
       tc.table_name,
       tc.constraint_name,
       kcu.column_name,
       kcu.ordinal_position
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     WHERE tc.table_schema = $1 AND tc.constraint_type = 'UNIQUE'
     ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position`,
    [schema],
  );

  const groups = {};
  for (const row of rows) {
    const key = `${row.table_name}::${row.constraint_name}`;
    (groups[key] ??= { table: row.table_name, cols: [] }).cols.push(row.column_name);
  }

  return Object.values(groups).map(
    ({ table, cols }) =>
      `ALTER TABLE ${q(table)} ADD UNIQUE (${cols.map(q).join(", ")});`,
  );
}

// ── 6. Foreign Keys ────────────────────────────────────────────────────────

async function foreignKeys(client, schema) {
  const { rows } = await client.query(
    `SELECT
       tc.table_name,
       kcu.column_name,
       ccu.table_name AS referenced_table,
       ccu.column_name AS referenced_column,
       rc.update_rule,
       rc.delete_rule
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.referential_constraints rc
       ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
     JOIN information_schema.constraint_column_usage ccu
       ON rc.unique_constraint_name = ccu.constraint_name AND rc.unique_constraint_schema = ccu.table_schema
     WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY'
     ORDER BY tc.table_name, tc.constraint_name`,
    [schema],
  );

  return rows.map((r) => {
    let sql = `ALTER TABLE ${q(r.table_name)} ADD FOREIGN KEY (${q(r.column_name)}) REFERENCES ${q(r.referenced_table)}(${q(r.referenced_column)})`;
    if (r.update_rule !== "NO ACTION") sql += ` ON UPDATE ${r.update_rule}`;
    if (r.delete_rule !== "NO ACTION") sql += ` ON DELETE ${r.delete_rule}`;
    return sql + ";";
  });
}

// ── 7. Indexes ─────────────────────────────────────────────────────────────

async function indexes(client, schema) {
  const { rows } = await client.query(
    `SELECT indexname, tablename, indexdef
     FROM pg_indexes
     WHERE schemaname = $1
       AND indexname NOT LIKE '%_pkey'
       AND indexname NOT LIKE '%_key'
     ORDER BY tablename, indexname`,
    [schema],
  );

  return rows.map((r) => `${r.indexdef};`);
}

// ── 8. Comments ────────────────────────────────────────────────────────────

async function comments(client, schema) {
  const result = [];

  // Table comments
  const tableComments = await client.query(
    `SELECT c.relname AS table_name, d.description
     FROM pg_description d
     JOIN pg_class c ON d.objoid = c.oid
     JOIN pg_namespace n ON c.relnamespace = n.oid
     WHERE n.nspname = $1 AND d.objsubid = 0 AND d.description IS NOT NULL
     ORDER BY c.relname`,
    [schema],
  );

  for (const row of tableComments.rows) {
    result.push(`COMMENT ON TABLE ${q(row.table_name)} IS '${escapeStr(row.description)}';`);
  }

  // Column comments
  const colComments = await client.query(
    `SELECT c.relname AS table_name, a.attname AS column_name, d.description
     FROM pg_description d
     JOIN pg_class c ON d.objoid = c.oid
     JOIN pg_attribute a ON d.objoid = a.attrelid AND d.objsubid = a.attnum
     JOIN pg_namespace n ON c.relnamespace = n.oid
     WHERE n.nspname = $1 AND d.objsubid > 0 AND d.description IS NOT NULL
     ORDER BY c.relname, a.attname`,
    [schema],
  );

  for (const row of colComments.rows) {
    result.push(
      `COMMENT ON COLUMN ${q(row.table_name)}.${q(row.column_name)} IS '${escapeStr(row.description)}';`,
    );
  }

  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function q(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function escapeStr(s) {
  return s.replace(/'/g, "''");
}
