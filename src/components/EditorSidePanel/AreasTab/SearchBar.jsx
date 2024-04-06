import { useState } from "react";
import { useAreas } from "../../../hooks";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";

export default function SearchBar() {
  const { areas } = useAreas();
  const [searchText, setSearchText] = useState("");

  const [filteredResult, setFilteredResult] = useState(
    areas.map((t) => t.name)
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      areas.map((t) => t.name).filter((i) => i.includes(value))
    );
  };

  return (
    <AutoComplete
      data={filteredResult}
      value={searchText}
      showClear
      prefix={<IconSearch />}
      placeholder="Search..."
      emptyContent={<div className="p-3 popover-theme">No areas found</div>}
      onSearch={(v) => handleStringSearch(v)}
      onChange={(v) => setSearchText(v)}
      onSelect={(v) => {
        const { id } = areas.find((t) => t.name === v);
        document
          .getElementById(`scroll_area_${id}`)
          .scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
