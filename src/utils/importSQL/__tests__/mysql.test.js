import { describe, it, expect } from "vitest";
import { parse } from "@guanmingchiu/sqlparser-ts";
import { fromMySQL } from "../mysql";
import { DB } from "../../../data/constants";

function parseMySQL(sql) {
  return parse(sql, "mysql");
}

describe("fromMySQL", () => {
  it("parses a basic CREATE TABLE", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL);",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe("users");
    expect(result.tables[0].fields).toHaveLength(2);

    const idField = result.tables[0].fields[0];
    expect(idField.name).toBe("id");
    expect(idField.primary).toBe(true);

    const nameField = result.tables[0].fields[1];
    expect(nameField.name).toBe("name");
    expect(nameField.notNull).toBe(true);
  });

  it("parses AUTO_INCREMENT columns", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT);",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].increment).toBe(true);
    expect(result.tables[0].fields[0].primary).toBe(true);
  });

  it("parses UNIQUE columns", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (email VARCHAR(100) UNIQUE);",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].unique).toBe(true);
  });

  it("parses DEFAULT values", () => {
    const ast = parseMySQL(`
      CREATE TABLE users (
        status VARCHAR(20) DEFAULT 'active',
        count INT DEFAULT 0,
        ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].default).toBe("active");
    expect(result.tables[0].fields[1].default).toBe("0");
    expect(result.tables[0].fields[2].default).toBe("CURRENT_TIMESTAMP");
  });

  it("parses CHECK constraints", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (age INT CHECK (age > 0));",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].check).toContain(">");
  });

  it("parses ENUM types", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (status ENUM('active', 'inactive'));",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].values).toEqual(["active", "inactive"]);
  });

  it("parses column comments", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (id INT COMMENT 'primary key');",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].comment).toBe("primary key");
  });

  it("parses table comments", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (id INT) COMMENT = 'User accounts';",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].comment).toBe("User accounts");
  });

  it("parses VARCHAR with size", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (name VARCHAR(255));",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].size).toBe("255");
  });

  it("parses DECIMAL with precision and scale", () => {
    const ast = parseMySQL(
      "CREATE TABLE products (price DECIMAL(10,2));",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].size).toBe("10,2");
  });

  it("parses PRIMARY KEY constraint", () => {
    const ast = parseMySQL(
      "CREATE TABLE users (id INT, name VARCHAR(50), PRIMARY KEY (id));",
    );
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].fields[0].primary).toBe(true);
    expect(result.tables[0].fields[1].primary).toBe(false);
  });

  it("parses FOREIGN KEY constraints", () => {
    const ast = parseMySQL(`
      CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(100));
      CREATE TABLE users (
        id INT PRIMARY KEY,
        dept_id INT,
        CONSTRAINT fk_dept FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE SET NULL
      );
    `);
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);

    const rel = result.relationships[0];
    expect(rel.startTableId).toBe(result.tables[1].id);
    expect(rel.endTableId).toBe(result.tables[0].id);
    expect(rel.deleteConstraint).toBe("Cascade");
    expect(rel.updateConstraint).toBe("Set null");
  });

  it("parses ALTER TABLE ADD FOREIGN KEY", () => {
    const ast = parseMySQL(`
      CREATE TABLE customers (id INT PRIMARY KEY);
      CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT);
      ALTER TABLE orders ADD CONSTRAINT fk_cust FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    `);
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].deleteConstraint).toBe("Cascade");
  });

  it("parses CREATE INDEX", () => {
    const ast = parseMySQL(`
      CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));
      CREATE UNIQUE INDEX idx_email ON users (email);
    `);
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables[0].indices).toHaveLength(1);
    expect(result.tables[0].indices[0].name).toBe("idx_email");
    expect(result.tables[0].indices[0].unique).toBe(true);
    expect(result.tables[0].indices[0].fields).toEqual(["email"]);
  });

  it("maps types to GENERIC affinity", () => {
    const ast = parseMySQL(
      "CREATE TABLE t (a TINYINT, b MEDIUMINT, c BIT);",
    );
    const result = fromMySQL(ast, DB.GENERIC);

    expect(result.tables[0].fields[0].type).toBe("SMALLINT");
    expect(result.tables[0].fields[1].type).toBe("INTEGER");
    expect(result.tables[0].fields[2].type).toBe("BOOLEAN");
  });

  it("handles multiple tables and relationships", () => {
    const ast = parseMySQL(`
      CREATE TABLE a (id INT PRIMARY KEY);
      CREATE TABLE b (id INT PRIMARY KEY, a_id INT, FOREIGN KEY (a_id) REFERENCES a(id));
      CREATE TABLE c (id INT PRIMARY KEY, b_id INT, FOREIGN KEY (b_id) REFERENCES b(id));
    `);
    const result = fromMySQL(ast, DB.MYSQL);

    expect(result.tables).toHaveLength(3);
    expect(result.relationships).toHaveLength(2);
  });
});
