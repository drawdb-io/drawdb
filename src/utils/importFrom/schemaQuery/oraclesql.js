const query = String.raw`SELECT JSON_OBJECT(
  'tables' VALUE NVL((
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
      'name' VALUE t.table_name,
      'comment' VALUE tc.comments,
      'fields' VALUE NVL((
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'name' VALUE c.column_name,
          'type' VALUE CASE
            WHEN c.data_type = 'NUMBER' AND c.data_precision IS NULL AND c.data_scale = 0 THEN 'INTEGER'
            WHEN c.data_type LIKE 'TIMESTAMP%' THEN 'TIMESTAMP'
            WHEN c.data_type LIKE 'INTERVAL%' THEN 'INTERVAL'
            WHEN c.data_type IN ('BINARY_FLOAT', 'BINARY_DOUBLE') THEN 'FLOAT'
            ELSE c.data_type END,
          'size' VALUE CASE
            WHEN c.data_type IN ('VARCHAR2', 'NVARCHAR2', 'CHAR', 'NCHAR') THEN TO_CHAR(c.char_length)
            WHEN c.data_type = 'RAW' THEN TO_CHAR(c.data_length)
            WHEN c.data_type = 'NUMBER' AND c.data_precision IS NOT NULL
              THEN c.data_precision || CASE WHEN c.data_scale > 0 THEN ',' || c.data_scale END
            WHEN c.data_type = 'FLOAT' THEN TO_CHAR(c.data_precision)
            END,
          'default' VALUE '',
          'primary' VALUE CASE WHEN EXISTS (
            SELECT 1 FROM user_constraints pk JOIN user_cons_columns pc ON pc.constraint_name = pk.constraint_name
            WHERE pk.table_name = c.table_name AND pk.constraint_type = 'P' AND pc.column_name = c.column_name
          ) THEN 1 ELSE 0 END,
          'unique' VALUE CASE WHEN EXISTS (
            SELECT 1 FROM user_indexes ui JOIN user_ind_columns uc ON uc.index_name = ui.index_name
            WHERE ui.table_name = c.table_name AND ui.uniqueness = 'UNIQUE' AND ui.index_type = 'NORMAL'
              AND uc.column_name = c.column_name
              AND (SELECT COUNT(*) FROM user_ind_columns k WHERE k.index_name = ui.index_name) = 1
              AND NOT EXISTS (SELECT 1 FROM user_constraints pk WHERE pk.constraint_type = 'P'
                AND pk.table_name = c.table_name AND pk.index_name = ui.index_name)
          ) THEN 1 ELSE 0 END,
          'notNull' VALUE CASE WHEN c.nullable = 'N' THEN 1 ELSE 0 END,
          'increment' VALUE CASE WHEN EXISTS (
            SELECT 1 FROM user_tab_identity_cols ic
            WHERE ic.table_name = c.table_name AND ic.column_name = c.column_name
          ) THEN 1 ELSE 0 END,
          'comment' VALUE cc.comments
          RETURNING CLOB) ORDER BY c.column_id RETURNING CLOB)
        FROM user_tab_columns c
        LEFT JOIN user_col_comments cc ON cc.table_name = c.table_name AND cc.column_name = c.column_name
        WHERE c.table_name = t.table_name
      ), '[]') FORMAT JSON,
      'indices' VALUE NVL((
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'name' VALUE i.index_name,
          'unique' VALUE CASE WHEN i.uniqueness = 'UNIQUE' THEN 1 ELSE 0 END,
          'fields' VALUE (SELECT JSON_ARRAYAGG(ic.column_name ORDER BY ic.column_position RETURNING CLOB)
            FROM user_ind_columns ic WHERE ic.index_name = i.index_name) FORMAT JSON
          RETURNING CLOB) ORDER BY i.index_name RETURNING CLOB)
        FROM user_indexes i
        WHERE i.table_name = t.table_name AND i.index_type = 'NORMAL'
          AND NOT EXISTS (SELECT 1 FROM user_constraints pk WHERE pk.constraint_type = 'P'
            AND pk.table_name = t.table_name AND pk.index_name = i.index_name)
          AND NOT (i.uniqueness = 'UNIQUE'
            AND (SELECT COUNT(*) FROM user_ind_columns k WHERE k.index_name = i.index_name) = 1)
      ), '[]') FORMAT JSON
      RETURNING CLOB) ORDER BY t.table_name RETURNING CLOB)
    FROM user_tables t
    LEFT JOIN user_tab_comments tc ON tc.table_name = t.table_name
    WHERE t.nested = 'NO' AND t.secondary = 'N' AND t.dropped = 'NO' AND t.iot_type IS NULL
      AND t.table_name NOT IN (SELECT mview_name FROM user_mviews)
  ), '[]') FORMAT JSON,
  'relationships' VALUE NVL((
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
      'name' VALUE r.constraint_name,
      'startTableName' VALUE r.table_name,
      'startFieldNames' VALUE (SELECT JSON_ARRAYAGG(rc.column_name ORDER BY rc.position RETURNING CLOB)
        FROM user_cons_columns rc WHERE rc.constraint_name = r.constraint_name) FORMAT JSON,
      'endTableName' VALUE p.table_name,
      'endFieldNames' VALUE (SELECT JSON_ARRAYAGG(pc.column_name ORDER BY pc.position RETURNING CLOB)
        FROM user_cons_columns pc WHERE pc.constraint_name = p.constraint_name) FORMAT JSON,
      'cardinality' VALUE CASE WHEN EXISTS (
        SELECT 1 FROM user_indexes ui
        WHERE ui.table_name = r.table_name AND ui.uniqueness = 'UNIQUE' AND ui.index_type = 'NORMAL'
          AND (SELECT LISTAGG(k.column_name, ',') WITHIN GROUP (ORDER BY k.column_name)
            FROM user_ind_columns k WHERE k.index_name = ui.index_name)
            = (SELECT LISTAGG(k.column_name, ',') WITHIN GROUP (ORDER BY k.column_name)
            FROM user_cons_columns k WHERE k.constraint_name = r.constraint_name)
      ) THEN 'one_to_one' ELSE 'many_to_one' END,
      'deleteConstraint' VALUE CASE r.delete_rule WHEN 'CASCADE' THEN 'Cascade'
        WHEN 'SET NULL' THEN 'Set null' ELSE 'No action' END,
      'updateConstraint' VALUE 'No action'
      RETURNING CLOB) ORDER BY r.constraint_name RETURNING CLOB)
    FROM user_constraints r
    JOIN user_constraints p ON p.constraint_name = r.r_constraint_name AND p.owner = r.r_owner
    WHERE r.constraint_type = 'R' AND r.r_owner = USER
  ), '[]') FORMAT JSON,
  'enums' VALUE '[]' FORMAT JSON,
  'skipped' VALUE JSON_OBJECT(
    'views' VALUE (SELECT COUNT(*) FROM user_views),
    'indexes' VALUE (SELECT COUNT(*) FROM user_indexes WHERE index_type LIKE 'FUNCTION-BASED%'),
    'checks' VALUE (SELECT COUNT(*) FROM user_constraints
      WHERE constraint_type = 'C' AND search_condition_vc NOT LIKE '% IS NOT NULL')
  )
  RETURNING CLOB
) AS drawdb_schema FROM dual;`;

export const oraclesql = {
  query,
  minVersion: "Oracle 12.2",
  note: "schema_query_oracle_note",
  cli: "printf 'SET LONG 2000000000 LONGCHUNKSIZE 32767 LINESIZE 32767 PAGESIZE 0 FEEDBACK OFF HEADING OFF TRIMSPOOL ON\\n@drawdb-schema.sql\\nexit\\n' | sqlplus -s <user>/<password>@<database> > drawdb-schema.json",
};
