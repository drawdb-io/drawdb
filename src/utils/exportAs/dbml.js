import { toPostgres } from "../exportSQL/postgres";
import { DB } from '../../data/constants';

export function jsonToDBML(obj) {
  let dbml = "Not supported yet.";

  switch (obj.database) {
    case DB.POSTGRES:
      dbml = convertPostgresToDBML(toPostgres(obj));
      break;
  }

  return dbml;
}

function convertPostgresToDBML(postgresSchema) {
  function mapDataType(type) {
    const typeMap = {
        'character varying': 'varchar',
        'character': 'char',
        'text': 'text',
        'integer': 'int',
        'bigint': 'bigint',
        'smallint': 'smallint',
        'decimal': 'decimal',
        'numeric': 'decimal',
        'real': 'float',
        'double precision': 'double',
        'boolean': 'boolean',
        'date': 'date',
        'timestamp without time zone': 'datetime',
        'timestamp with time zone': 'datetime',
        'smallserial': 'smallserial',
        'serial': 'serial',
        'bigserial': 'bigserial',
    };
  
    return typeMap[type] || type; // Fallback to the original type if not mapped
  }

  let dbmlOutput = '';
  const tableDefinitions = postgresSchema.split(/;\s*CREATE TABLE/i).filter(Boolean);

  if (!tableDefinitions)  {
      return dbmlOutput;
  }

  tableDefinitions.forEach(definition => {
      const tableNameMatch = definition.match(/"([^"]+)"/);
      const columnsMatch = definition.match(/\(([^)]+)\)/);

      if (!tableNameMatch || !columnsMatch) return;

      const tableName = tableNameMatch[1];
      const columns = columnsMatch[1].trim();

      dbmlOutput += `Table ${tableName} {\n`;

      // Split column definitions by comma, allowing for potential whitespace
      const columnDefinitions = columns.split(/\s*,\s*(?![^()]*\))/);
      
      columnDefinitions.forEach(colDef => {
          // Match the column name and type, and check for additional attributes
          const colMatch = colDef.match(/"([^"]+)"\s+(\w+)/);
          if (!colMatch) return;

          const colName = colMatch[1];
          const colType = mapDataType(colMatch[2]);
          const colDefExtras = [];
          let colExtras = '';

          if (/DEFAULT\s+([^)]+)/i.test(colDef)) {
            const defaultValue = colDef.match(/DEFAULT\s+([^)]+)/i)[1];
            colDefExtras.push(`default: '${defaultValue}'`);
          }

          if (/NOT NULL/i.test(colDef)) {
            colDefExtras.push('not null');
          }

          if (/UNIQUE/i.test(colDef)) {
            colDefExtras.push('unique');
          }
          
          if (colDefExtras.length > 0) {
            colExtras = ` [${colDefExtras.join(', ')}]`;
          }

          dbmlOutput += `  ${colName} ${colType}${colExtras}\n`;
      });

      dbmlOutput += `}\n\n`;
  });

  // Handle foreign keys
  const foreignKeyMatches = postgresSchema.match(/ALTER TABLE "([^"]+)"\s+ADD FOREIGN KEY\("([^"]+)"\)\s+REFERENCES "([^"]+)"\("([^"]+)"\)/g);
  if (foreignKeyMatches) {
      foreignKeyMatches.forEach(fk => {
          const match = fk.match(/ALTER TABLE "([^"]+)"\s+ADD FOREIGN KEY\("([^"]+)"\)\s+REFERENCES "([^"]+)"\("([^"]+)"\)/);
          if (match) {
              dbmlOutput += `Ref: ${match[1]}.${match[2]} > ${match[3]}.${match[4]}\n`;
          }
      });
  }

  return dbmlOutput;
}