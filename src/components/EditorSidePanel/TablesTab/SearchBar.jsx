import { useState } from "react";
import { useSelect, useTables } from "../../../hooks";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";

export default function SearchBar() {
  const { tables } = useTables();
  const { setSelectedElement } = useSelect();
  const [searchText, setSearchText] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    tables.map((t) => t.name)
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      tables.map((t) => t.name).filter((i) => i.includes(value))
    );
  };

  return (
    <AutoComplete
      data={filteredResult}
      value={searchText}
      showClear
      prefix={<IconSearch />}
      placeholder="Search..."
      onSearch={(v) => handleStringSearch(v)}
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
