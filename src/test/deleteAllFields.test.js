import { describe, it, expect, vi } from "vitest";

// ─── Simulate the delete-all-fields logic ─────────────────────────────────────
// The feature calls deleteField(field, tableId) for each field in the table.
// We test that logic directly without needing full React rendering.

function deleteAllFields(tableData, deleteField) {
  tableData.fields.forEach((field) => deleteField(field, tableData.id));
}

describe("Delete All Fields logic", () => {
  it("calls deleteField once per field", () => {
    const deleteField = vi.fn();
    const tableData = {
      id: "t1",
      fields: [
        { id: "f1", name: "id" },
        { id: "f2", name: "name" },
        { id: "f3", name: "email" },
      ],
    };
    deleteAllFields(tableData, deleteField);
    expect(deleteField).toHaveBeenCalledTimes(3);
  });

  it("calls deleteField with correct field and tableId", () => {
    const deleteField = vi.fn();
    const field = { id: "f1", name: "id" };
    const tableData = { id: "t1", fields: [field] };
    deleteAllFields(tableData, deleteField);
    expect(deleteField).toHaveBeenCalledWith(field, "t1");
  });

  it("does nothing when table has no fields", () => {
    const deleteField = vi.fn();
    const tableData = { id: "t1", fields: [] };
    deleteAllFields(tableData, deleteField);
    expect(deleteField).not.toHaveBeenCalled();
  });

  it("passes the correct tableId for each field", () => {
    const deleteField = vi.fn();
    const tableData = {
      id: "table-42",
      fields: [
        { id: "f1", name: "a" },
        { id: "f2", name: "b" },
      ],
    };
    deleteAllFields(tableData, deleteField);
    deleteField.mock.calls.forEach(([, tableId]) => {
      expect(tableId).toBe("table-42");
    });
  });
});
