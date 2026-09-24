import { Button, Input, Select } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { ALL } from "../diagram";

export default function DiagramFilters({
  query,
  onQueryChange,
  database,
  onDatabaseChange,
  databaseOptions,
  source,
  onSourceChange,
  showSourceFilter,
  onClear,
}) {
  const { t } = useTranslation();
  const sourceOptions = [
    { value: ALL, label: t("all_types") },
    { value: "cloud", label: t("cloud") },
    { value: "local", label: t("local") },
  ];
  const hasActiveFilters =
    query.trim() !== "" || database !== ALL || source !== ALL;

  return (
    <div className="flex gap-2 flex-wrap mb-3">
      <Input
        prefix={<IconSearch />}
        placeholder={t("search")}
        value={query}
        onChange={onQueryChange}
        showClear
        className="flex-1"
      />
      <Select
        value={database}
        onChange={onDatabaseChange}
        optionList={databaseOptions}
        className="min-w-[150px]"
      />
      {showSourceFilter && (
        <Select
          value={source}
          onChange={onSourceChange}
          optionList={sourceOptions}
          className="min-w-[130px]"
        />
      )}
      {hasActiveFilters && (
        <Button theme="borderless" onClick={onClear}>
          {t("clear")}
        </Button>
      )}
    </div>
  );
}
