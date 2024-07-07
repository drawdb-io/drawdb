import { useMemo } from "react";
import { useSelect } from "../../../hooks";
import { TreeSelect } from "@douyinfe/semi-ui";
import { IconSearch } from "@douyinfe/semi-icons";
import { ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function SearchBar({ tables }) {
  const { setSelectedElement } = useSelect();
  const { t } = useTranslation();

  const treeData = useMemo(() => {
    return tables.map(({ id, name: parentName, fields }, i) => {
      const children = fields.map(({ name }, j) => ({
        tableId: id,
        id: `${j}`,
        label: name,
        value: name,
        key: `${i}-${j}`,
      }));

      return {
        tableId: id,
        id: `${i}`,
        label: parentName,
        value: parentName,
        key: `${i}`,
        children,
      };
    });
  }, [tables]);

  return (
    <TreeSelect
      searchPosition="trigger"
      dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
      treeData={treeData}
      prefix={<IconSearch />}
      emptyContent={<div className="p-3 popover-theme">{t("not_found")}</div>}
      filterTreeNode
      placeholder={t("search")}
      onChange={(node) => {
        const { tableId, id, children } = node;

        setSelectedElement((prev) => ({
          ...prev,
          id: tableId,
          open: true,
          element: ObjectType.TABLE,
        }));
        document
          .getElementById(`scroll_table_${tableId}`)
          .scrollIntoView({ behavior: "smooth" });

        if (!children) {
          document
            .getElementById(`scroll_table_${tableId}_input_${id}`)
            .focus();
        }
      }}
      onChangeWithObject
      className="w-full"
    />
  );
}
