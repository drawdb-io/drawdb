## Fix PostgreSQL import failure with quoted custom types

Fixes #196

### Issue
PostgreSQL SQL files containing quoted custom type references in column definitions would fail to import with a syntax error. For example:

```sql
CREATE TYPE "Gender" AS ENUM ('F', 'M', 'U');
CREATE TABLE "User" (
    "gender" "Gender" NOT NULL
);
```

This would throw: `SyntaxError [Ln 5, Col 14]: Expected ... but """ found.`

The underlying SQL parser doesn't handle quoted custom type references in column definitions properly.

### Solution
Added a preprocessing step for PostgreSQL imports that:
1. Identifies quoted custom types in CREATE TYPE statements
2. Temporarily replaces quoted type references in column definitions with unquoted placeholders
3. Restores original type names after successful parsing

### Changes
- Added `postgresqlPreprocessor.js` with preprocessing functions
- Modified Modal.jsx to use preprocessor for PostgreSQL imports
- Added test suite to verify the fix works correctly

### Testing
Run `npm test` to verify all tests pass. Manual testing can be done by importing the provided test SQL file through the DrawDB interface.

The fix handles the specific case mentioned in issue #196 while maintaining compatibility with existing PostgreSQL import functionality.