const query = `WITH
tbl AS (
  SELECT c.oid, c.relname, n.nspname,
    CASE WHEN n.nspname = 'public' THEN c.relname ELSE n.nspname || '.' || c.relname END AS name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p') AND NOT c.relispartition
    AND n.nspname NOT LIKE 'pg\\_%' AND n.nspname <> 'information_schema'
),
col AS (
  SELECT t.oid AS relid, a.attnum, a.attname,
    a.attndims > 0 OR ty.typcategory = 'A' AS is_array,
    COALESCE(el.typname, ty.typname) AS typname,
    COALESCE(el.typtype, ty.typtype) AS typtype,
    COALESCE(eln.nspname, tyn.nspname) AS typnsp,
    substring(format_type(a.atttypid, a.atttypmod) FROM '\\(([^)]*)\\)') AS size,
    a.attnotnull, a.attidentity <> '' AS is_identity,
    pg_get_expr(d.adbin, d.adrelid) AS default_expr,
    col_description(t.oid, a.attnum) AS comment
  FROM tbl t
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
  JOIN pg_type ty ON ty.oid = a.atttypid
  JOIN pg_namespace tyn ON tyn.oid = ty.typnamespace
  LEFT JOIN pg_type el ON el.oid = ty.typelem AND ty.typcategory = 'A'
  LEFT JOIN pg_namespace eln ON eln.oid = el.typnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = t.oid AND d.adnum = a.attnum
),
idx AS (
  SELECT i.indrelid AS relid, ic.relname AS name, i.indisunique, i.indisprimary,
    i.indkey::int2[] AS keys
  FROM pg_index i
  JOIN pg_class ic ON ic.oid = i.indexrelid
  WHERE i.indrelid IN (SELECT oid FROM tbl) AND i.indexprs IS NULL AND i.indpred IS NULL
),
fk AS (
  SELECT con.conname, con.conrelid, con.confrelid, con.conkey, con.confkey,
    con.confdeltype, con.confupdtype
  FROM pg_constraint con
  WHERE con.contype = 'f' AND con.conrelid IN (SELECT oid FROM tbl)
    AND con.confrelid IN (SELECT oid FROM tbl)
)
SELECT json_build_object(
  'tables', (SELECT COALESCE(json_agg(json_build_object(
    'name', t.name,
    'comment', COALESCE(obj_description(t.oid, 'pg_class'), ''),
    'fields', (SELECT COALESCE(json_agg(json_build_object(
      'name', c.attname,
      'type', CASE
        WHEN c.typtype = 'e' THEN upper(CASE WHEN c.typnsp = 'public' THEN c.typname ELSE c.typnsp || '.' || c.typname END)
        WHEN c.typname = 'int2' THEN 'SMALLINT'
        WHEN c.typname = 'int4' THEN 'INTEGER'
        WHEN c.typname = 'int8' THEN 'BIGINT'
        WHEN c.typname = 'float4' THEN 'REAL'
        WHEN c.typname = 'float8' THEN 'DOUBLE PRECISION'
        WHEN c.typname = 'bool' THEN 'BOOLEAN'
        WHEN c.typname = 'bpchar' THEN 'CHAR'
        ELSE upper(c.typname) END,
      'size', CASE WHEN c.typtype = 'e' THEN '' ELSE COALESCE(c.size, '') END,
      'isArray', c.is_array,
      'default', CASE
        WHEN c.default_expr IS NULL OR c.default_expr LIKE 'nextval(%' THEN ''
        ELSE regexp_replace(
          regexp_replace(c.default_expr, '::[a-z_ ."]+(\\(\\d+(,\\d+)?\\))?(\\[\\])*$', '', 'i'),
          '^''(.*)''$', '\\1') END,
      'primary', EXISTS (SELECT 1 FROM idx WHERE idx.relid = c.relid AND idx.indisprimary AND c.attnum = ANY (idx.keys)),
      'unique', EXISTS (SELECT 1 FROM idx WHERE idx.relid = c.relid AND idx.indisunique AND NOT idx.indisprimary AND cardinality(idx.keys) = 1 AND c.attnum = ANY (idx.keys)),
      'notNull', c.attnotnull,
      'increment', c.is_identity OR COALESCE(c.default_expr LIKE 'nextval(%', false),
      'comment', COALESCE(c.comment, '')
    ) ORDER BY c.attnum), '[]') FROM col c WHERE c.relid = t.oid),
    'indices', (SELECT COALESCE(json_agg(json_build_object(
      'name', i.name,
      'unique', i.indisunique,
      'fields', (SELECT json_agg(a.attname ORDER BY k.ord)
        FROM unnest(i.keys) WITH ORDINALITY k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = i.relid AND a.attnum = k.attnum)
    ) ORDER BY i.name), '[]') FROM idx i
      WHERE i.relid = t.oid AND NOT i.indisprimary
        AND NOT (i.indisunique AND cardinality(i.keys) = 1))
  ) ORDER BY t.name), '[]') FROM tbl t),
  'relationships', (SELECT COALESCE(json_agg(json_build_object(
    'name', f.conname,
    'startTableName', st.name,
    'startFieldNames', (SELECT json_agg(a.attname ORDER BY k.ord)
      FROM unnest(f.conkey) WITH ORDINALITY k(attnum, ord)
      JOIN pg_attribute a ON a.attrelid = f.conrelid AND a.attnum = k.attnum),
    'endTableName', et.name,
    'endFieldNames', (SELECT json_agg(a.attname ORDER BY k.ord)
      FROM unnest(f.confkey) WITH ORDINALITY k(attnum, ord)
      JOIN pg_attribute a ON a.attrelid = f.confrelid AND a.attnum = k.attnum),
    'cardinality', CASE WHEN EXISTS (
        SELECT 1 FROM idx WHERE idx.relid = f.conrelid AND idx.indisunique
          AND idx.keys::int2[] @> f.conkey AND idx.keys::int2[] <@ f.conkey)
      THEN 'one_to_one' ELSE 'many_to_one' END,
    'deleteConstraint', CASE f.confdeltype WHEN 'r' THEN 'Restrict' WHEN 'c' THEN 'Cascade'
      WHEN 'n' THEN 'Set null' WHEN 'd' THEN 'Set default' ELSE 'No action' END,
    'updateConstraint', CASE f.confupdtype WHEN 'r' THEN 'Restrict' WHEN 'c' THEN 'Cascade'
      WHEN 'n' THEN 'Set null' WHEN 'd' THEN 'Set default' ELSE 'No action' END
  ) ORDER BY f.conname), '[]')
    FROM fk f JOIN tbl st ON st.oid = f.conrelid JOIN tbl et ON et.oid = f.confrelid),
  'enums', (SELECT COALESCE(json_agg(json_build_object(
    'name', CASE WHEN n.nspname = 'public' THEN ty.typname ELSE n.nspname || '.' || ty.typname END,
    'values', (SELECT json_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid = ty.oid)
  ) ORDER BY ty.typname), '[]')
    FROM pg_type ty JOIN pg_namespace n ON n.oid = ty.typnamespace
    WHERE ty.typtype = 'e' AND n.nspname NOT LIKE 'pg\\_%' AND n.nspname <> 'information_schema'),
  'skipped', json_build_object(
    'views', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('v', 'm') AND n.nspname NOT LIKE 'pg\\_%' AND n.nspname <> 'information_schema'),
    'indexes', (SELECT count(*) FROM pg_index i
      WHERE i.indrelid IN (SELECT oid FROM tbl) AND (i.indexprs IS NOT NULL OR i.indpred IS NOT NULL)),
    'checks', (SELECT count(*) FROM pg_constraint con
      WHERE con.contype = 'c' AND con.conrelid IN (SELECT oid FROM tbl))
  )
) AS drawdb_schema;`;

export const postgres = {
  query,
  minVersion: "PostgreSQL 9.4",
  cli: "psql -At -d <database> -f drawdb-schema.sql > drawdb-schema.json",
};
