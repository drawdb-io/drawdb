import { useMemo } from "react";
import { useDiagram } from "../hooks";

function computeGraphStats(tables, relationships) {
  const tableIds = tables.map((t) => t.id);
  const tableIdSet = new Set(tableIds);

  const validEdges = relationships.filter(
    (r) => tableIdSet.has(r.startTableId) && tableIdSet.has(r.endTableId),
  );

  const outMap = new Map(tableIds.map((id) => [id, []]));
  const inDegree = new Map(tableIds.map((id) => [id, 0]));
  const outDegree = new Map(tableIds.map((id) => [id, 0]));
  const undirected = new Map(tableIds.map((id) => [id, []]));

  validEdges.forEach((e) => {
    outMap.get(e.startTableId).push(e.endTableId);
    outDegree.set(e.startTableId, (outDegree.get(e.startTableId) || 0) + 1);
    inDegree.set(e.endTableId, (inDegree.get(e.endTableId) || 0) + 1);
    undirected.get(e.startTableId).push(e.endTableId);
    undirected.get(e.endTableId).push(e.startTableId);
  });

  const roots = tableIds.filter((id) => (inDegree.get(id) || 0) === 0).length;
  const leaves = tableIds.filter((id) => (outDegree.get(id) || 0) === 0).length;
  const isolated = tableIds.filter(
    (id) => (inDegree.get(id) || 0) === 0 && (outDegree.get(id) || 0) === 0,
  ).length;

  let connectedComponents = 0;
  const seen = new Set();
  for (const id of tableIds) {
    if (seen.has(id)) continue;
    connectedComponents++;
    const stack = [id];
    seen.add(id);
    while (stack.length > 0) {
      const curr = stack.pop();
      for (const next of undirected.get(curr)) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
  }

  // Tarjan SCC for cycle and condensation DAG depth.
  let idx = 0;
  const index = new Map();
  const lowlink = new Map();
  const onStack = new Set();
  const stack = [];
  const sccs = [];
  const nodeToScc = new Map();

  function strongConnect(v) {
    index.set(v, idx);
    lowlink.set(v, idx);
    idx++;
    stack.push(v);
    onStack.add(v);

    for (const w of outMap.get(v)) {
      if (!index.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v), index.get(w)));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const scc = [];
      while (stack.length > 0) {
        const w = stack.pop();
        onStack.delete(w);
        scc.push(w);
        nodeToScc.set(w, sccs.length);
        if (w === v) break;
      }
      sccs.push(scc);
    }
  }

  for (const id of tableIds) {
    if (!index.has(id)) strongConnect(id);
  }

  const sccHasSelfLoop = (scc) =>
    scc.length === 1 && outMap.get(scc[0]).includes(scc[0]);
  const cyclicSccs = sccs.filter((scc) => scc.length > 1 || sccHasSelfLoop(scc));
  const hasCycle = cyclicSccs.length > 0;

  const sccAdj = new Map(sccs.map((_, i) => [i, new Set()]));
  for (const e of validEdges) {
    const from = nodeToScc.get(e.startTableId);
    const to = nodeToScc.get(e.endTableId);
    if (from !== to) sccAdj.get(from).add(to);
  }

  const sccWeight = sccs.map((scc) => scc.length);
  const memo = new Map();
  const depthFrom = (sccId) => {
    if (memo.has(sccId)) return memo.get(sccId);
    let bestChild = 0;
    for (const next of sccAdj.get(sccId)) {
      bestChild = Math.max(bestChild, depthFrom(next));
    }
    const depth = sccWeight[sccId] + bestChild;
    memo.set(sccId, depth);
    return depth;
  };

  let maxDepth = 0;
  for (let i = 0; i < sccs.length; i++) {
    maxDepth = Math.max(maxDepth, depthFrom(i));
  }

  return {
    tables: tables.length,
    relationships: validEdges.length,
    roots,
    leaves,
    isolated,
    connectedComponents,
    maxDepth,
    hasCycle,
  };
}

export default function StatsBox() {
  const { tables, relationships } = useDiagram();

  const stats = useMemo(
    () => computeGraphStats(tables, relationships),
    [tables, relationships],
  );

  return (
    <div className="popover-theme rounded-lg p-3 min-w-56 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-2">
        Stats
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>Tables</div>
        <div className="text-right">{stats.tables}</div>
        <div>Relationships</div>
        <div className="text-right">{stats.relationships}</div>
        <div>Max depth</div>
        <div className="text-right">{stats.maxDepth}</div>
        <div>Roots</div>
        <div className="text-right">{stats.roots}</div>
        <div>Leaves</div>
        <div className="text-right">{stats.leaves}</div>
        <div>Isolated</div>
        <div className="text-right">{stats.isolated}</div>
        <div>Components</div>
        <div className="text-right">{stats.connectedComponents}</div>
        <div>Cycles</div>
        <div className="text-right">{stats.hasCycle ? "Yes" : "No"}</div>
      </div>
    </div>
  );
}
