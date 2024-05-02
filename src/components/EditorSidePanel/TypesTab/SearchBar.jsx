import { useState } from "react";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { useSelect, useTypes } from "../../../hooks";

export default function Searchbar() {
  const { types } = useTypes();
  const [value, setValue] = useState("");
  const { setSelectedElement } = useSelect();

  const [filteredResult, setFilteredResult] = useState(
    types.map((t) => t.name),
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      types.map((t) => t.name).filter((i) => i.includes(value)),
    );
  };

  return (
    <AutoComplete
      data={filteredResult}
      value={value}
      showClear
      prefix={<IconSearch />}
      placeholder="Search..."
      onSearch={(v) => handleStringSearch(v)}
      emptyContent={<div className="p-3 popover-theme">No types found</div>}
      onChange={(v) => setValue(v)}
      onSelect={(v) => {
        const i = types.findIndex((t) => t.name === v);
        setSelectedElement((prev) => ({
          ...prev,
          id: parseInt(i),
          open: true,
        }));
        document
          .getElementById(`scroll_type_${i}`)
          .scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
