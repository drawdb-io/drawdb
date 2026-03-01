import { describe, it, expect } from "vitest";
import { parse } from "@guanmingchiu/sqlparser-ts";
import { fromPostgres } from "../postgres";
import { DB } from "../../../data/constants";

function parsePg(sql) {
  return parse(sql, "postgresql");
}

describe("fromPostgres", () => {
  it("parses a basic CREATE TABLE", () => {
    const ast = parsePg(
      "CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL);",
    );
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe("users");
    expect(result.tables[0].fields).toHaveLength(2);
    expect(result.tables[0].fields[0].primary).toBe(true);
    expect(result.tables[0].fields[1].notNull).toBe(true);
  });

  it("parses SERIAL as custom type", () => {
    const ast = parsePg(
      "CREATE TABLE users (id SERIAL PRIMARY KEY);",
    );
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.tables[0].fields[0].type).toBe("SERIAL");
    expect(result.tables[0].fields[0].primary).toBe(true);
  });

  it("parses CREATE TYPE AS ENUM", () => {
    const ast = parsePg(`
      CREATE TYPE status AS ENUM ('active', 'inactive', 'pending');
      CREATE TABLE users (id INTEGER PRIMARY KEY, status status);
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.enums).toHaveLength(1);
    expect(result.enums[0].name).toBe("status");
    expect(result.enums[0].values).toEqual(["active", "inactive", "pending"]);

    expect(result.tables[0].fields[1].type).toBe("status");
  });

  it("parses CREATE TYPE AS composite", () => {
    const ast = parsePg(
      "CREATE TYPE address AS (street TEXT, city TEXT, zip VARCHAR(10));",
    );
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.types).toHaveLength(1);
    expect(result.types[0].name).toBe("address");
    expect(result.types[0].fields).toHaveLength(3);
    expect(result.types[0].fields[0].name).toBe("street");
    expect(result.types[0].fields[2].size).toBe("10");
  });

  it("parses COMMENT ON TABLE", () => {
    const ast = parsePg(`
      CREATE TABLE users (id INTEGER PRIMARY KEY);
      COMMENT ON TABLE users IS 'User accounts';
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.tables[0].comment).toBe("User accounts");
  });

  it("parses COMMENT ON COLUMN", () => {
    const ast = parsePg(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
      COMMENT ON COLUMN users.name IS 'Full name';
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.tables[0].fields[1].comment).toBe("Full name");
  });

  it("parses inline REFERENCES", () => {
    const ast = parsePg(`
      CREATE TABLE departments (id INTEGER PRIMARY KEY);
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        dept_id INTEGER REFERENCES departments(id) ON DELETE CASCADE
      );
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Cascade");
  });

  it("parses FOREIGN KEY constraints", () => {
    const ast = parsePg(`
      CREATE TABLE departments (id INTEGER PRIMARY KEY);
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        dept_id INTEGER,
        CONSTRAINT fk_dept FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Set null");
    expect(result.relationships[0].updateConstraint).toBe("Cascade");
  });

  it("parses ALTER TABLE ADD FOREIGN KEY", () => {
    const ast = parsePg(`
      CREATE TABLE a (id INTEGER PRIMARY KEY);
      CREATE TABLE b (id INTEGER PRIMARY KEY, a_id INTEGER);
      ALTER TABLE b ADD CONSTRAINT fk_a FOREIGN KEY (a_id) REFERENCES a(id);
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.relationships).toHaveLength(1);
  });

  it("parses CREATE INDEX", () => {
    const ast = parsePg(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);
      CREATE UNIQUE INDEX idx_email ON users (email);
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.tables[0].indices).toHaveLength(1);
    expect(result.tables[0].indices[0].unique).toBe(true);
    expect(result.tables[0].indices[0].fields).toEqual(["email"]);
  });

  it("parses DEFAULT values", () => {
    const ast = parsePg(`
      CREATE TABLE users (
        active BOOLEAN DEFAULT TRUE,
        count INTEGER DEFAULT 0,
        ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.tables[0].fields[0].default).toBe("TRUE");
    expect(result.tables[0].fields[1].default).toBe("0");
    expect(result.tables[0].fields[2].default).toBe("CURRENT_TIMESTAMP");
  });

  it("parses CHECK constraints", () => {
    const ast = parsePg(
      "CREATE TABLE users (age INTEGER CHECK (age > 0));",
    );
    const result = fromPostgres(ast, DB.POSTGRES);

    expect(result.tables[0].fields[0].check).toContain(">");
  });

  it("maps types to GENERIC affinity", () => {
    const ast = parsePg(
      "CREATE TABLE t (a INTEGER, b BOOLEAN);",
    );
    const result = fromPostgres(ast, DB.GENERIC);

    expect(result.tables[0].fields[0].type).toBe("INT");
  });
});
