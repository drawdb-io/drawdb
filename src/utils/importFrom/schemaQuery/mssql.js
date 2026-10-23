const query = String.raw`SELECT (
  SELECT
    JSON_QUERY(ISNULL((
      SELECT
        CASE WHEN s.name = 'dbo' THEN t.name ELSE s.name + '.' + t.name END AS name,
        ISNULL(CAST(ep.value AS nvarchar(max)), '') AS comment,
        JSON_QUERY(ISNULL((
          SELECT
            c.name AS name,
            CASE ty.base WHEN 'int' THEN 'INTEGER' ELSE UPPER(ty.base) END AS type,
            CASE
              WHEN ty.base IN ('varchar', 'char', 'varbinary', 'binary')
                THEN CASE WHEN c.max_length = -1 THEN 'MAX' ELSE CAST(c.max_length AS varchar(10)) END
              WHEN ty.base IN ('nvarchar', 'nchar')
                THEN CASE WHEN c.max_length = -1 THEN 'MAX' ELSE CAST(c.max_length / 2 AS varchar(10)) END
              WHEN ty.base IN ('decimal', 'numeric')
                THEN CAST(c.precision AS varchar(5)) + ',' + CAST(c.scale AS varchar(5))
              ELSE '' END AS size,
            ISNULL(CASE
              WHEN d.v LIKE 'N''%''' THEN REPLACE(SUBSTRING(d.v, 3, LEN(d.v) - 3), '''''', '''')
              WHEN d.v LIKE '''%''' THEN REPLACE(SUBSTRING(d.v, 2, LEN(d.v) - 2), '''''', '''')
              ELSE d.v END, '') AS [default],
            CAST(CASE WHEN EXISTS (
              SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic
                ON ic.object_id = i.object_id AND ic.index_id = i.index_id
              WHERE i.object_id = c.object_id AND i.is_primary_key = 1 AND ic.column_id = c.column_id
            ) THEN 1 ELSE 0 END AS bit) AS [primary],
            CAST(CASE WHEN EXISTS (
              SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic
                ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
              WHERE i.object_id = c.object_id AND i.is_unique = 1 AND i.is_primary_key = 0
                AND i.has_filter = 0 AND ic.column_id = c.column_id
                AND (SELECT COUNT(*) FROM sys.index_columns k WHERE k.object_id = i.object_id
                  AND k.index_id = i.index_id AND k.is_included_column = 0) = 1
            ) THEN 1 ELSE 0 END AS bit) AS [unique],
            CAST(CASE WHEN c.is_nullable = 0 THEN 1 ELSE 0 END AS bit) AS notNull,
            c.is_identity AS increment,
            ISNULL(CAST(cep.value AS nvarchar(max)), '') AS comment
          FROM sys.columns c
          JOIN sys.types ut ON ut.user_type_id = c.user_type_id
          CROSS APPLY (SELECT CASE WHEN ut.is_user_defined = 1 AND ut.is_assembly_type = 0
            THEN TYPE_NAME(ut.system_type_id) ELSE ut.name END AS base) ty
          LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
          CROSS APPLY (SELECT CASE WHEN dc.definition LIKE '(%)'
            THEN SUBSTRING(dc.definition, 2, LEN(dc.definition) - 2) ELSE dc.definition END AS v1) d1
          CROSS APPLY (SELECT CASE WHEN d1.v1 LIKE '(%)'
            THEN SUBSTRING(d1.v1, 2, LEN(d1.v1) - 2) ELSE d1.v1 END AS v) d
          LEFT JOIN sys.extended_properties cep ON cep.class = 1 AND cep.major_id = c.object_id
            AND cep.minor_id = c.column_id AND cep.name = 'MS_Description'
          WHERE c.object_id = t.object_id
          ORDER BY c.column_id
          FOR JSON PATH
        ), '[]')) AS fields,
        JSON_QUERY(ISNULL((
          SELECT i.name AS name, i.is_unique AS [unique], JSON_QUERY(k.cols) AS fields
          FROM sys.indexes i
          CROSS APPLY (
            SELECT COUNT(*) AS n,
              '[' + STRING_AGG(CAST('"' + STRING_ESCAPE(col.name, 'json') + '"' AS nvarchar(max)), ',')
                WITHIN GROUP (ORDER BY ic.key_ordinal) + ']' AS cols
            FROM sys.index_columns ic
            JOIN sys.columns col ON col.object_id = ic.object_id AND col.column_id = ic.column_id
            WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
          ) k
          WHERE i.object_id = t.object_id AND i.type IN (1, 2) AND i.is_primary_key = 0
            AND i.has_filter = 0 AND i.is_hypothetical = 0 AND NOT (i.is_unique = 1 AND k.n = 1)
          ORDER BY i.name
          FOR JSON PATH
        ), '[]')) AS indices
      FROM sys.tables t
      JOIN sys.schemas s ON s.schema_id = t.schema_id
      LEFT JOIN sys.extended_properties ep ON ep.class = 1 AND ep.major_id = t.object_id
        AND ep.minor_id = 0 AND ep.name = 'MS_Description'
      WHERE t.is_ms_shipped = 0
      ORDER BY name
      FOR JSON PATH
    ), '[]')) AS tables,
    JSON_QUERY(ISNULL((
      SELECT
        fk.name AS name,
        CASE WHEN ps.name = 'dbo' THEN pt.name ELSE ps.name + '.' + pt.name END AS startTableName,
        JSON_QUERY(cols.start_cols) AS startFieldNames,
        CASE WHEN rs.name = 'dbo' THEN rt.name ELSE rs.name + '.' + rt.name END AS endTableName,
        JSON_QUERY(cols.end_cols) AS endFieldNames,
        CASE WHEN EXISTS (
          SELECT 1 FROM sys.indexes i
          CROSS APPLY (SELECT STRING_AGG(CAST(ic.column_id AS varchar(10)), ',')
              WITHIN GROUP (ORDER BY ic.column_id) AS col_set
            FROM sys.index_columns ic
            WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0) ik
          WHERE i.object_id = fk.parent_object_id AND i.is_unique = 1 AND i.has_filter = 0
            AND ik.col_set = fkset.col_set
        ) THEN 'one_to_one' ELSE 'many_to_one' END AS cardinality,
        CASE fk.delete_referential_action WHEN 1 THEN 'Cascade' WHEN 2 THEN 'Set null'
          WHEN 3 THEN 'Set default' ELSE 'No action' END AS deleteConstraint,
        CASE fk.update_referential_action WHEN 1 THEN 'Cascade' WHEN 2 THEN 'Set null'
          WHEN 3 THEN 'Set default' ELSE 'No action' END AS updateConstraint
      FROM sys.foreign_keys fk
      JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
      JOIN sys.schemas ps ON ps.schema_id = pt.schema_id
      JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
      JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
      CROSS APPLY (
        SELECT
          '[' + STRING_AGG(CAST('"' + STRING_ESCAPE(pc.name, 'json') + '"' AS nvarchar(max)), ',')
            WITHIN GROUP (ORDER BY fkc.constraint_column_id) + ']' AS start_cols,
          '[' + STRING_AGG(CAST('"' + STRING_ESCAPE(rc.name, 'json') + '"' AS nvarchar(max)), ',')
            WITHIN GROUP (ORDER BY fkc.constraint_column_id) + ']' AS end_cols
        FROM sys.foreign_key_columns fkc
        JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
        JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
        WHERE fkc.constraint_object_id = fk.object_id
      ) cols
      CROSS APPLY (
        SELECT STRING_AGG(CAST(fkc.parent_column_id AS varchar(10)), ',')
          WITHIN GROUP (ORDER BY fkc.parent_column_id) AS col_set
        FROM sys.foreign_key_columns fkc
        WHERE fkc.constraint_object_id = fk.object_id
      ) fkset
      WHERE pt.is_ms_shipped = 0
      ORDER BY fk.name
      FOR JSON PATH
    ), '[]')) AS relationships,
    JSON_QUERY('[]') AS enums,
    JSON_QUERY((
      SELECT
        (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS views,
        (SELECT COUNT(*) FROM sys.indexes i JOIN sys.tables t ON t.object_id = i.object_id
          WHERE t.is_ms_shipped = 0 AND i.has_filter = 1) AS indexes,
        (SELECT COUNT(*) FROM sys.check_constraints WHERE is_ms_shipped = 0) AS checks
      FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    )) AS skipped
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
) AS drawdb_schema;`;

export const mssql = {
  query,
  minVersion: "SQL Server 2017",
  cli: "sqlcmd -S <server> -d <database> -y 0 -i drawdb-schema.sql -o drawdb-schema.json",
};
