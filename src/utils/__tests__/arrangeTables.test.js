import { arrangeTables } from "../arrangeTables";

describe("arrangeTables utility", () => {
  it("should layout tables in two rows when no relationships", () => {
    const diagram = {
      tables: [
        { id: 1, fields: [1] },
        { id: 2, fields: [1,2] },
        { id: 3, fields: [] },
      ],
      relationships: [],
    };
    // if we call without specifying width it should not throw
    arrangeTables(diagram);
    expect(diagram.tables[0].y).toBeGreaterThanOrEqual(0);
    expect(diagram.tables[1].y).toBeGreaterThanOrEqual(0);
    // second half should have y greater than first row
    expect(diagram.tables[2].y).toBeGreaterThan(diagram.tables[0].y);
  });

  it("should assign layers based on relationships and respect tableWidth parameter", () => {
    const diagram = {
      tables: [
        { id: "a", fields: [] },
        { id: "b", fields: [] },
        { id: "c", fields: [] },
      ],
      relationships: [
        { startTableId: "a", endTableId: "b" },
        { startTableId: "b", endTableId: "c" },
      ],
    };
    arrangeTables(diagram, 123);
    // linear chain means each layer should increment y
    expect(diagram.tables.find((t) => t.id === "a").y).toBeLessThan(
      diagram.tables.find((t) => t.id === "b").y,
    );
    expect(diagram.tables.find((t) => t.id === "b").x).toBeGreaterThan(0);
  });
});