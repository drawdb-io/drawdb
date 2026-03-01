import { describe, it, expect } from "vitest";
import { parse } from "@guanmingchiu/sqlparser-ts";
import { fromSQLite } from "../sqlite";
import { DB } from "../../../data/constants";

function parseSQLite(sql) {
  return parse(sql, "sqlite");
}

describe("fromSQLite", () => {
  it("parses a basic CREATE TABLE", () => {
    const ast = parseSQLite(
      "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);",
    );
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe("users");
    expect(result.tables[0].fields).toHaveLength(2);
    expect(result.tables[0].fields[0].primary).toBe(true);
    expect(result.tables[0].fields[1].notNull).toBe(true);
  });

  it("parses AUTOINCREMENT", () => {
    const ast = parseSQLite(
      "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT);",
    );
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.tables[0].fields[0].primary).toBe(true);
  });

  it("parses inline REFERENCES", () => {
    const ast = parseSQLite(`
      CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
      );
    `);
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.tables).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Set null");
  });

  it("parses FOREIGN KEY constraint", () => {
    const ast = parseSQLite(`
      CREATE TABLE a (id INTEGER PRIMARY KEY);
      CREATE TABLE b (
        id INTEGER PRIMARY KEY,
        a_id INTEGER,
        FOREIGN KEY (a_id) REFERENCES a(id) ON DELETE CASCADE
      );
    `);
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Cascade");
  });

  it("parses PRIMARY KEY constraint", () => {
    const ast = parseSQLite(
      "CREATE TABLE t (a INTEGER, b TEXT, PRIMARY KEY (a));",
    );
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.tables[0].fields[0].primary).toBe(true);
    expect(result.tables[0].fields[1].primary).toBe(false);
  });

  it("parses DEFAULT values", () => {
    const ast = parseSQLite(`
      CREATE TABLE t (
        a TEXT DEFAULT 'hello',
        b INTEGER DEFAULT 42,
        c TEXT DEFAULT NULL
      );
    `);
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.tables[0].fields[0].default).toBe("hello");
    expect(result.tables[0].fields[1].default).toBe("42");
    expect(result.tables[0].fields[2].default).toBe("NULL");
  });

  it("parses CREATE INDEX", () => {
    const ast = parseSQLite(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);
      CREATE INDEX idx_email ON users (email);
    `);
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.tables[0].indices).toHaveLength(1);
    expect(result.tables[0].indices[0].name).toBe("idx_email");
    expect(result.tables[0].indices[0].unique).toBe(false);
  });

  it("parses CHECK constraints", () => {
    const ast = parseSQLite(
      "CREATE TABLE users (age INTEGER CHECK (age > 0));",
    );
    const result = fromSQLite(ast, DB.SQLITE);

    expect(result.tables[0].fields[0].check).toContain(">");
  });

  it("maps types with GENERIC affinity", () => {
    const ast = parseSQLite(
      "CREATE TABLE t (a INTEGER, b TINYINT, c NVARCHAR(50));",
    );
    const result = fromSQLite(ast, DB.GENERIC);

    expect(result.tables[0].fields[0].type).toBe("INT");
    expect(result.tables[0].fields[1].type).toBe("SMALLINT");
  });
});
