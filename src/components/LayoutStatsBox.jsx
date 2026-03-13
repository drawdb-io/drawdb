import { useMemo } from "react";
import { useDiagram, useSettings } from "../hooks";
import { getLayoutStats } from "../utils/layoutStats";
import { useTranslation } from "react-i18next";

export default function LayoutStatsBox() {
  const { tables, relationships } = useDiagram();
  const { settings } = useSettings();
  const { t } = useTranslation();

  const stats = useMemo(
    () => getLayoutStats(tables, relationships, settings.tableWidth),
    [tables, relationships, settings.tableWidth],
  );

  return (
    <div className="popover-theme rounded-lg border border-black/10 dark:border-white/10 p-3 min-w-[220px] shadow-lg">
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">
        {t("layout_stats")}
      </div>
      <div className="text-sm space-y-1">
        <div className="flex justify-between gap-3">
          <span>{t("tables")}</span>
          <span>{stats.tables}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>{t("relationships")}</span>
          <span>{stats.relationships}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>{t("line_crossings")}</span>
          <span>{stats.crossings}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>{t("max_depth")}</span>
          <span>{stats.maxDepth}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>{t("components")}</span>
          <span>{stats.components}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>{t("isolated_tables")}</span>
          <span>{stats.isolatedTables}</span>
        </div>
      </div>
    </div>
  );
}
