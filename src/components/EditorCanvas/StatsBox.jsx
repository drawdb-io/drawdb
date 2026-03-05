import { useMemo } from "react";
import { useDiagram, useSettings } from "../../hooks";
import { calculateLayoutStats } from "../../utils/autoArrange";

export default function StatsBox() {
  const { tables, relationships } = useDiagram();
  const { settings } = useSettings();

  const stats = useMemo(
    () =>
      calculateLayoutStats({
        tables,
        relationships,
        tableWidth: settings.tableWidth,
      }),
    [relationships, settings.tableWidth, tables],
  );

  return (
    <div className="absolute top-3 right-3 z-20 rounded-lg border border-zinc-400/50 bg-zinc-900/70 text-zinc-100 px-3 py-2 text-xs backdrop-blur-sm select-none">
      <div className="font-semibold uppercase tracking-wide text-[10px] text-zinc-300 mb-1">
        Layout Stats
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div>Tables</div>
        <div className="text-right">{stats.tables}</div>
        <div>Relationships</div>
        <div className="text-right">{stats.relationships}</div>
        <div>Max depth</div>
        <div className="text-right">{stats.maxDepth}</div>
        <div>Crossings</div>
        <div className="text-right">{stats.crossings}</div>
        <div>Components</div>
        <div className="text-right">{stats.connectedComponents}</div>
        <div>Isolated</div>
        <div className="text-right">{stats.isolatedTables}</div>
      </div>
    </div>
  );
}
