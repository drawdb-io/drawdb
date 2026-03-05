import { useMemo } from "react";
import { useDiagram, useAreas, useNotes, useTypes } from "../hooks";

function computeMaxDepth(tables, relationships) {
  if (!tables || tables.length === 0) return 0;

  const tableIds = new Set(tables.map((t) => t.id));
  const adjacency = new Map();

  tableIds.forEach((id) => adjacency.set(id, new Set()));

  relationships?.forEach((r) => {
    const { startTableId, endTableId } = r;
    if (!tableIds.has(startTableId) || !tableIds.has(endTableId)) return;
    if (!adjacency.has(startTableId)) adjacency.set(startTableId, new Set());
    if (!adjacency.has(endTableId)) adjacency.set(endTableId, new Set());
    adjacency.get(startTableId).add(endTableId);
    adjacency.get(endTableId).add(startTableId);
  });

  if (adjacency.size === 0) return 0;

  const bfsMaxDist = (startId) => {
    const visited = new Set([startId]);
    const queue = [[startId, 0]];
    let localMax = 0;

    while (queue.length) {
      const [current, dist] = queue.shift();
      localMax = Math.max(localMax, dist);
      const neighbors = adjacency.get(current) || new Set();
      neighbors.forEach((n) => {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push([n, dist + 1]);
        }
      });
    }

    return localMax;
  };

  let maxDepth = 0;
  tableIds.forEach((id) => {
    const depth = bfsMaxDist(id);
    if (depth > maxDepth) maxDepth = depth;
  });

  return maxDepth;
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-200">{value}</span>
    </div>
  );
}

export default function StatsBox() {
  const { tables, relationships } = useDiagram();
  const { areas } = useAreas();
  const { notes } = useNotes();
  const { types } = useTypes();

  const stats = useMemo(() => {
    const tableCount = tables?.length ?? 0;
    const relationshipCount = relationships?.length ?? 0;
    const areaCount = areas?.length ?? 0;
    const noteCount = notes?.length ?? 0;
    const typeCount = types?.length ?? 0;

    let totalFields = 0;
    let maxFields = 0;

    (tables || []).forEach((t) => {
      const count = t.fields?.length ?? 0;
      totalFields += count;
      if (count > maxFields) maxFields = count;
    });

    const avgFields =
      tableCount > 0 ? (totalFields / tableCount).toFixed(1) : "0.0";

    const maxDepth = computeMaxDepth(tables || [], relationships || []);

    return {
      tableCount,
      relationshipCount,
      areaCount,
      noteCount,
      typeCount,
      totalFields,
      maxFields,
      avgFields,
      maxDepth,
    };
  }, [tables, relationships, areas, notes, types]);

  if (
    !stats.tableCount &&
    !stats.relationshipCount &&
    !stats.areaCount &&
    !stats.noteCount &&
    !stats.typeCount
  ) {
    return null;
  }

  return (
    <div className="popover-theme rounded-lg shadow-lg px-3 py-2 max-w-xs text-xs">
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-1 text-zinc-400">
        Layout stats
      </div>
      <div className="space-y-0.5">
        <StatRow label="Tables" value={stats.tableCount} />
        <StatRow label="Relationships" value={stats.relationshipCount} />
        <StatRow label="Areas" value={stats.areaCount} />
        <StatRow label="Notes" value={stats.noteCount} />
        <StatRow label="Custom types" value={stats.typeCount} />
        <StatRow label="Total fields" value={stats.totalFields} />
        <StatRow label="Max fields in table" value={stats.maxFields} />
        <StatRow label="Avg fields / table" value={stats.avgFields} />
        <StatRow label="Max depth (hops)" value={stats.maxDepth} />
      </div>
    </div>
  );
}

