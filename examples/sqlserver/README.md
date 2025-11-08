# SQL Server Import Example

This folder contains a sample SQL Server DDL that currently causes import errors in DrawDB.
It can be used to reproduce and test issue #529.

**File:** `employees-ddl.sql`

Features included:
- `IDENTITY` columns
- `GO` batch separators
- `getdate()` in CHECK constraints
