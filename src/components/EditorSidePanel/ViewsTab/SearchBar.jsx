import { useState } from "react";
import { AutoComplete } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { useViews } from "../../../hooks";
import { useTranslation } from "react-i18next";

export default function SearchBar() {
  const { views } = useViews();
  const [value, setValue] = useState("");
  const { t } = useTranslation();

  const [filteredResult, setFilteredResult] = useState(
    views.map((v) => v.name),
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      views.map((v) => v.name).filter((i) => i.includes(value)),
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
        const view = views.find((e) => e.name === v);
        document
          .getElementById(`scroll_view_${view.id}`)
          ?.scrollIntoView({ behavior: "smooth" });
      }}
      className="w-full"
    />
  );
}
