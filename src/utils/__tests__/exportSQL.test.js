import { describe, expect, it } from "vitest";
import { DB } from "../../data/constants";
import { toPostgres } from "../exportSQL/postgres";
import { toMySQL } from "../exportSQL/mysql";
import { toSqlite } from "../exportSQL/sqlite";
import { createDiagram, createField, createRelationship, createTable } from "./helpers";

describe("SQL export", () => {
  it("exports a simple table with two fields", () => {
    const diagram = createDiagram({
      database: DB.POSTGRES,
      tables: [
        createTable({
          fields: [
            createField({ id: "field_id", name: "id", type: "INT" }),
            createField({ id: "field_name", name: "name", type: "VARCHAR", size: "255" }),
          ],
        }),
      ],
      references: [],
    });

    const sql = toPostgres(diagram);

    expect(sql).toContain("CREATE TABLE");
    expect(sql).toContain('"users"');
    expect(sql).toContain('"id" INT');
    expect(sql).toContain('"name" VARCHAR(255)');
  });

  it("exports primary key, not null and unique fields", () => {
    const diagram = createDiagram({
      database: DB.MYSQL,
      tables: [
        createTable({
          fields: [
            createField({ id: "field_id", name: "id", type: "INT", primary: true, notNull: true }),
            createField({ id: "field_email", name: "email", type: "VARCHAR", size: "255", unique: true }),
          ],
        }),
      ],
      references: [],
    });

    const sql = toMySQL(diagram);

    expect(sql).toContain("PRIMARY KEY(`id`)");
    expect(sql).toContain("NOT NULL");
    expect(sql).toContain("UNIQUE");
  });

  it("exports a foreign key relationship", () => {
    const users = createTable({
      id: "table_users",
      name: "users",
      fields: [createField({ id: "field_id", name: "id", type: "INT", primary: true })],
    });

    const posts = createTable({
      id: "table_posts",
      name: "posts",
      fields: [
        createField({ id: "field_id_posts", name: "id", type: "INT", primary: true }),
        createField({ id: "field_user_id", name: "user_id", type: "INT" }),
      ],
    });

    const diagram = createDiagram({
      database: DB.SQLITE,
      tables: [users, posts],
      references: [createRelationship()],
    });

    const sql = toSqlite(diagram);

    expect(sql).toContain("FOREIGN KEY");
    expect(sql).toContain('"user_id"');
    expect(sql).toContain('REFERENCES "users"("id")');
  });

  it("generates dialect-specific quoting", () => {
    const diagram = createDiagram({
      tables: [createTable()],
      references: [],
    });

    expect(toPostgres({ ...diagram, database: DB.POSTGRES })).toContain('"users"');
    expect(toMySQL({ ...diagram, database: DB.MYSQL })).toContain("`users`");
    expect(toSqlite({ ...diagram, database: DB.SQLITE })).toContain('"users"');
  });
});