import { useMemo, useState } from "react";
import { useSelect } from "../../../hooks";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { ObjectType } from "../../../data/constants";
import {useTranslation} from "react-i18next";

export default function SearchBar({ tables }) {
    const { t } = useTranslation();
  const { setSelectedElement } = useSelect();
  const [searchText, setSearchText] = useState("");
  const filteredTable = useMemo(
    () => tables.map((t) => t.name).filter((i) => i.includes(searchText)),
    [tables, searchText],
  );

  return (
    <AutoComplete
      data={filteredTable}
      value={searchText}
      showClear
      prefix={<IconSearch />}
      placeholder={t("Global.Search")}
      emptyContent={<div className="p-3 popover-theme">No tables found</div>}
      onChange={(v) => setSearchText(v)}
      onSelect={(v) => {
        const { id } = tables.find((t) => t.name === v);
        setSelectedElement((prev) => ({
          ...prev,
          id: id,
          open: true,
          element: ObjectType.TABLE,
        }));
        document
          .getElementById(`scroll_table_${id}`)
          .scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
