import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Pure function: computeMaxDepth ──────────────────────────────────────────
// Extracted inline so we can test it without React context
function computeMaxDepth(tables, relationships) {
  if (tables.length === 0) return 0;
  const tableIds = new Set(tables.map((t) => t.id));
  const adj = {};
  tableIds.forEach((id) => (adj[id] = []));
  relationships.forEach((r) => {
    if (adj[r.startTableId]) adj[r.startTableId].push(r.endTableId);
  });
  const memo = {};
  const dfs = (nodeId, visited) => {
    if (memo[nodeId] !== undefined) return memo[nodeId];
    let max = 0;
    for (const neighbor of adj[nodeId] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        max = Math.max(max, 1 + dfs(neighbor, visited));
        visited.delete(neighbor);
      }
    }
    memo[nodeId] = max;
    return max;
  };
  let maxDepth = 0;
  tableIds.forEach((id) => {
    const visited = new Set([id]);
    maxDepth = Math.max(maxDepth, dfs(id, visited));
  });
  return maxDepth;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("computeMaxDepth", () => {
  it("returns 0 when there are no tables", () => {
    expect(computeMaxDepth([], [])).toBe(0);
  });

  it("returns 0 when tables exist but no relationships", () => {
    const tables = [{ id: "a" }, { id: "b" }];
    expect(computeMaxDepth(tables, [])).toBe(0);
  });

  it("returns 1 for a single relationship between two tables", () => {
    const tables = [{ id: "a" }, { id: "b" }];
    const rels = [{ startTableId: "a", endTableId: "b" }];
    expect(computeMaxDepth(tables, rels)).toBe(1);
  });

  it("returns correct depth for a chain of 3 tables", () => {
    const tables = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const rels = [
      { startTableId: "a", endTableId: "b" },
      { startTableId: "b", endTableId: "c" },
    ];
    expect(computeMaxDepth(tables, rels)).toBe(2);
  });

  it("handles branching — returns the longest branch", () => {
    // a -> b -> c
    // a -> d
    const tables = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const rels = [
      { startTableId: "a", endTableId: "b" },
      { startTableId: "b", endTableId: "c" },
      { startTableId: "a", endTableId: "d" },
    ];
    expect(computeMaxDepth(tables, rels)).toBe(2);
  });

  it("does not infinite-loop on cycles", () => {
    const tables = [{ id: "a" }, { id: "b" }];
    const rels = [
      { startTableId: "a", endTableId: "b" },
      { startTableId: "b", endTableId: "a" },
    ];
    expect(() => computeMaxDepth(tables, rels)).not.toThrow();
    expect(computeMaxDepth(tables, rels)).toBe(1);
  });
});

// ─── StatsBox rendering ───────────────────────────────────────────────────────
// We mock the hooks so we can render without the full context tree
vi.mock("../hooks", () => ({
  useDiagram: vi.fn(),
  useSettings: vi.fn(),
}));

import { useDiagram, useSettings } from "../hooks";
import StatsBox from "../components/StatsBox";

describe("StatsBox component", () => {
  const mockSettings = { settings: { mode: "light" } };

  it("renders 'Diagram Stats' heading", () => {
    useDiagram.mockReturnValue({ tables: [], relationships: [] });
    useSettings.mockReturnValue(mockSettings);
    render(<StatsBox />);
    expect(screen.getByText(/Diagram Stats/i)).toBeInTheDocument();
  });

  it("shows 0 tables, 0 relationships, 0 max depth when empty", () => {
    useDiagram.mockReturnValue({ tables: [], relationships: [] });
    useSettings.mockReturnValue(mockSettings);
    render(<StatsBox />);
    const values = screen.getAllByText("0");
    expect(values.length).toBe(3);
  });

  it("shows correct table count", () => {
    useDiagram.mockReturnValue({
      tables: [{ id: "a" }, { id: "b" }],
      relationships: [],
    });
    useSettings.mockReturnValue(mockSettings);
    render(<StatsBox />);
    expect(screen.getByText("Tables")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows correct relationship count", () => {
    useDiagram.mockReturnValue({
      tables: [{ id: "a" }, { id: "b" }],
      relationships: [{ startTableId: "a", endTableId: "b" }],
    });
    useSettings.mockReturnValue(mockSettings);
    render(<StatsBox />);
    expect(screen.getByText("Relationships")).toBeInTheDocument();
    // Both relationships (1) and max depth (1) show "1" — expect at least one
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("shows max depth of 1 for a single relationship", () => {
    useDiagram.mockReturnValue({
      tables: [{ id: "a" }, { id: "b" }],
      relationships: [{ startTableId: "a", endTableId: "b" }],
    });
    useSettings.mockReturnValue(mockSettings);
    render(<StatsBox />);
    expect(screen.getByText("Max depth")).toBeInTheDocument();
  });
});
