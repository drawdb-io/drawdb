import { Parser } from "node-sql-parser";
import { describe, expect, it } from "vitest";
import { DB } from "../../../data/constants";
import { toMySQL } from "../../exportSQL/mysql";
import { importSQL } from "../../importSQL";
import {
  createDiagram,
  createField,
  createRelationship,
  createTable,
} from "../helpers";

const parser = new Parser();

function parseMySQL(sql) {
  return parser.astify(sql, { database: "mysql" });
}

function getTableByName(diagram, name) {
  return diagram.tables.find((table) => table.name === name);
}

function getFieldNames(table) {
  return table.fields.map((field) => field.name);
}

function createUsersPostsSchema() {
  const users = createTable({
    id: "table_users",
    name: "users",
    fields: [
      createField({
        id: "field_users_id",
        name: "id",
        type: "INT",
        primary: true,
        notNull: true,
      }),
      createField({
        id: "field_users_email",
        name: "email",
        type: "VARCHAR",
        size: "255",
        unique: true,
        notNull: true,
      }),
    ],
  });

  const posts = createTable({
    id: "table_posts",
    name: "posts",
    fields: [
      createField({
        id: "field_posts_id",
        name: "id",
        type: "INT",
        primary: true,
        notNull: true,
      }),
      createField({
        id: "field_posts_user_id",
        name: "user_id",
        type: "INT",
        notNull: true,
      }),
      createField({
        id: "field_posts_title",
        name: "title",
        type: "VARCHAR",
        size: "255",
        notNull: true,
      }),
    ],
  });

  const relationship = createRelationship({
    id: "relationship_posts_users",
    name: "fk_posts_user_id_users",
    startTableId: "table_posts",
    startFieldId: "field_posts_user_id",
    endTableId: "table_users",
    endFieldId: "field_users_id",
    fields: [
      {
        startFieldId: "field_posts_user_id",
        endFieldId: "field_users_id",
      },
    ],
  });

  return createDiagram({
    database: DB.MYSQL,
    tables: [users, posts],
    relationships: [relationship],
    references: [relationship],
  });
}

describe("export and import integration flow", () => {
  it("exports a schema to SQL and imports it back preserving database semantics", () => {
    const originalDiagram = createUsersPostsSchema();

    const sql = toMySQL(originalDiagram);
    const ast = parseMySQL(sql);
    const importedDiagram = importSQL(ast, DB.MYSQL, DB.MYSQL);

    const importedUsers = getTableByName(importedDiagram, "users");
    const importedPosts = getTableByName(importedDiagram, "posts");

    expect(importedUsers).toBeDefined();
    expect(importedPosts).toBeDefined();

    expect(getFieldNames(importedUsers)).toEqual(
      expect.arrayContaining(["id", "email"]),
    );
    expect(getFieldNames(importedPosts)).toEqual(
      expect.arrayContaining(["id", "user_id", "title"]),
    );

    expect(
      importedUsers.fields.find((field) => field.name === "id").primary,
    ).toBe(true);
    expect(
      importedPosts.fields.find((field) => field.name === "user_id").notNull,
    ).toBe(true);

    expect(importedDiagram.relationships).toHaveLength(1);
  });
});