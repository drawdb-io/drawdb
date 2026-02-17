import { describe, it, expect } from "vitest";
import { parse } from "@guanmingchiu/sqlparser-ts";
import { fromOracleSQL } from "../oraclesql";
import { DB } from "../../../data/constants";

function parseOracle(sql) {
  return parse(sql, "oracle");
}

describe("fromOracleSQL", () => {
  it("parses a basic CREATE TABLE with Oracle types", () => {
    const ast = parseOracle(
      "CREATE TABLE employees (id NUMBER(10) PRIMARY KEY, name VARCHAR2(100) NOT NULL);",
    );
    const result = fromOracleSQL(ast, DB.ORACLESQL);

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe("employees");
    expect(result.tables[0].fields).toHaveLength(2);
    expect(result.tables[0].fields[0].primary).toBe(true);
    expect(result.tables[0].fields[0].size).toBe("10");
    expect(result.tables[0].fields[1].notNull).toBe(true);
    expect(result.tables[0].fields[1].size).toBe("100");
  });

  it("parses FOREIGN KEY constraints", () => {
    const ast = parseOracle(`
      CREATE TABLE departments (id NUMBER(10) PRIMARY KEY, name VARCHAR2(100));
      CREATE TABLE employees (
        id NUMBER(10) PRIMARY KEY,
        dept_id NUMBER(10),
        CONSTRAINT fk_dept FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE
      );
    `);
    const result = fromOracleSQL(ast, DB.ORACLESQL);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Cascade");
  });

  it("parses PRIMARY KEY constraint", () => {
    const ast = parseOracle(
      "CREATE TABLE t (a NUMBER(10), b VARCHAR2(50), PRIMARY KEY (a));",
    );
    const result = fromOracleSQL(ast, DB.ORACLESQL);

    expect(result.tables[0].fields[0].primary).toBe(true);
    expect(result.tables[0].fields[1].primary).toBe(false);
  });
});
