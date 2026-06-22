import { describe, expect, it } from "vitest";
import { DB } from "../../../data/constants";
import { ddbDiagramIsValid } from "../../validateSchema";
import { getIssues } from "../../issues";
import { toMySQL } from "../../exportSQL/mysql";
import {
  createDiagram,
  createField,
  createRelationship,
  createTable,
} from "../helpers";

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

describe("validation and export integration flow", () => {
  it("allows valid schemas to be exported and detects invalid schemas before export", () => {
    const validDiagram = createUsersPostsSchema();

    expect(ddbDiagramIsValid(validDiagram)).toBe(true);
    expect(getIssues(validDiagram)).toEqual([]);
    expect(() => toMySQL(validDiagram)).not.toThrow();
    expect(toMySQL(validDiagram)).toContain("CREATE TABLE");

    const invalidDiagram = createDiagram({
      database: DB.MYSQL,
      tables: [
        createTable({
          name: "",
          fields: [createField()],
        }),
      ],
      relationships: [],
      references: [],
    });

    expect(ddbDiagramIsValid(invalidDiagram)).toBe(true);
    expect(getIssues(invalidDiagram).length).toBeGreaterThan(0);
  });
});