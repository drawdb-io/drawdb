import { useMemo, useState } from "react";
import { Banner, Spin } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useDiagramList } from "./hooks/useDiagramList";
import {
  ALL,
  databaseOptions,
  filterDiagrams,
  mergeDiagrams,
  nextSort,
  sortDiagrams,
} from "./diagram";
import DiagramFilters from "./components/DiagramFilters";
import DiagramTable from "./components/DiagramTable";

const DEFAULT_SORT = { key: "lastModified", dir: "desc" };

function InfoBanner({ type, children }) {
  return (
    <Banner
      fullMode={false}
      type={type}
      bordered
      icon={null}
      closeIcon={null}
      description={<div>{children}</div>}
    />
  );
}

export default function Open({ selectedDiagramId, setSelectedDiagramId }) {
  const { t } = useTranslation();
  const { loading, error, cloud, local, cloudEnabled, currentUserId } =
    useDiagramList();

  const [query, setQuery] = useState("");
  const [database, setDatabase] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [sort, setSort] = useState(DEFAULT_SORT);

  const clearFilters = () => {
    setQuery("");
    setDatabase(ALL);
    setSource(ALL);
  };

  const diagrams = useMemo(() => mergeDiagrams(cloud, local), [cloud, local]);
  const dbOptions = useMemo(() => databaseOptions(diagrams), [diagrams]);
  const visible = useMemo(
    () =>
      sortDiagrams(filterDiagrams(diagrams, { query, database, source }), sort),
    [diagrams, query, database, source, sort],
  );

  const showOwner =
    cloudEnabled &&
    visible.some(
      (entry) =>
        entry.owner && String(entry.owner.id) !== String(currentUserId),
    );

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );
  }

  if (error) return <InfoBanner type="danger">{error}</InfoBanner>;

  if (diagrams.length === 0) {
    return <InfoBanner type="info">{t("no_saved_diagrams")}</InfoBanner>;
  }

  return (
    <div className="flex flex-col">
      <DiagramFilters
        query={query}
        onQueryChange={setQuery}
        database={database}
        onDatabaseChange={setDatabase}
        databaseOptions={dbOptions}
        source={source}
        onSourceChange={setSource}
        showSourceFilter={cloudEnabled}
        onClear={clearFilters}
      />
      <div className="max-h-[360px] overflow-auto">
        {visible.length > 0 ? (
          <DiagramTable
            entries={visible}
            sort={sort}
            onSort={(key) => setSort((current) => nextSort(current, key))}
            selectedDiagramId={selectedDiagramId}
            onSelect={setSelectedDiagramId}
            showType={cloudEnabled}
            showOwner={showOwner}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 px-1 py-6 text-center">
            No diagrams match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
