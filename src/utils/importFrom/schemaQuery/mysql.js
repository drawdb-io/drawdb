const query = String.raw`WITH
idx AS (
  SELECT s.TABLE_NAME, s.INDEX_NAME,
    MIN(s.NON_UNIQUE) = 0 AS is_unique,
    COUNT(*) AS n,
    SUM(s.COLUMN_NAME IS NULL) AS exprs,
    MIN(s.COLUMN_NAME) AS first_col,
    CONCAT('[', GROUP_CONCAT(JSON_QUOTE(s.COLUMN_NAME) ORDER BY s.SEQ_IN_INDEX), ']') AS cols,
    GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.COLUMN_NAME) AS col_set
  FROM information_schema.STATISTICS s
  WHERE s.TABLE_SCHEMA = DATABASE()
  GROUP BY s.TABLE_NAME, s.INDEX_NAME
),
fld AS (
  SELECT c.TABLE_NAME, GROUP_CONCAT(JSON_OBJECT(
    'name', c.COLUMN_NAME,
    'type', CASE
      WHEN c.COLUMN_TYPE LIKE 'tinyint(1)%' THEN 'BOOLEAN'
      WHEN c.DATA_TYPE = 'int' THEN 'INTEGER'
      ELSE UPPER(c.DATA_TYPE) END,
    'size', CASE
      WHEN c.DATA_TYPE IN ('char', 'varchar', 'binary', 'varbinary') THEN c.CHARACTER_MAXIMUM_LENGTH
      WHEN c.DATA_TYPE IN ('decimal', 'numeric') THEN CONCAT(c.NUMERIC_PRECISION, ',', c.NUMERIC_SCALE)
      WHEN c.DATA_TYPE = 'bit' THEN c.NUMERIC_PRECISION
      ELSE '' END,
    'values', CASE WHEN c.DATA_TYPE IN ('enum', 'set') THEN CAST(CONCAT('[', REPLACE(JSON_QUOTE(REPLACE(REPLACE(
      SUBSTRING(c.COLUMN_TYPE, LOCATE('(', c.COLUMN_TYPE) + 2, CHAR_LENGTH(c.COLUMN_TYPE) - LOCATE('(', c.COLUMN_TYPE) - 3),
      ''',''', CHAR(1)), '''''', '''')), CONCAT(CHAR(92), 'u0001'), '","'), ']') AS JSON) END,
    'default', c.COLUMN_DEFAULT,
    'primary', c.COLUMN_KEY = 'PRI',
    'unique', EXISTS (SELECT 1 FROM idx WHERE idx.TABLE_NAME = c.TABLE_NAME
      AND idx.INDEX_NAME <> 'PRIMARY' AND idx.is_unique AND idx.n = 1 AND idx.first_col = c.COLUMN_NAME),
    'notNull', c.IS_NULLABLE = 'NO',
    'increment', c.EXTRA LIKE '%auto_increment%',
    'unsigned', c.COLUMN_TYPE LIKE '%unsigned%',
    'comment', c.COLUMN_COMMENT
  ) ORDER BY c.ORDINAL_POSITION) AS j
  FROM information_schema.COLUMNS c
  WHERE c.TABLE_SCHEMA = DATABASE()
  GROUP BY c.TABLE_NAME
),
ix AS (
  SELECT TABLE_NAME, GROUP_CONCAT(JSON_OBJECT(
    'name', INDEX_NAME, 'unique', is_unique, 'fields', CAST(cols AS JSON)
  ) ORDER BY INDEX_NAME) AS j
  FROM idx
  WHERE INDEX_NAME <> 'PRIMARY' AND exprs = 0 AND NOT (is_unique AND n = 1)
  GROUP BY TABLE_NAME
),
fk AS (
  SELECT k.CONSTRAINT_NAME, k.TABLE_NAME, k.REFERENCED_TABLE_NAME,
    CONCAT('[', GROUP_CONCAT(JSON_QUOTE(k.COLUMN_NAME) ORDER BY k.ORDINAL_POSITION), ']') AS start_cols,
    CONCAT('[', GROUP_CONCAT(JSON_QUOTE(k.REFERENCED_COLUMN_NAME) ORDER BY k.ORDINAL_POSITION), ']') AS end_cols,
    GROUP_CONCAT(k.COLUMN_NAME ORDER BY k.COLUMN_NAME) AS col_set
  FROM information_schema.KEY_COLUMN_USAGE k
  WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_SCHEMA = DATABASE()
  GROUP BY k.CONSTRAINT_NAME, k.TABLE_NAME, k.REFERENCED_TABLE_NAME
)
SELECT /*+ SET_VAR(group_concat_max_len = 1073741824) */ JSON_OBJECT(
  'tables', CAST((SELECT CONCAT('[', COALESCE(GROUP_CONCAT(JSON_OBJECT(
      'name', t.TABLE_NAME,
      'comment', t.TABLE_COMMENT,
      'fields', CAST(CONCAT('[', fld.j, ']') AS JSON),
      'indices', CAST(CONCAT('[', COALESCE(ix.j, ''), ']') AS JSON)
    ) ORDER BY t.TABLE_NAME), ''), ']')
    FROM information_schema.TABLES t
    JOIN fld ON fld.TABLE_NAME = t.TABLE_NAME
    LEFT JOIN ix ON ix.TABLE_NAME = t.TABLE_NAME
    WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE') AS JSON),
  'relationships', CAST((SELECT CONCAT('[', COALESCE(GROUP_CONCAT(JSON_OBJECT(
      'name', fk.CONSTRAINT_NAME,
      'startTableName', fk.TABLE_NAME,
      'startFieldNames', CAST(fk.start_cols AS JSON),
      'endTableName', fk.REFERENCED_TABLE_NAME,
      'endFieldNames', CAST(fk.end_cols AS JSON),
      'cardinality', IF(EXISTS (SELECT 1 FROM idx WHERE idx.TABLE_NAME = fk.TABLE_NAME
        AND idx.is_unique AND idx.col_set = fk.col_set), 'one_to_one', 'many_to_one'),
      'deleteConstraint', CASE rc.DELETE_RULE WHEN 'CASCADE' THEN 'Cascade' WHEN 'SET NULL' THEN 'Set null'
        WHEN 'SET DEFAULT' THEN 'Set default' WHEN 'RESTRICT' THEN 'Restrict' ELSE 'No action' END,
      'updateConstraint', CASE rc.UPDATE_RULE WHEN 'CASCADE' THEN 'Cascade' WHEN 'SET NULL' THEN 'Set null'
        WHEN 'SET DEFAULT' THEN 'Set default' WHEN 'RESTRICT' THEN 'Restrict' ELSE 'No action' END
    ) ORDER BY fk.CONSTRAINT_NAME), ''), ']')
    FROM fk
    JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
      ON rc.CONSTRAINT_SCHEMA = DATABASE() AND rc.CONSTRAINT_NAME = fk.CONSTRAINT_NAME
      AND rc.TABLE_NAME = fk.TABLE_NAME) AS JSON),
  'enums', JSON_ARRAY(),
  'skipped', JSON_OBJECT(
    'views', (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'VIEW'),
    'indexes', (SELECT COUNT(*) FROM idx WHERE exprs > 0),
    'checks', (SELECT COUNT(*) FROM information_schema.CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE())
  )
) AS drawdb_schema;`;

export const mysql = {
  query,
  minVersion: "MySQL 8.0.16",
  cli: "mysql -N -r -D <database> < drawdb-schema.sql > drawdb-schema.json",
};
