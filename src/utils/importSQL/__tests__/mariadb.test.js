import { describe, it, expect } from "vitest";
import { parse } from "@guanmingchiu/sqlparser-ts";
import { fromMariaDB } from "../mariadb";
import { DB } from "../../../data/constants";

// MariaDB uses MySQL dialect in sqlparser-ts
function parseMariaDB(sql) {
  return parse(sql, "mysql");
}

describe("fromMariaDB", () => {
  it("parses a basic CREATE TABLE", () => {
    const ast = parseMariaDB(
      "CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL);",
    );
    const result = fromMariaDB(ast, DB.MARIADB);

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].fields[0].primary).toBe(true);
    expect(result.tables[0].fields[0].increment).toBe(true);
    expect(result.tables[0].fields[1].notNull).toBe(true);
  });

  it("parses FOREIGN KEY constraints", () => {
    const ast = parseMariaDB(`
      CREATE TABLE departments (id INT PRIMARY KEY);
      CREATE TABLE users (
        id INT PRIMARY KEY,
        dept_id INT,
        FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);
    const result = fromMariaDB(ast, DB.MARIADB);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Cascade");
    expect(result.relationships[0].updateConstraint).toBe("No action");
  });

  it("parses table comments", () => {
    const ast = parseMariaDB(
      "CREATE TABLE users (id INT) COMMENT = 'User table';",
    );
    const result = fromMariaDB(ast, DB.MARIADB);

    expect(result.tables[0].comment).toBe("User table");
  });

  it("parses ALTER TABLE ADD FOREIGN KEY", () => {
    const ast = parseMariaDB(`
      CREATE TABLE a (id INT PRIMARY KEY);
      CREATE TABLE b (id INT PRIMARY KEY, a_id INT);
      ALTER TABLE b ADD CONSTRAINT fk_a FOREIGN KEY (a_id) REFERENCES a(id);
    `);
    const result = fromMariaDB(ast, DB.MARIADB);

    expect(result.relationships).toHaveLength(1);
  });

  it("parses CREATE INDEX", () => {
    const ast = parseMariaDB(`
      CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));
      CREATE INDEX idx_email ON users (email);
    `);
    const result = fromMariaDB(ast, DB.MARIADB);

    expect(result.tables[0].indices).toHaveLength(1);
    expect(result.tables[0].indices[0].unique).toBe(false);
  });
});
