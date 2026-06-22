import { Parser } from "node-sql-parser";
import { describe, expect, it } from "vitest";
import { DB } from "../../data/constants";
import { importSQL } from "../importSQL";

const parser = new Parser();

function parse(sql, database = "mysql") {
  return parser.astify(sql, { database });
}

describe("SQL import", () => {
  it("imports a simple CREATE TABLE", () => {
    const ast = parse("CREATE TABLE users (id INT, name VARCHAR(255));");
    const diagram = importSQL(ast, DB.MYSQL, DB.MYSQL);

    expect(diagram.tables).toHaveLength(1);
    expect(diagram.tables[0].name).toBe("users");
    expect(diagram.tables[0].fields.map((field) => field.name)).toEqual(["id", "name"]);
  });

  it("imports a primary key", () => {
    const ast = parse("CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));");
    const diagram = importSQL(ast, DB.MYSQL, DB.MYSQL);

    expect(diagram.tables[0].fields.find((field) => field.name === "id").primary).toBe(true);
  });

  it("imports NOT NULL fields", () => {
    const ast = parse("CREATE TABLE users (email VARCHAR(255) NOT NULL);");
    const diagram = importSQL(ast, DB.MYSQL, DB.MYSQL);

    expect(diagram.tables[0].fields[0].notNull).toBe(true);
  });

  it("does not crash when invalid SQL is parsed by the caller", () => {
    expect(() => parse("CREATE TABLE broken (")).toThrow();
  });

  it("imports a foreign key relationship", () => {
    const ast = parse(`
      CREATE TABLE users (
        id INT PRIMARY KEY
      );

      CREATE TABLE posts (
        id INT PRIMARY KEY,
        user_id INT,
        CONSTRAINT fk_posts_user_id_users
          FOREIGN KEY (user_id)
          REFERENCES users(id)
      );
    `);

    const diagram = importSQL(ast, DB.MYSQL, DB.MYSQL);

    expect(diagram.tables).toHaveLength(2);
    expect(diagram.relationships).toHaveLength(1);

    const relationship = diagram.relationships[0];
    const posts = diagram.tables.find((table) => table.name === "posts");
    const users = diagram.tables.find((table) => table.name === "users");

    expect(relationship.startTableId).toBe(posts.id);
    expect(relationship.endTableId).toBe(users.id);
  });

  it("imports different field types", () => {
    const ast = parse(`
      CREATE TABLE products (
        id INT,
        name VARCHAR(255),
        price DECIMAL(10,2),
        active BOOLEAN
      );
    `);

    const diagram = importSQL(ast, DB.MYSQL, DB.MYSQL);

    const fieldsByName = Object.fromEntries(
      diagram.tables[0].fields.map((field) => [field.name, field]),
    );

    expect(fieldsByName.id.type).toBe("INT");
    expect(fieldsByName.name.type).toBe("VARCHAR");
    expect(fieldsByName.price.type).toBe("DECIMAL");
    expect(fieldsByName.active.type).toBe("BOOLEAN");
  });
});
