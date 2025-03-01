import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import { useLayout, useSettings, useSelect } from "../../../hooks";

import {
  Tab,
  ObjectType,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
} from "../../../data/constants";

import TableFieldPopover from "./components/TableFieldPopover";
import TableField from "./components/TableField";
import TableHeader from "./components/TableHeader";

import TableInfo from "../../EditorSidePanel/TablesTab/TableInfo";

export default function Table(props) {
  const [hoveredField, setHoveredField] = useState(-1);
  const {
    tableData,
    onPointerDown,
    setHoveredTable,
    handleGripField,
    setLinkingLine,
  } = props;
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { selectedElement, setSelectedElement } = useSelect();

  const height =
    tableData.fields.length * tableFieldHeight + tableHeaderHeight + 7;

  const openEditor = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.TABLE,
        id: tableData.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.TABLES,
        element: ObjectType.TABLE,
        id: tableData.id,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.TABLES) return;
      document
        .getElementById(`scroll_table_${tableData.id}`)
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  const TableHeaderBand = React.memo(({ color }) => {
    return (
      <div
        className="h-[10px] w-full rounded-t-md"
        style={{ backgroundColor: color }}
      />
    );
  });

  TableHeaderBand.displayName = "TableHeaderBand";

  return (
    <>
      <foreignObject
        key={tableData.id}
        x={tableData.x}
        y={tableData.y}
        width={settings.tableWidth}
        height={height}
        className="group drop-shadow-lg rounded-md cursor-move"
        onPointerDown={onPointerDown}
      >
        <div
          onDoubleClick={openEditor}
          className={`border-2 hover:border-dashed hover:border-blue-500
               select-none rounded-lg w-full ${
                 settings.mode === "light"
                   ? "bg-zinc-100 text-zinc-800"
                   : "bg-zinc-800 text-zinc-200"
               } ${
                 selectedElement.id === tableData.id &&
                 selectedElement.element === ObjectType.TABLE
                   ? "border-solid border-blue-500"
                   : "border-zinc-500"
               }`}
          style={{ direction: "ltr" }}
        >
          <TableHeaderBand color={tableData.color} />

          <TableHeader
            tableData={tableData}
            settings={settings}
            openEditor={openEditor}
            t={t}
          />

          {tableData.fields.map((fieldData, index) => {
            return (
              <TableFieldPopover
                key={index}
                visible={settings.showFieldSummary}
                fieldData={fieldData}
              >
                <TableField
                  key={index}
                  tableData={tableData}
                  fieldData={fieldData}
                  index={index}
                  setHoveredTable={setHoveredTable}
                  handleGripField={handleGripField}
                  setLinkingLine={setLinkingLine}
                  setHoveredField={setHoveredField}
                  hoveredField={hoveredField}
                  tableFieldHeight={tableFieldHeight}
                  tableHeaderHeight={tableHeaderHeight}
                  tableColorStripHeight={tableColorStripHeight}
                />
              </TableFieldPopover>
            );
          })}
        </div>
      </foreignObject>

      <SideSheet
        title={t("edit")}
        size="small"
        visible={
          selectedElement.element === ObjectType.TABLE &&
          selectedElement.id === tableData.id &&
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() =>
          setSelectedElement((prev) => ({
            ...prev,
            open: !prev.open,
          }))
        }
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <TableInfo data={tableData} />
        </div>
      </SideSheet>
    </>
  );
}
