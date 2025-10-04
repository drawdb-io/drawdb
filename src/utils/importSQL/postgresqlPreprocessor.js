/**
 * Preprocessor for PostgreSQL SQL to handle quoted custom types
 * This is a workaround for the node-sql-parser issue with quoted custom types
 * See: https://github.com/taozhi8833998/node-sql-parser/issues/2045
 */

/**
 * Preprocesses PostgreSQL SQL to handle quoted custom types
 * @param {string} sql - The original SQL string
 * @returns {Object} - Object containing the preprocessed SQL and type mappings
 */
export function preprocessPostgreSQLForQuotedTypes(sql) {
  // Map to track quoted type replacements
  const typeReplacements = new Map();
  let counter = 0;
  
  let processedSql = sql;
  
  // Find all CREATE TYPE statements with quoted names (for ENUMs only initially)
  const createEnumTypeRegex = /CREATE\s+TYPE\s+"([^"]+)"\s+AS\s+ENUM\s*\(/gi;
  let match;
  
  // Extract quoted enum types first
  while ((match = createEnumTypeRegex.exec(sql)) !== null) {
    const quotedName = match[1];
    const replacement = `DrawDBTempType${counter++}`;
    typeReplacements.set(replacement, quotedName);
    
    // Replace the quoted type name in CREATE TYPE statement
    processedSql = processedSql.replace(
      new RegExp(`CREATE\\s+TYPE\\s+"${quotedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+AS\\s+ENUM`, 'gi'),
      `CREATE TYPE ${replacement} AS ENUM`
    );
  }
  
  // Now handle column definitions that reference quoted custom types
  // Look for patterns like: "column_name" "TypeName" [constraints]
  // This regex looks for quoted column name followed by quoted type name
  const columnTypeRegex = /(\s+)"([^"]+)"\s+"([^"]+)"(\s+(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|DEFAULT\s+[^,\n\r]*|REFERENCES\s+[^,\n\r]*)?)/gi;
  
  processedSql = processedSql.replace(columnTypeRegex, (fullMatch, prefix, columnName, typeName, suffix) => {
    // Check if this type name exists in our replacements or needs a new one
    let replacement = null;
    
    // Find existing replacement for this type name
    for (const [tempName, originalName] of typeReplacements.entries()) {
      if (originalName === typeName) {
        replacement = tempName;
        break;
      }
    }
    
    // If no replacement found, create a new one (this handles types not defined as ENUMs)
    if (!replacement) {
      replacement = `DrawDBTempType${counter++}`;
      typeReplacements.set(replacement, typeName);
    }
    
    // Return the replacement - keep column name quoted but use unquoted temp type name
    return `${prefix}"${columnName}" ${replacement}${suffix}`;
  });
  
  // Handle cases where quoted types appear without surrounding constraints
  // Pattern: "column_name" "TypeName", or "column_name" "TypeName"\n
  const simpleColumnTypeRegex = /(\s+)"([^"]+)"\s+"([^"]+)"(\s*[,\n\r)])/gi;
  
  processedSql = processedSql.replace(simpleColumnTypeRegex, (fullMatch, prefix, columnName, typeName, suffix) => {
    // Check if this type name exists in our replacements or needs a new one
    let replacement = null;
    
    // Find existing replacement for this type name
    for (const [tempName, originalName] of typeReplacements.entries()) {
      if (originalName === typeName) {
        replacement = tempName;
        break;
      }
    }
    
    // If no replacement found, create a new one
    if (!replacement) {
      replacement = `DrawDBTempType${counter++}`;
      typeReplacements.set(replacement, typeName);
    }
    
    // Return the replacement - keep column name quoted but use unquoted temp type name
    return `${prefix}"${columnName}" ${replacement}${suffix}`;
  });
  
  return {
    sql: processedSql,
    typeReplacements: typeReplacements
  };
}

/**
 * Post-processes the parsed diagram data to restore original type names
 * @param {Object} diagramData - The parsed diagram data
 * @param {Map} typeReplacements - Map of temporary type names to original names
 * @returns {Object} - Updated diagram data with original type names
 */
export function postProcessPostgreSQLTypes(diagramData, typeReplacements) {
  if (!diagramData || typeReplacements.size === 0) {
    return diagramData;
  }
  
  // Create reverse mapping
  const tempToOriginal = new Map();
  for (const [tempName, originalName] of typeReplacements.entries()) {
    tempToOriginal.set(tempName, originalName);
  }
  
  // Update enum names
  if (diagramData.enums) {
    diagramData.enums.forEach(enumObj => {
      if (tempToOriginal.has(enumObj.name)) {
        enumObj.name = tempToOriginal.get(enumObj.name);
      }
    });
  }
  
  // Update custom type names
  if (diagramData.types) {
    diagramData.types.forEach(typeObj => {
      if (tempToOriginal.has(typeObj.name)) {
        typeObj.name = tempToOriginal.get(typeObj.name);
      }
    });
  }
  
  // Update field types in tables
  if (diagramData.tables) {
    diagramData.tables.forEach(table => {
      if (table.fields) {
        table.fields.forEach(field => {
          if (tempToOriginal.has(field.type)) {
            field.type = tempToOriginal.get(field.type);
          }
        });
      }
    });
  }
  
  return diagramData;
}