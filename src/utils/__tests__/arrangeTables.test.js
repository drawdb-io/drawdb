import { describe, expect, it } from "vitest";
import { arrangeTables } from "../arrangeTables";
import { createDiagram, createField, createTable } from "./helpers";

describe("arrangeTables", () => {
  it("handles an empty table list", () => {
    const diagram = createDiagram({ tables: [] });

    expect(() => arrangeTables(diagram)).not.toThrow();
    expect(diagram.tables).toEqual([]);
  });

  it("positions one table", () => {
    const diagram = createDiagram({ tables: [createTable()] });

    arrangeTables(diagram);

    expect(diagram.tables[0].x).toBeTypeOf("number");
    expect(diagram.tables[0].y).toBeTypeOf("number");
  });

  it("positions multiple tables differently", () => {
    const diagram = createDiagram({
      tables: [
        createTable({ id: "table_a", name: "a" }),
        createTable({ id: "table_b", name: "b" }),
        createTable({ id: "table_c", name: "c" }),
      ],
    });

    arrangeTables(diagram);

    const positions = diagram.tables.map((table) => `${table.x}:${table.y}`);
    expect(new Set(positions).size).toBeGreaterThan(1);
  });

  it("positions tables with different field counts on separate rows", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "table_short",
          name: "short_table",
          fields: [createField({ id: "field_short_id", name: "id" })],
        }),
        createTable({
          id: "table_tall",
          name: "tall_table",
          fields: [
            createField({ id: "field_tall_id", name: "id" }),
            createField({ id: "field_tall_name", name: "name" }),
            createField({ id: "field_tall_email", name: "email" }),
            createField({ id: "field_tall_created", name: "created_at" }),
          ],
        }),
        createTable({
          id: "table_other",
          name: "other_table",
          fields: [createField({ id: "field_other_id", name: "id" })],
        }),
        createTable({
          id: "table_last",
          name: "last_table",
          fields: [createField({ id: "field_last_id", name: "id" })],
        }),
      ],
    });

    arrangeTables(diagram);

    const firstRowY = diagram.tables[0].y;
    const secondRowTables = diagram.tables.filter(
      (table) => table.y !== firstRowY,
    );

    expect(secondRowTables.length).toBeGreaterThan(0);
    expect(secondRowTables.every((table) => table.y > firstRowY)).toBe(true);
  });
});
