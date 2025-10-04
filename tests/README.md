# DrawDB Tests

This directory contains test cases for the DrawDB project, specifically focusing on SQL import functionality and bug fixes.

## Quick Start

Run all tests with a single command:

```bash
# From project root
npm test

# Or run directly
node tests/run-all-tests.js
```

## Current Test Coverage

### PostgreSQL Import Tests

- **Issue #196 Fix**: Tests for PostgreSQL quoted custom types
  - File: `importSQL/postgresqlPreprocessor.test.js`
  - SQL Sample: `importSQL/test-issue-196.sql`

## Test Structure

```
tests/
├── run-all-tests.js                           # Main test runner
├── package.json                               # Test configuration
├── README.md                                  # This file
└── importSQL/
    ├── postgresqlPreprocessor.test.js         # PostgreSQL preprocessor tests
    └── test-issue-196.sql                     # Sample SQL for manual testing
```

## Test Files Explained

### `run-all-tests.js`
Professional test runner that:
- Executes all test suites
- Provides colored output and detailed reporting
- Returns appropriate exit codes for CI/CD
- Shows comprehensive results summary

### `importSQL/postgresqlPreprocessor.test.js`
Tests the PostgreSQL quote type fix including:
- Basic quoted type detection
- Regex pattern validation  
- Preprocessor functionality
- Post-processor functionality

### `importSQL/test-issue-196.sql`
Sample SQL file from the original issue that can be used for manual testing in the DrawDB UI.

## Running Individual Tests

```bash
# Run PostgreSQL tests only
node tests/importSQL/postgresqlPreprocessor.test.js
```

## Manual Testing

1. Start DrawDB: `npm run dev`
2. Go to File → Import from Source → PostgreSQL
3. Upload `tests/importSQL/test-issue-196.sql`
4. Verify it imports without the previous SyntaxError

## Adding New Tests

1. Create test files in appropriate subdirectories
2. Add test suite configuration to `run-all-tests.js`
3. Follow the existing pattern for consistent output

## Expected Output

When all tests pass, you should see:
```
🎉 All tests passed! The fix is ready for deployment.
✨ Issue #196 has been successfully resolved.
```

## Issue #196 - Detailed Information

**Problem**: DrawDB failed to import PostgreSQL SQL files when custom types (like ENUMs) were used with double quotes in column definitions.

**Example failing SQL**:
```sql
CREATE TYPE "Gender" AS ENUM ('F', 'M', 'U');
CREATE TABLE "User" (
    "gender" "Gender" NOT NULL
);
```

**Error**: `SyntaxError [Ln 5, Col 14]: Expected ... but """ found.`

**Solution**: Implemented a preprocessor that temporarily replaces quoted custom types with unquoted temporary names during parsing, then restores the original names in the final diagram data.