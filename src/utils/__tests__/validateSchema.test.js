import { describe, expect, it } from "vitest";
import { ddbDiagramIsValid } from "../validateSchema";
import { getIssues } from "../issues";
import { dbToTypes } from "../../data/datatypes";
import { DB } from "../../data/constants";
import {
  createDiagram,
  createField,
  createRelationship,
  createTable,
} from "./helpers";

function getRelationshipIntegrityIssues(diagram) {
  const issues = [];

  for (const relationship of diagram.relationships ?? []) {
    const startTable = diagram.tables.find(
      (table) => table.id === relationship.startTableId,
    );
    const endTable = diagram.tables.find(
      (table) => table.id === relationship.endTableId,
    );

    if (!startTable || !endTable) {
      issues.push("Relationship references a missing table.");
      continue;
    }

    const fieldPairs = relationship.fields ?? [
      {
        startFieldId: relationship.startFieldId,
        endFieldId: relationship.endFieldId,
      },
    ];

    for (const pair of fieldPairs) {
      const startFieldExists = startTable.fields.some(
        (field) => field.id === pair.startFieldId,
      );
      const endFieldExists = endTable.fields.some(
        (field) => field.id === pair.endFieldId,
      );

      if (!startFieldExists || !endFieldExists) {
        issues.push("Relationship references a missing field.");
      }
    }
  }

  return issues;
}

function getTypeIssues(diagram) {
  const validTypes = dbToTypes[diagram.database ?? DB.MYSQL] ?? {};
  const issues = [];

  for (const table of diagram.tables ?? []) {
    for (const field of table.fields ?? []) {
      if (!validTypes[field.type]) {
        issues.push(`Unknown field type: ${field.type}`);
      }
    }
  }

  return issues;
}

function validateDiagram(diagram) {
  return [
    ...(ddbDiagramIsValid(diagram) ? [] : ["Invalid diagram structure."]),
    ...getIssues(diagram),
    ...getTypeIssues(diagram),
    ...getRelationshipIntegrityIssues(diagram),
  ];
}

describe("schema validation", () => {
  it("accepts a valid schema with one table and valid fields", () => {
    const diagram = createDiagram({
      database: DB.MYSQL,
      tables: [
        createTable({
          id: "table_users",
          name: "users",
          fields: [
            createField({
              id: "field_id",
              name: "id",
              type: "INT",
              primary: true,
            }),
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
      references: [],
    });

    expect(validateDiagram(diagram)).toEqual([]);
  });

  it("detects a table without a name", () => {
    const diagram = createDiagram({
      tables: [createTable({ name: "" })],
    });

    expect(validateDiagram(diagram).length).toBeGreaterThan(0);
  });

  it("detects a field without a name", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          fields: [createField({ name: "" })],
        }),
      ],
    });

    expect(validateDiagram(diagram).length).toBeGreaterThan(0);
  });

  it("detects an unknown field type", () => {
    const diagram = createDiagram({
      database: DB.MYSQL,
      tables: [
        createTable({
          fields: [createField({ type: "TOTALLY_FAKE_TYPE" })],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toContain(
      "Unknown field type: TOTALLY_FAKE_TYPE",
    );
  });

  it("detects a relationship pointing to a missing table", () => {
    const diagram = createDiagram({
      tables: [createTable({ id: "table_users", name: "users" })],
      relationships: [
        createRelationship({
          startTableId: "missing_table",
          endTableId: "table_users",
        }),
      ],
      references: [],
    });

    expect(validateDiagram(diagram)).toContain(
      "Relationship references a missing table.",
    );
  });

  it("detects a relationship pointing to a missing field", () => {
    const users = createTable({
      id: "table_users",
      name: "users",
      fields: [createField({ id: "field_id", name: "id", type: "INT" })],
    });

    const posts = createTable({
      id: "table_posts",
      name: "posts",
      fields: [createField({ id: "field_user_id", name: "user_id", type: "INT" })],
    });

    const diagram = createDiagram({
      tables: [users, posts],
      relationships: [
        createRelationship({
          startTableId: "table_posts",
          startFieldId: "missing_field",
          endTableId: "table_users",
          endFieldId: "field_id",
          fields: [{ startFieldId: "missing_field", endFieldId: "field_id" }],
        }),
      ],
      references: [],
    });

    expect(validateDiagram(diagram)).toContain(
      "Relationship references a missing field.",
    );
  });
});