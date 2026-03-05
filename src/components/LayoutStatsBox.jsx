import { useMemo } from "react";
import { useDiagram, useSettings } from "../hooks";
import { getLayoutStats } from "../utils/layoutStats";

export default function LayoutStatsBox() {
  const { tables, relationships } = useDiagram();
  const { settings } = useSettings();

  const stats = useMemo(
    () => getLayoutStats(tables, relationships, settings.tableWidth),
    [tables, relationships, settings.tableWidth],
  );

  return (
    <div className="popover-theme rounded-lg border border-black/10 dark:border-white/10 p-3 min-w-[220px] shadow-lg">
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">
        Layout Stats
      </div>
      <div className="text-sm space-y-1">
        <div className="flex justify-between gap-3">
          <span>Tables</span>
          <span>{stats.tables}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Relationships</span>
          <span>{stats.relationships}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Line crossings</span>
          <span>{stats.crossings}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Max depth</span>
          <span>{stats.maxDepth}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Components</span>
          <span>{stats.components}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Isolated tables</span>
          <span>{stats.isolatedTables}</span>
        </div>
      </div>
    </div>
  );
}
