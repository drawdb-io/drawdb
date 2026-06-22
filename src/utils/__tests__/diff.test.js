import { describe, expect, it } from "vitest";
import { deepDiff } from "../diff";
import { createDiagram, createField, createTable } from "./helpers";
import { createRelationship } from "./helpers";

function getDiff(before, after) {
  const diff = {};
  deepDiff(before, after, diff, ["x", "y"]);
  return diff;
}

describe("deepDiff", () => {
  it("detects added tables", () => {
    const before = createDiagram({ tables: [] });
    const after = createDiagram({ tables: [createTable()] });

    expect(Object.values(getDiff(before, after))[0].from).toBeNull();
  });

  it("detects removed tables", () => {
    const before = createDiagram({ tables: [createTable()] });
    const after = createDiagram({ tables: [] });

    expect(Object.values(getDiff(before, after))[0].to).toBeNull();
  });

  it("detects added fields", () => {
    const before = createDiagram();
    const after = createDiagram({
      tables: [
        createTable({
          fields: [
            createField({ id: "field_id", name: "id" }),
            createField({ id: "field_email", name: "email", type: "VARCHAR" }),
          ],
        }),
      ],
    });

    const diff = getDiff(before, after);

    expect(Object.keys(diff).some((key) => key.includes("fields"))).toBe(true);
  });

  it("detects changed field type", () => {
    const before = createDiagram({
      tables: [createTable({ fields: [createField({ id: "field_id", type: "INT" })] })],
    });

    const after = createDiagram({
      tables: [createTable({ fields: [createField({ id: "field_id", type: "VARCHAR" })] })],
    });

    const diff = getDiff(before, after);

    expect(Object.keys(diff).some((key) => key.endsWith("#type"))).toBe(true);
  });

  it("detects removed fields", () => {
    const before = createDiagram({
      tables: [
        createTable({
          fields: [
            createField({ id: "field_id", name: "id" }),
            createField({ id: "field_email", name: "email", type: "VARCHAR" }),
          ],
        }),
      ],
    });

    const after = createDiagram({
      tables: [
        createTable({
          fields: [createField({ id: "field_id", name: "id" })],
        }),
      ],
    });

    const diff = getDiff(before, after);

    expect(
      Object.values(diff).some(
        (change) => change.from?.name === "email" && change.to === null,
      ),
    ).toBe(true);
  });

  it("detects added relationships", () => {
    const before = createDiagram({ relationships: [] });
    const after = createDiagram({
      relationships: [createRelationship({ id: "relationship_users_posts" })],
    });

    const diff = getDiff(before, after);

    expect(
      Object.keys(diff).some((key) => key.startsWith("relationships")),
    ).toBe(true);
  });

  it("detects removed relationships", () => {
    const before = createDiagram({
      relationships: [createRelationship({ id: "relationship_users_posts" })],
    });
    const after = createDiagram({ relationships: [] });

    const diff = getDiff(before, after);

    expect(
      Object.keys(diff).some((key) => key.startsWith("relationships")),
    ).toBe(true);
  });
});
