import { describe, it, expect } from "vitest";
import { parse } from "@guanmingchiu/sqlparser-ts";
import { fromMSSQL } from "../mssql";
import { DB } from "../../../data/constants";

function parseMSSQL(sql) {
  return parse(sql, "mssql");
}

describe("fromMSSQL", () => {
  it("parses a basic CREATE TABLE", () => {
    const ast = parseMSSQL(
      "CREATE TABLE users (id INT PRIMARY KEY, name NVARCHAR(100));",
    );
    const result = fromMSSQL(ast, DB.MSSQL);

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe("users");
    expect(result.tables[0].fields).toHaveLength(2);
    expect(result.tables[0].fields[0].primary).toBe(true);
  });

  it("parses IDENTITY columns", () => {
    const ast = parseMSSQL(
      "CREATE TABLE users (id INT IDENTITY(1,1) PRIMARY KEY);",
    );
    const result = fromMSSQL(ast, DB.MSSQL);

    expect(result.tables[0].fields[0].increment).toBe(true);
    expect(result.tables[0].fields[0].primary).toBe(true);
  });

  it("parses FOREIGN KEY constraints", () => {
    const ast = parseMSSQL(`
      CREATE TABLE departments (id INT PRIMARY KEY);
      CREATE TABLE users (
        id INT PRIMARY KEY,
        dept_id INT,
        CONSTRAINT fk_dept FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE
      );
    `);
    const result = fromMSSQL(ast, DB.MSSQL);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Cascade");
  });

  it("parses ALTER TABLE ADD FOREIGN KEY", () => {
    const ast = parseMSSQL(`
      CREATE TABLE a (id INT PRIMARY KEY);
      CREATE TABLE b (id INT PRIMARY KEY, a_id INT);
      ALTER TABLE b ADD CONSTRAINT fk_a FOREIGN KEY (a_id) REFERENCES a(id);
    `);
    const result = fromMSSQL(ast, DB.MSSQL);

    expect(result.relationships).toHaveLength(1);
  });

  it("parses CREATE INDEX", () => {
    const ast = parseMSSQL(`
      CREATE TABLE users (id INT PRIMARY KEY, email NVARCHAR(255));
      CREATE UNIQUE INDEX idx_email ON users (email);
    `);
    const result = fromMSSQL(ast, DB.MSSQL);

    expect(result.tables[0].indices).toHaveLength(1);
    expect(result.tables[0].indices[0].unique).toBe(true);
  });

  it("maps types to GENERIC affinity", () => {
    const ast = parseMSSQL(
      "CREATE TABLE t (a BIT, b NCHAR(10));",
    );
    const result = fromMSSQL(ast, DB.GENERIC);

    expect(result.tables[0].fields[0].type).toBe("BOOLEAN");
  });
});
