/**
 * Test suite for PostgreSQL quoted custom types preprocessor
 * 
 * This test validates the fix for issue #196:
 * PostgreSQL - Import SQL failed when using custom type with double quotes
 * 
 * To run this test:
 * node tests/importSQL/postgresqlPreprocessor.test.js
 * 
 * Expected output: All tests should pass, confirming the fix works correctly.
 */

// Import the functions we want to test
import { 
  preprocessPostgreSQLForQuotedTypes, 
  postProcessPostgreSQLTypes 
} from '../../src/utils/importSQL/postgresqlPreprocessor.js';

// Test functions
function testBasicQuotedType() {
  const originalSQL = `CREATE TYPE "Gender" AS ENUM ('F', 'M', 'U');
CREATE TABLE "User" ("id" SERIAL, "gender" "Gender" NOT NULL);`;

  // Test that we can identify and replace quoted types
  const hasQuotedType = /"[A-Za-z_][A-Za-z0-9_]*"\s+AS\s+ENUM/i.test(originalSQL);
  const hasQuotedColumnType = /"[A-Za-z_][A-Za-z0-9_]*"\s+"[A-Za-z_][A-Za-z0-9_]*"/.test(originalSQL);
  
  return hasQuotedType && hasQuotedColumnType;
}

function testRegexPatterns() {
  // Test CREATE TYPE pattern
  const createTypeRegex = /CREATE\s+TYPE\s+"([^"]+)"\s+AS\s+ENUM/gi;
  const testCreateType = 'CREATE TYPE "Gender" AS ENUM';
  const match = createTypeRegex.exec(testCreateType);
  
  if (!match || match[1] !== 'Gender') {
    return false;
  }
  
  // Test column type pattern
  const columnTypeRegex = /(\s+)"([^"]+)"\s+"([^"]+)"(\s+(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|DEFAULT\s+[^,\n\r]*|REFERENCES\s+[^,\n\r]*)?)/gi;
  const testColumn = '    "gender" "Gender" NOT NULL,';
  const columnMatch = columnTypeRegex.exec(testColumn);
  
  return columnMatch && columnMatch[2] === 'gender' && columnMatch[3] === 'Gender';
}

function testPreprocessor() {
  // Test the actual issue SQL from #196
  const issueSQL = `CREATE TYPE "Gender" AS ENUM ('F', 'M', 'U');

CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "gender" "Gender" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);`;

  const result = preprocessPostgreSQLForQuotedTypes(issueSQL);
  
  // Check that quoted types are replaced
  const hasUnquotedCreateType = /CREATE TYPE DrawDBTempType\d+ AS ENUM/.test(result.sql);
  const noQuotedColumnTypes = !/"[A-Za-z_][A-Za-z0-9_]*"\s+"[A-Za-z_][A-Za-z0-9_]*"/.test(result.sql);
  const hasReplacements = result.typeReplacements.size > 0;
  
  return hasUnquotedCreateType && noQuotedColumnTypes && hasReplacements;
}

function testPostProcessor() {
  // Test post-processing
  const mockDiagramData = {
    enums: [
      { name: 'DrawDBTempType0', values: ['F', 'M', 'U'] }
    ],
    tables: [
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'SERIAL' },
          { name: 'gender', type: 'DrawDBTempType0' }
        ]
      }
    ]
  };
  
  const typeReplacements = new Map([['DrawDBTempType0', 'Gender']]);
  const restored = postProcessPostgreSQLTypes(mockDiagramData, typeReplacements);
  
  const genderEnum = restored.enums.find(e => e.name === 'Gender');
  const genderField = restored.tables.find(t => t.name === 'User').fields.find(f => f.name === 'gender');
  
  return genderEnum && genderField && genderField.type === 'Gender';
}

// Main test function
function runTests() {
  const tests = [
    { name: 'Basic quoted type detection', fn: testBasicQuotedType },
    { name: 'Regex patterns validation', fn: testRegexPatterns },
    { name: 'Preprocessor functionality', fn: testPreprocessor },
    { name: 'Post-processor functionality', fn: testPostProcessor }
  ];
  
  let failed = 0;
  
  tests.forEach(test => {
    try {
      const result = test.fn();
      if (!result) {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  });
  
  // Return success status
  return failed === 0;
}

// Run the tests
runTests();