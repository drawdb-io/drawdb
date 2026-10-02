import { describe, expect, it } from "vitest";
import { toMSSQL } from "../src/utils/exportSQL/mssql";
import { importSQL } from "../src/utils/importSQL";
import { parseMssqlSource } from "../src/utils/importSQL/mssql";
import { DB } from "../src/data/constants";

const diagram = {
  database: DB.MSSQL,
  tables: [
    {
      id: "t1",
      name: "users",
      comment: "",
      fields: [
        {
          id: "f1",
          name: "id",
          type: "INT",
          size: "",
          increment: true,
          notNull: true,
          unique: false,
          primary: true,
          default: "",
          check: "",
          comment: "",
        },
        {
          id: "f2",
          name: "email",
          type: "NVARCHAR",
          size: "255",
          increment: false,
          notNull: true,
          unique: false,
          primary: false,
          default: "",
          check: "",
          comment: "",
        },
      ],
      indices: [],
      uniqueConstraints: [],
    },
    {
      id: "t2",
      name: "posts",
      comment: "",
      fields: [
        {
          id: "f3",
          name: "id",
          type: "BIGINT",
          size: "",
          increment: true,
          notNull: true,
          unique: false,
          primary: true,
          default: "",
          check: "",
          comment: "",
        },
        {
          id: "f4",
          name: "user_id",
          type: "INT",
          size: "",
          increment: false,
          notNull: true,
          unique: false,
          primary: false,
          default: "",
          check: "",
          comment: "",
        },
      ],
      indices: [
        { name: "idx_posts_user_id", unique: false, fields: ["user_id"] },
      ],
      uniqueConstraints: [],
    },
  ],
  references: [
    {
      id: "r1",
      name: "fk_posts_user_id_users",
      startTableId: "t2",
      endTableId: "t1",
      startFieldId: "f4",
      endFieldId: "f1",
      fields: [{ startFieldId: "f4", endFieldId: "f1" }],
      cardinality: "many_to_one",
      updateConstraint: "No action",
      deleteConstraint: "Cascade",
    },
  ],
};

describe("MSSQL export/import round-trip (#320)", () => {
  it("imports a diagram previously exported with toMSSQL", () => {
    const sql = toMSSQL(diagram);
    const ast = parseMssqlSource(sql);
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.tables.map((t) => t.name)).toEqual(["users", "posts"]);
    expect(imported.tables[0].fields.map((f) => f.name)).toEqual([
      "id",
      "email",
    ]);
    expect(imported.tables[1].fields.map((f) => f.name)).toEqual([
      "id",
      "user_id",
    ]);
    expect(imported.tables[1].indices).toEqual([
      { id: 0, name: "idx_posts_user_id", unique: false, fields: ["user_id"] },
    ]);

    expect(imported.relationships).toHaveLength(1);
    const relationship = imported.relationships[0];
    const startTable = imported.tables.find(
      (t) => t.id === relationship.startTableId,
    );
    const endTable = imported.tables.find(
      (t) => t.id === relationship.endTableId,
    );
    expect(startTable.name).toBe("posts");
    expect(endTable.name).toBe("users");
    expect(relationship.updateConstraint).toBe("No action");
    expect(relationship.deleteConstraint).toBe("Cascade");
  });

  it("imports GO batches that are not terminated by semicolons", () => {
    const ast = parseMssqlSource(
      [
        "CREATE TABLE [users] ([id] INT, [email] NVARCHAR(255))",
        "GO",
        "CREATE TABLE [posts] ([id] INT, [user_id] INT)",
        "GO",
      ].join("\n"),
    );
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.tables.map((t) => t.name)).toEqual(["users", "posts"]);
  });

  it("imports foreign keys declared as named ALTER TABLE constraints", () => {
    const ast = parseMssqlSource(
      [
        "CREATE TABLE [users] ([id] INT, PRIMARY KEY([id]));",
        "GO",
        "CREATE TABLE [posts] ([id] INT, [user_id] INT, PRIMARY KEY([id]));",
        "GO",
        "ALTER TABLE [dbo].[posts]",
        "ADD CONSTRAINT [fk_posts_user] FOREIGN KEY ([user_id])",
        "REFERENCES [dbo].[users] ([id])",
        "ON UPDATE SET NULL ON DELETE NO ACTION;",
        "GO",
      ].join("\n"),
    );
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.relationships).toHaveLength(1);
    const relationship = imported.relationships[0];
    const startTable = imported.tables.find(
      (t) => t.id === relationship.startTableId,
    );
    const endTable = imported.tables.find(
      (t) => t.id === relationship.endTableId,
    );
    expect(startTable.name).toBe("posts");
    expect(endTable.name).toBe("users");
    expect(relationship.updateConstraint).toBe("Set null");
    expect(relationship.deleteConstraint).toBe("No action");
  });

  it("imports statements without any GO batches", () => {
    const ast = parseMssqlSource(
      "CREATE TABLE [users] ([id] INT);\nCREATE TABLE [posts] ([id] INT);",
    );
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.tables.map((t) => t.name)).toEqual(["users", "posts"]);
  });

  it("imports a single statement without a terminator", () => {
    const ast = parseMssqlSource("CREATE TABLE [users] ([id] INT)");
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.tables.map((t) => t.name)).toEqual(["users"]);
  });

  it("keeps parsing when batches contain extended properties", () => {
    const ast = parseMssqlSource(
      [
        "CREATE TABLE [users] ([id] INT, PRIMARY KEY([id]));",
        "GO",
        "EXEC sys.sp_addextendedproperty",
        "    @name=N'MS_Description', @value=N'the users',",
        "    @level0type=N'SCHEMA',@level0name=N'dbo',",
        "    @level1type=N'TABLE',@level1name=N'users';",
        "GO",
      ].join("\n"),
    );
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.tables.map((t) => t.name)).toEqual(["users"]);
  });

  it("imports foreign keys without referential actions", () => {
    const ast = parseMssqlSource(
      [
        "CREATE TABLE [users] ([id] INT);",
        "GO",
        "CREATE TABLE [posts] ([user_id] INT);",
        "GO",
        "ALTER TABLE [posts] ADD FOREIGN KEY([user_id]) REFERENCES [users]([id]);",
        "GO",
      ].join("\n"),
    );
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.relationships).toHaveLength(1);
    expect(imported.relationships[0].updateConstraint).toBe("No action");
    expect(imported.relationships[0].deleteConstraint).toBe("No action");
  });

  it("imports foreign keys with multi-line column lists", () => {
    const ast = parseMssqlSource(
      [
        "CREATE TABLE [users] ([id] INT);",
        "GO",
        "CREATE TABLE [posts] ([user_id] INT);",
        "GO",
        "ALTER TABLE [posts]",
        "ADD CONSTRAINT [fk_posts_user]",
        "FOREIGN KEY",
        "(",
        "  [user_id]",
        ")",
        "REFERENCES [users]",
        "(",
        "  [id]",
        ")",
        "ON DELETE CASCADE;",
        "GO",
      ].join("\n"),
    );
    const imported = importSQL(ast, DB.MSSQL, DB.MSSQL);

    expect(imported.relationships).toHaveLength(1);
    expect(imported.relationships[0].deleteConstraint).toBe("Cascade");
  });
});
