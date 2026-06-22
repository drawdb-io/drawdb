import { describe, expect, it } from "vitest";
import { DB } from "../../data/constants";
import { deepDiff } from "../diff";
import { generateMigrationSQL } from "../migrations/diffToSQL";
import {
  createDiagram,
  createField,
  createRelationship,
  createTable,
} from "./helpers";

function getDiff(from, to) {
  const diff = {};
  deepDiff(from, to, diff, ["x", "y"]);
  return diff;
}

function getMigration(from, to, database = DB.POSTGRES) {
  const diff = getDiff(from, to);
  return generateMigrationSQL(diff, database, { from, to });
}

describe("migration SQL generation", () => {
  it("converts an added table into CREATE TABLE", () => {
    const from = createDiagram({ tables: [], relationships: [] });
    const to = createDiagram({
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [createField({ id: "field_id", name: "id", type: "INT" })],
        }),
      ],
      relationships: [],
    });

    const migration = getMigration(from, to);

    expect(migration.up).toContain("CREATE TABLE");
    expect(migration.up).toContain('"users"');
  });

  it("converts a removed table into DROP TABLE", () => {
    const from = createDiagram({
      tables: [createTable({ id: "table_users", name: "users" })],
      relationships: [],
    });
    const to = createDiagram({ tables: [], relationships: [] });

    const migration = getMigration(from, to);

    expect(migration.up).toContain('DROP TABLE "users";');
  });

  it("converts an added field into ALTER TABLE ADD COLUMN", () => {
    const from = createDiagram({
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [createField({ id: "field_id", name: "id", type: "INT" })],
        }),
      ],
      relationships: [],
    });

    const to = createDiagram({
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [
            createField({ id: "field_id", name: "id", type: "INT" }),
            createField({
              id: "field_email",
              name: "email",
              type: "VARCHAR",
              size: "255",
            }),
          ],
        }),
      ],
      relationships: [],
    });

    const migration = getMigration(from, to);

    expect(migration.up).toContain('ALTER TABLE "users" ADD COLUMN "email"');
    expect(migration.up).toContain("VARCHAR");
  });

  it("converts a removed field into ALTER TABLE DROP COLUMN", () => {
    const from = createDiagram({
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [
            createField({ id: "field_id", name: "id", type: "INT" }),
            createField({
              id: "field_email",
              name: "email",
              type: "VARCHAR",
              size: "255",
            }),
          ],
        }),
      ],
      relationships: [],
    });

    const to = createDiagram({
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [createField({ id: "field_id", name: "id", type: "INT" })],
        }),
      ],
      relationships: [],
    });

    const migration = getMigration(from, to);

    expect(migration.up).toContain(
      'ALTER TABLE "users" DROP COLUMN "email";',
    );
  });

  it("converts a changed field type into ALTER COLUMN TYPE", () => {
    const from = createDiagram({
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [createField({ id: "field_id", name: "id", type: "INT" })],
        }),
      ],
      relationships: [],
    });

    const to = createDiagram({
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [
            createField({
              id: "field_id",
              name: "id",
              type: "VARCHAR",
              size: "255",
            }),
          ],
        }),
      ],
      relationships: [],
    });

    const migration = getMigration(from, to);

    expect(migration.up).toContain('ALTER TABLE "users"');
    expect(migration.up).toContain('"id"');
    expect(migration.up).toContain("VARCHAR");
  });

  it("converts an added relationship into a foreign key constraint", () => {
    const users = createTable({
      id: "table_users",
      name: "users",
      fields: [createField({ id: "field_user_id", name: "id", type: "INT" })],
    });

    const posts = createTable({
      id: "table_posts",
      name: "posts",
      fields: [
        createField({ id: "field_post_id", name: "id", type: "INT" }),
        createField({ id: "field_post_user_id", name: "user_id", type: "INT" }),
      ],
    });

    const relationship = createRelationship({
      id: "relationship_posts_users",
      name: "fk_posts_user_id_users",
      startTableId: "table_posts",
      startFieldId: "field_post_user_id",
      endTableId: "table_users",
      endFieldId: "field_user_id",
      fields: [
        {
          startFieldId: "field_post_user_id",
          endFieldId: "field_user_id",
        },
      ],
    });

    const from = createDiagram({
      tables: [users, posts],
      relationships: [],
    });

    const to = createDiagram({
      tables: [users, posts],
      relationships: [relationship],
    });

    const migration = getMigration(from, to);

    expect(migration.up).toContain("FOREIGN KEY");
    expect(migration.up).toContain('"posts"');
    expect(migration.up).toContain('"users"');
    expect(migration.up).toContain('"user_id"');
    expect(migration.up).toContain('"id"');
  });
}); 