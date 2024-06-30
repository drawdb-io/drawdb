import { useState } from "react";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { useEnums } from "../../../hooks";
import { useTranslation } from "react-i18next";

export default function SearchBar() {
  const { enums } = useEnums();
  const [value, setValue] = useState("");
  const { t } = useTranslation();

  const [filteredResult, setFilteredResult] = useState(
    enums.map((e) => e.name),
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      enums.map((e) => e.name).filter((i) => i.includes(value)),
    );
  };

  return (
    <AutoComplete
      data={filteredResult}
      value={value}
      showClear
      prefix={<IconSearch />}
      placeholder={t("search")}
      onSearch={(v) => handleStringSearch(v)}
      emptyContent={<div className="p-3 popover-theme">{t("not_found")}</div>}
      onChange={(v) => setValue(v)}
      onSelect={(v) => {
        const i = enums.findIndex((t) => t.name === v);
        document
          .getElementById(`scroll_enum_${i}`)
          .scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
