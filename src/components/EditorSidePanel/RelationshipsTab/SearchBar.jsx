import { useMemo, useState } from "react";
import {
  useSelect,
  useDiagram,
  useSettings,
  useTransform,
} from "../../../hooks";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";
import { getTableCenter } from "../../../utils/viewport";
import { buildRelationshipSearchIndex } from "../../../utils/searchIndex";

export default function SearchBar() {
  const { relationships, tables } = useDiagram();
  const [searchText, setSearchText] = useState("");
  const { setSelectedElement } = useSelect();
  const { setTransform } = useTransform();
  const { settings } = useSettings();
  const { t } = useTranslation();

  const searchEntries = useMemo(
    () => buildRelationshipSearchIndex(relationships),
    [relationships],
  );
  const tableById = useMemo(
    () => new Map(tables.map((table) => [table.id, table])),
    [tables],
  );
  const filteredResult = useMemo(() => {
    const query = searchText.toLocaleLowerCase();
    return searchEntries
      .filter((entry) => entry.normalizedLabel.includes(query))
      .slice(0, 100)
      .map((entry) => entry.label);
  }, [searchEntries, searchText]);

  return (
    <AutoComplete
      data={filteredResult}
      value={searchText}
      showClear
      prefix={<IconSearch />}
      placeholder={t("search")}
      emptyContent={<div className="p-3 popover-theme">{t("not_found")}</div>}
      onSearch={setSearchText}
      onChange={(v) => setSearchText(v)}
      onSelect={(v) => {
        const result = searchEntries.find((entry) => entry.label === v);
        if (!result) return;
        const { id } = result;
        const startTable = tableById.get(result.startTableId);
        if (startTable) {
          setTransform((prev) => ({
            ...prev,
            pan: getTableCenter(startTable, settings.tableWidth),
          }));
        }
        setSelectedElement((prev) => ({
          ...prev,
          id: id,
          open: true,
          element: ObjectType.RELATIONSHIP,
        }));
        document
          .getElementById(`scroll_ref_${id}`)
          ?.scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
