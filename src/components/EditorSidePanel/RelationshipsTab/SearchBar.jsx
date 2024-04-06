import { useState } from "react";
import { useTables } from "../../../hooks";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";

export default function SearchBar({ setRefActiveIndex }) {
  const { relationships } = useTables();
  const [searchText, setSearchText] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    relationships.map((t) => t.name)
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      relationships.map((t) => t.name).filter((i) => i.includes(value))
    );
  };

  return (
    <AutoComplete
      data={filteredResult}
      value={searchText}
      showClear
      prefix={<IconSearch />}
      placeholder="Search..."
      emptyContent={
        <div className="p-3 popover-theme">No relationships found</div>
      }
      onSearch={(v) => handleStringSearch(v)}
      onChange={(v) => setSearchText(v)}
      onSelect={(v) => {
        const { id } = relationships.find((t) => t.name === v);
        setRefActiveIndex(`${id}`);
        document
          .getElementById(`scroll_ref_${id}`)
          .scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
