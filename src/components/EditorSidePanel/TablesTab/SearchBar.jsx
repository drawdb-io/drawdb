import { useEffect, useMemo, useState } from "react";
import { useSelect, useSettings, useTransform } from "../../../hooks";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";
import { getTableCenter } from "../../../utils/viewport";
import { buildTableSearchIndex } from "../../../utils/searchIndex";

export default function SearchBar({ tables }) {
  const { setSelectedElement } = useSelect();
  const { setTransform } = useTransform();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [pendingFocus, setPendingFocus] = useState(null);

  const searchIndex = useMemo(() => {
    return buildTableSearchIndex(tables);
  }, [tables]);
  const results = useMemo(() => {
    const query = searchText.toLocaleLowerCase();
    return searchIndex
      .filter((entry) => entry.normalizedLabel.includes(query))
      .slice(0, 100)
      .map((entry) => ({ label: entry.label, value: entry.key }));
  }, [searchIndex, searchText]);

  useEffect(() => {
    if (!pendingFocus) return;
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(
          `scroll_table_${pendingFocus.tableId}_input_${pendingFocus.fieldIndex}`,
        )
        ?.focus();
      setPendingFocus(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingFocus]);

  return (
    <AutoComplete
      data={results}
      value={searchText}
      showClear
      prefix={<IconSearch />}
      emptyContent={<div className="p-3 popover-theme">{t("not_found")}</div>}
      placeholder={t("search")}
      onSearch={setSearchText}
      onChange={setSearchText}
      onSelect={(key) => {
        const result = searchIndex.find((entry) => entry.key === key);
        if (!result) return;
        const { tableId, fieldIndex } = result;
        const table = tables.find((item) => item.id === tableId);

        if (table) {
          setTransform((prev) => ({
            ...prev,
            pan: getTableCenter(table, settings.tableWidth),
          }));
        }

        setSelectedElement((prev) => ({
          ...prev,
          id: tableId,
          open: true,
          element: ObjectType.TABLE,
        }));
        if (fieldIndex !== null) setPendingFocus({ tableId, fieldIndex });
        setSearchText("");
      }}
      className="w-full"
    />
  );
}
