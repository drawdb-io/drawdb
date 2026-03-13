import { useMemo } from "react";
import { useDiagram, useSettings } from "../../hooks";
import { getTableHeight } from "../../utils/utils";

function buildGraphStats(tableIds, relationships) {
  const ids = new Set(tableIds);
  const outgoing = new Map();
  const undirected = new Map();

  tableIds.forEach((id) => {
    outgoing.set(id, new Set());
    undirected.set(id, new Set());
  });

  relationships.forEach((rel) => {
    if (!ids.has(rel.startTableId) || !ids.has(rel.endTableId)) return;
    outgoing.get(rel.startTableId).add(rel.endTableId);
    undirected.get(rel.startTableId).add(rel.endTableId);
    undirected.get(rel.endTableId).add(rel.startTableId);
  });

  const isolatedTables = tableIds.filter((id) => undirected.get(id).size === 0);

  const seen = new Set();
  let connectedComponents = 0;
  tableIds.forEach((id) => {
    if (seen.has(id)) return;
    connectedComponents += 1;
    const stack = [id];
    seen.add(id);
    while (stack.length > 0) {
      const current = stack.pop();
      undirected.get(current).forEach((next) => {
        if (seen.has(next)) return;
        seen.add(next);
        stack.push(next);
      });
    }
  });

  const state = new Map();
  const memo = new Map();
  const depthFrom = (id) => {
    if (state.get(id) === 1) return 0;
    if (state.get(id) === 2) return memo.get(id);

    state.set(id, 1);
    let best = 1;
    outgoing.get(id).forEach((next) => {
      best = Math.max(best, 1 + depthFrom(next));
    });
    state.set(id, 2);
    memo.set(id, best);
    return best;
  };

  const maxDepth =
    tableIds.length > 0 ? Math.max(...tableIds.map((id) => depthFrom(id))) : 0;

  const maxOutDegree =
    tableIds.length > 0
      ? Math.max(...tableIds.map((id) => outgoing.get(id).size))
      : 0;

  return {
    maxDepth,
    maxOutDegree,
    connectedComponents,
    isolatedTables: isolatedTables.length,
  };
}

export default function StatsBox() {
  const { tables, relationships } = useDiagram();
  const { settings } = useSettings();

  const stats = useMemo(() => {
    const tableIds = tables.map((table) => table.id);
    const fieldsCount = tables.reduce(
      (acc, table) => acc + (table.fields?.length ?? 0),
      0,
    );
    const avgFieldsPerTable =
      tables.length > 0 ? fieldsCount / tables.length : 0;

    let width = 0;
    let height = 0;
    if (tables.length > 0) {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      tables.forEach((table) => {
        const tableHeight = getTableHeight(
          table,
          settings.tableWidth,
          settings.showComments,
        );
        minX = Math.min(minX, table.x);
        minY = Math.min(minY, table.y);
        maxX = Math.max(maxX, table.x + settings.tableWidth);
        maxY = Math.max(maxY, table.y + tableHeight);
      });

      width = maxX - minX;
      height = maxY - minY;
    }

    return {
      tables: tables.length,
      relationships: relationships.length,
      fieldsCount,
      avgFieldsPerTable,
      boundingWidth: width,
      boundingHeight: height,
      ...buildGraphStats(tableIds, relationships),
    };
  }, [relationships, settings.showComments, settings.tableWidth, tables]);

  return (
    <div className="fixed bottom-4 left-4 rounded-xl border border-color bg-[rgba(var(--semi-grey-1),var(--tw-bg-opacity))]/50 p-3 text-xs backdrop-blur-xs select-none pointer-events-none">
      <div className="mb-2 text-sm font-semibold">Layout Stats</div>
      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
        <span>Tables</span>
        <span className="text-right">{stats.tables}</span>
        <span>Relationships</span>
        <span className="text-right">{stats.relationships}</span>
        <span>Total Fields</span>
        <span className="text-right">{stats.fieldsCount}</span>
        <span>Avg Fields / Table</span>
        <span className="text-right">{stats.avgFieldsPerTable.toFixed(2)}</span>
        <span>Max Depth</span>
        <span className="text-right">{stats.maxDepth}</span>
        <span>Max Out-degree</span>
        <span className="text-right">{stats.maxOutDegree}</span>
        <span>Components</span>
        <span className="text-right">{stats.connectedComponents}</span>
        <span>Isolated Tables</span>
        <span className="text-right">{stats.isolatedTables}</span>
        <span>Bounding Width</span>
        <span className="text-right">{stats.boundingWidth.toFixed(0)}</span>
        <span>Bounding Height</span>
        <span className="text-right">{stats.boundingHeight.toFixed(0)}</span>
      </div>
    </div>
  );
}
