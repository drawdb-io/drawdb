import { useMemo } from "react";
import { useDiagram, useSettings } from "../hooks";

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

export default function StatsBox() {
  const { tables, relationships } = useDiagram();
  const { settings } = useSettings();

  const maxDepth = useMemo(
    () => computeMaxDepth(tables, relationships),
    [tables, relationships],
  );

  return (
    <div
      className={`popover-theme rounded-lg px-4 py-3 text-sm min-w-[160px] shadow-lg`}
    >
      <div className="font-semibold mb-2 text-xs uppercase tracking-wide opacity-60">
        Diagram Stats
      </div>
      <div className="flex justify-between gap-4">
        <span className="opacity-70">Tables</span>
        <span className="font-mono font-bold">{tables.length}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="opacity-70">Relationships</span>
        <span className="font-mono font-bold">{relationships.length}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="opacity-70">Max depth</span>
        <span className="font-mono font-bold">{maxDepth}</span>
      </div>
    </div>
  );
}
