import { describe, expect, it } from "vitest";
import { DB } from "../../../data/constants";
import { deepDiff } from "../../diff";
import { generateMigrationSQL } from "../../migrations/diffToSQL";
import { createDiagram, createField, createTable } from "../helpers";

function getDiff(from, to) {
  const diff = {};
  deepDiff(from, to, diff, ["x", "y"]);
  return diff;
}

describe("diff and migration integration flow", () => {
  it("detects schema changes and generates coherent migration SQL", () => {
    const from = createDiagram({
      database: DB.POSTGRES,
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [
            createField({
              id: "field_users_id",
              name: "id",
              type: "INT",
              primary: true,
            }),
          ],
        }),
      ],
      relationships: [],
      references: [],
    });

    const to = createDiagram({
      database: DB.POSTGRES,
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [
            createField({
              id: "field_users_id",
              name: "id",
              type: "INT",
              primary: true,
            }),
            createField({
              id: "field_users_email",
              name: "email",
              type: "VARCHAR",
              size: "255",
              notNull: true,
            }),
          ],
        }),
        createTable({
          id: "table_profiles",
          name: "profiles",
          fields: [
            createField({
              id: "field_profiles_id",
              name: "id",
              type: "INT",
              primary: true,
            }),
          ],
        }),
      ],
      relationships: [],
      references: [],
    });

    const diff = getDiff(from, to);
    const migration = generateMigrationSQL(diff, DB.POSTGRES, { from, to });

    expect(Object.keys(diff).length).toBeGreaterThan(0);
    expect(migration.up).toContain("CREATE TABLE");
    expect(migration.up).toContain('"profiles"');
    expect(migration.up).toContain('ALTER TABLE "users" ADD COLUMN "email"');
  });
});