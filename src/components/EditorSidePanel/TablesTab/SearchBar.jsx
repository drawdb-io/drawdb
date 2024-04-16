import { useEffect, useMemo, useState } from "react";
import { useSelect } from "../../../hooks";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";

export default function SearchBar({ tables }) {
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
      placeholder="Search..."
      emptyContent={<div className="p-3 popover-theme">No tables found</div>}
      onChange={(v) => setSearchText(v)}
      onSelect={(v) => {
        const { id } = tables.find((t) => t.name === v);
        setSelectedElement((prev) => ({
          ...prev,
          id: id,
          open: true,
        }));
        document
          .getElementById(`scroll_table_${id}`)
          .scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
