import { useMemo } from "react";
import { useDiagram } from "../hooks";
import { useTranslation } from "react-i18next";

function computeGraphStats(tables, relationships) {
  const numTables = tables.length;
  const numRelationships = relationships.length;

  if (numTables === 0) {
    return {
      numTables: 0,
      numRelationships: 0,
      maxDepth: 0,
      isolatedTables: 0,
      avgDegree: 0,
    };
  }

  const idSet = new Set(tables.map((t) => t.id));
  const adjacency = new Map();

  idSet.forEach((id) => {
    adjacency.set(id, new Set());
  });

  relationships.forEach((r) => {
    const start = r.startTableId;
    const end = r.endTableId;
    if (!idSet.has(start) || !idSet.has(end) || start === end) return;
    adjacency.get(start).add(end);
    adjacency.get(end).add(start);
  });

  let isolatedTables = 0;
  adjacency.forEach((neighbors) => {
    if (neighbors.size === 0) isolatedTables += 1;
  });

  let maxDepth = 0;
  const ids = Array.from(idSet);

  // Compute graph "depth" as the maximum shortest-path distance between
  // any two connected tables in the (undirected) relationship graph.
  for (const sourceId of ids) {
    const visited = new Set([sourceId]);
    const queue = [[sourceId, 0]];

    while (queue.length) {
      const [current, dist] = queue.shift();
      if (dist > maxDepth) {
        maxDepth = dist;
      }
      const neighbors = adjacency.get(current);
      if (!neighbors) continue;
      neighbors.forEach((n) => {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push([n, dist + 1]);
        }
      });
    }
  }

  const avgDegree =
    numTables === 0 ? 0 : (numRelationships * 2) / numTables || 0;

  return {
    numTables,
    numRelationships,
    maxDepth,
    isolatedTables,
    avgDegree,
  };
}

export default function StatsBox() {
  const { tables, relationships } = useDiagram();
  const { t } = useTranslation();

  const stats = useMemo(
    () => computeGraphStats(tables ?? [], relationships ?? []),
    [tables, relationships],
  );

  if (!stats.numTables && !stats.numRelationships) return null;

  return (
    <div className="absolute left-4 bottom-4 z-10">
      <div className="px-3 py-2 rounded-md shadow-md border border-zinc-600 bg-zinc-900/80 text-xs sm:text-sm text-zinc-100 backdrop-blur-sm space-y-1">
        <div className="font-semibold text-[0.7rem] tracking-wide uppercase">
          {t("stats")}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <div>
            <span className="font-medium">{t("tables")}:</span>{" "}
            <span>{stats.numTables}</span>
          </div>
          <div>
            <span className="font-medium">{t("relationships")}:</span>{" "}
            <span>{stats.numRelationships}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <div>
            <span className="font-medium">{t("max_depth")}:</span>{" "}
            <span>{stats.maxDepth}</span>
          </div>
          <div>
            <span className="font-medium">{t("isolated_tables")}:</span>{" "}
            <span>{stats.isolatedTables}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

