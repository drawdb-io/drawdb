const query = String.raw`WITH
tbl AS (
  SELECT name, sql FROM sqlite_master
  WHERE type = 'table' AND name NOT LIKE 'sqlite!_%' ESCAPE '!'
),
col AS (
  SELECT t.name AS tname, t.sql AS tsql, c.cid, c.name, c."notnull" AS nn, c.dflt_value, c.pk,
    upper(trim(CASE WHEN instr(c.type, '(') > 0 THEN substr(c.type, 1, instr(c.type, '(') - 1) ELSE c.type END)) AS base,
    CASE WHEN instr(c.type, '(') > 0
      THEN replace(substr(c.type, instr(c.type, '(') + 1, instr(c.type, ')') - instr(c.type, '(') - 1), ' ', '')
      ELSE '' END AS size
  FROM tbl t, pragma_table_info(t.name) c
),
idx AS (
  SELECT t.name AS tname, il."unique" AS uq, il.origin, il.partial,
    CASE WHEN il.name LIKE 'sqlite!_autoindex!_%' ESCAPE '!'
      THEN t.name || '_' || (SELECT group_concat(name, '_') FROM (SELECT name FROM pragma_index_info(il.name) ORDER BY seqno)) || '_key'
      ELSE il.name END AS iname,
    (SELECT count(*) FROM pragma_index_info(il.name)) AS n,
    (SELECT count(*) FROM pragma_index_info(il.name) WHERE cid = -2) AS exprs,
    (SELECT min(name) FROM pragma_index_info(il.name)) AS first_col,
    (SELECT json_group_array(name) FROM (SELECT name FROM pragma_index_info(il.name) ORDER BY seqno)) AS cols,
    (SELECT group_concat(name) FROM (SELECT name FROM pragma_index_info(il.name) ORDER BY name)) AS col_set
  FROM tbl t, pragma_index_list(t.name) il
),
fk AS (
  SELECT t.name AS tname, f.id, f."table" AS rtable, f.on_update, f.on_delete,
    (SELECT json_group_array(f2."from") FROM (SELECT "from" FROM pragma_foreign_key_list(t.name)
      WHERE id = f.id ORDER BY seq) f2) AS start_cols,
    (SELECT json_group_array(coalesce(f2."to",
        (SELECT p.name FROM pragma_table_info(f2."table") p WHERE p.pk = f2.seq + 1)))
      FROM (SELECT "to", "table", seq FROM pragma_foreign_key_list(t.name) WHERE id = f.id ORDER BY seq) f2) AS end_cols,
    (SELECT group_concat(f2."from") FROM (SELECT "from" FROM pragma_foreign_key_list(t.name)
      WHERE id = f.id ORDER BY "from") f2) AS col_set
  FROM tbl t, pragma_foreign_key_list(t.name) f
  WHERE f.seq = 0
)
SELECT json_object(
  'tables', (SELECT json_group_array(json_object(
      'name', t.name,
      'comment', '',
      'fields', (SELECT json_group_array(json(j)) FROM (SELECT json_object(
          'name', c.name,
          'type', CASE
            WHEN c.base IN ('INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT', 'INT2', 'INT8', 'UNSIGNED BIG INT') THEN 'INTEGER'
            WHEN c.base IN ('CHAR', 'CHARACTER', 'VARCHAR', 'VARYING CHARACTER', 'NCHAR', 'NATIVE CHARACTER', 'NVARCHAR') THEN 'VARCHAR'
            WHEN c.base IN ('TEXT', 'CLOB', 'JSON', 'UUID') THEN 'TEXT'
            WHEN c.base IN ('REAL', 'DOUBLE', 'DOUBLE PRECISION', 'FLOAT') THEN 'REAL'
            WHEN c.base IN ('NUMERIC', 'DECIMAL') THEN 'NUMERIC'
            WHEN c.base IN ('BOOLEAN', 'BOOL') THEN 'BOOLEAN'
            WHEN c.base IN ('DATE', 'DATETIME', 'TIME', 'TIMESTAMP', 'BLOB') THEN c.base
            WHEN c.base = '' THEN 'BLOB'
            WHEN c.base LIKE '%INT%' THEN 'INTEGER'
            WHEN c.base LIKE '%CHAR%' OR c.base LIKE '%CLOB%' OR c.base LIKE '%TEXT%' THEN 'TEXT'
            WHEN c.base LIKE '%BLOB%' THEN 'BLOB'
            WHEN c.base LIKE '%REAL%' OR c.base LIKE '%FLOA%' OR c.base LIKE '%DOUB%' THEN 'REAL'
            ELSE 'NUMERIC' END,
          'size', CASE WHEN c.base IN ('CHAR', 'CHARACTER', 'VARCHAR', 'VARYING CHARACTER', 'NCHAR',
            'NATIVE CHARACTER', 'NVARCHAR', 'NUMERIC', 'DECIMAL') THEN c.size ELSE '' END,
          'default', CASE
            WHEN c.dflt_value IS NULL OR upper(c.dflt_value) = 'NULL' THEN ''
            WHEN c.dflt_value LIKE '''%''' THEN replace(substr(c.dflt_value, 2, length(c.dflt_value) - 2), '''''', '''')
            ELSE c.dflt_value END,
          'primary', c.pk > 0,
          'unique', EXISTS (SELECT 1 FROM idx WHERE idx.tname = c.tname AND idx.uq AND idx.n = 1
            AND idx.origin <> 'pk' AND idx.partial = 0 AND idx.first_col = c.name),
          'notNull', c.nn = 1,
          'increment', c.pk = 1 AND c.base = 'INTEGER' AND upper(c.tsql) LIKE '%AUTOINCREMENT%',
          'comment', ''
        ) AS j FROM col c WHERE c.tname = t.name ORDER BY c.cid)),
      'indices', (SELECT json_group_array(json_object(
          'name', i.iname, 'unique', i.uq = 1, 'fields', json(i.cols)
        )) FROM idx i WHERE i.tname = t.name AND i.origin <> 'pk' AND i.partial = 0 AND i.exprs = 0
          AND NOT (i.uq AND i.n = 1))
    )) FROM (SELECT * FROM tbl ORDER BY name) t),
  'relationships', (SELECT json_group_array(json_object(
      'name', 'fk_' || fk.tname || '_' || fk.id,
      'startTableName', fk.tname,
      'startFieldNames', json(fk.start_cols),
      'endTableName', fk.rtable,
      'endFieldNames', json(fk.end_cols),
      'cardinality', CASE WHEN EXISTS (SELECT 1 FROM idx WHERE idx.tname = fk.tname AND idx.uq
          AND idx.partial = 0 AND idx.col_set = fk.col_set)
        OR fk.col_set = (SELECT group_concat(name) FROM (SELECT name FROM col
          WHERE col.tname = fk.tname AND col.pk > 0 ORDER BY name))
        THEN 'one_to_one' ELSE 'many_to_one' END,
      'deleteConstraint', CASE fk.on_delete WHEN 'CASCADE' THEN 'Cascade' WHEN 'SET NULL' THEN 'Set null'
        WHEN 'SET DEFAULT' THEN 'Set default' WHEN 'RESTRICT' THEN 'Restrict' ELSE 'No action' END,
      'updateConstraint', CASE fk.on_update WHEN 'CASCADE' THEN 'Cascade' WHEN 'SET NULL' THEN 'Set null'
        WHEN 'SET DEFAULT' THEN 'Set default' WHEN 'RESTRICT' THEN 'Restrict' ELSE 'No action' END
    )) FROM fk),
  'enums', json_array(),
  'skipped', json_object(
    'views', (SELECT count(*) FROM sqlite_master WHERE type = 'view'),
    'indexes', (SELECT count(*) FROM idx WHERE idx.partial = 1 OR idx.exprs > 0),
    'checks', (SELECT coalesce(sum((length(sql) - length(replace(upper(sql), 'CHECK', ''))) / 5), 0) FROM tbl)
  )
) AS drawdb_schema;`;

export const sqlite = {
  query,
  minVersion: "SQLite 3.38",
  cli: "sqlite3 <database-file> < drawdb-schema.sql > drawdb-schema.json",
};
