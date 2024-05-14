import { useState } from "react";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { useNotes } from "../../../hooks";
import {useTranslation} from "react-i18next";

export default function SearchBar({ setActiveKey }) {
  const { t } = useTranslation();
  const { notes } = useNotes();
  const [searchText, setSearchText] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    notes.map((t) => t.title)
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      notes.map((t) => t.title).filter((i) => i.includes(value))
    );
  };

  return (
    <AutoComplete
      data={filteredResult}
      value={searchText}
      showClear
      prefix={<IconSearch />}
      placeholder={t("Global.Search")}
      emptyContent={<div className="p-3 popover-theme">No notes found</div>}
      onSearch={(v) => handleStringSearch(v)}
      onChange={(v) => setSearchText(v)}
      onSelect={(v) => {
        const { id } = notes.find((t) => t.title === v);
        setActiveKey(`${id}`);
        document
          .getElementById(`scroll_note_${id}`)
          .scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
