import { useMemo } from "react";
import {
  Tab,
  ObjectType,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
} from "../../data/constants";
import {
  IconEdit,
  IconMore,
  IconMinus,
  IconDeleteStroked,
  IconKeyStroked,
  IconLock,
  IconUnlock,
} from "@douyinfe/semi-icons";
import { Popover, Tag, Button, SideSheet } from "@douyinfe/semi-ui";
import { useLayout, useSettings, useDiagram, useSelect } from "../../hooks";
import TableInfo from "../EditorSidePanel/TablesTab/TableInfo";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../data/datatypes";
import { isRtl } from "../../i18n/utils/rtl";
import { getTableHeight } from "../../utils/utils";
import classNames from "classnames";
import i18n from "../../i18n/i18n";

export default function Table({
  tableData,
  onPointerDown,
  setHoveredTable,
  handleGripField,
  setLinkingLine,
}) {
  const { database } = useDiagram();
  const { layout } = useLayout();
  const { deleteTable, deleteField, updateTable } = useDiagram();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { selectedElement, setSelectedElement, bulkSelectedElements } =
    useSelect();

  const height = getTableHeight(tableData);

  const isSelected = useMemo(() => {
    const isIndividuallySelected =
      selectedElement.id == tableData.id &&
      selectedElement.element === ObjectType.TABLE;
    const isBulkSelected = bulkSelectedElements.some(
      (e) => e.type === ObjectType.TABLE && e.id === tableData.id,
    );

    return isIndividuallySelected || isBulkSelected;
  }, [selectedElement, tableData, bulkSelectedElements]);

  const lockUnlockTable = () =>
    updateTable(tableData.id, { locked: !tableData.locked });

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

  return (
    <>
      <foreignObject
        key={tableData.id}
        x={tableData.x}
        y={tableData.y}
        width={settings.tableWidth}
        height={height}
        data-selected={isSelected}
        onPointerDown={onPointerDown}
        className="group drop-shadow-lg rounded-md cursor-move"
      >
        <div
          onDoubleClick={openEditor}
          className={classNames(
            "select-none rounded-lg border-2 border-zinc-300 hover:border-dashed hover:border-blue-500",
            "dark:border-zinc-600 group-data-[selected=true]:border-solid group-data-[selected=true]:!border-blue-500",
            "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200",
          )}
          style={{ direction: "ltr" }}
        >
          <div
            className="h-2.5 w-full rounded-t-md"
            style={{ backgroundColor: tableData.color }}
          />
          <div className="h-10 flex justify-between items-center border-b border-gray-400 bg-zinc-200 dark:bg-zinc-900">
            <div className="px-2 overflow-hidden text-ellipsis font-bold whitespace-nowrap">
              {tableData.name}
            </div>
            <div className="hidden group-hover:block">
              <div className="flex justify-end items-center mx-2 space-x-1.5">
                <Button
                  aria-label={t("lock")}
                  icon={tableData.locked ? <IconLock /> : <IconUnlock />}
                  size="small"
                  theme="solid"
                  style={{ backgroundColor: "#2f68adb3" }}
                  onClick={lockUnlockTable}
                />
                <Button
                  aria-label={t("Edit")}
                  icon={<IconEdit />}
                  size="small"
                  theme="solid"
                  style={{ backgroundColor: "#2f68adb3" }}
                  onClick={openEditor}
                />
                <Popover
                  key={tableData.id}
                  content={
                    <div className="space-y-2 popover-theme">
                      <div>
                        <strong>{t("comment")}: </strong>
                        {tableData.comment || t("not_set")}
                      </div>
                      <div>
                        <strong
                          className={
                            tableData.indices.length === 0 ? "" : "block"
                          }
                        >
                          {t("indices")}:
                        </strong>{" "}
                        {tableData.indices.length === 0 ? (
                          t("not_set")
                        ) : (
                          <>
                            {tableData.indices.map((index, k) => (
                              <div
                                key={k}
                                className="flex items-center my-1 px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800"
                              >
                                <i className="fa-solid fa-thumbtack me-2 mt-1 text-slate-500" />
                                <div>
                                  {index.fields.map((f) => (
                                    <Tag color="blue" key={f} className="me-1">
                                      {f}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      <Button
                        aria-label={t("delete")}
                        block
                        icon={<IconDeleteStroked />}
                        type="danger"
                        onClick={() => deleteTable(tableData.id)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  }
                  position="rightTop"
                  showArrow
                  trigger="click"
                  style={{ width: "200px", wordBreak: "break-word" }}
                >
                  <Button
                    aria-label={t("see_more")}
                    icon={<IconMore />}
                    type="tertiary"
                    size="small"
                    theme="solid"
                  />
                </Popover>
              </div>
            </div>
          </div>
          {tableData.fields.map((fieldData, index) => {
            const typeInfo = dbToTypes[database][fieldData.type];
            const showSummary = settings.showFieldSummary;

            const typeDisplay =
              (typeInfo?.isSized || typeInfo?.hasPrecision) && fieldData.size
                ? `${fieldData.type}(${fieldData.size})`
                : fieldData.type;

            const SummaryContent = () => (
              <div className="popover-theme">
                <div
                  className="flex justify-between items-center pb-2"
                  style={{ direction: "ltr" }}
                >
                  <p className="me-4 font-bold">{fieldData.name}</p>
                  <p className={`ms-4 font-mono ${typeInfo.color}`}>
                    {typeDisplay}
                  </p>
                </div>
                <hr />
                <div className="space-x-2 my-2">
                  {fieldData.primary && <Tag color="blue">{t("primary")}</Tag>}
                  {fieldData.unique && <Tag color="amber">{t("unique")}</Tag>}
                  {fieldData.notNull && (
                    <Tag color="purple">{t("not_null")}</Tag>
                  )}
                  {fieldData.increment && (
                    <Tag color="green">{t("autoincrement")}</Tag>
                  )}
                </div>
                <div>
                  <strong>{t("default_value")}: </strong>
                  {fieldData.default || t("not_set")}
                </div>
                <div>
                  <strong>{t("comment")}: </strong>
                  {fieldData.comment || t("not_set")}
                </div>
              </div>
            );

            return showSummary ? (
              <Popover
                key={index}
                content={<SummaryContent />}
                position="right"
                showArrow
                style={{ direction: isRtl(i18n.language) ? "rtl" : "ltr" }}
              >
                {field(fieldData, index)}
              </Popover>
            ) : (
              field(fieldData, index)
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

  function field(fieldData, index) {
    return (
      <div
        className="border-b border-gray-400 last:border-b-0 group/field h-9 px-2 flex justify-between items-center gap-1 w-full overflow-hidden"
        onPointerEnter={(e) => {
          if (!e.isPrimary) return;

          setHoveredTable({
            tableId: tableData.id,
            fieldId: fieldData.id,
          });
        }}
        onPointerLeave={(e) => {
          if (!e.isPrimary) return;

          setHoveredTable({
            tableId: null,
            fieldId: null,
          });
        }}
        onPointerDown={(e) => {
          // Required for onPointerLeave to trigger when a touch pointer leaves
          // https://stackoverflow.com/a/70976017/1137077
          e.target.releasePointerCapture(e.pointerId);
        }}
      >
        <div className="group-hover/field:text-zinc-400 flex items-center gap-2 overflow-hidden">
          <button
            className="shrink-0 w-2.5 h-2.5 bg-[#2f68adcc] rounded-full"
            onPointerDown={(e) => {
              if (!e.isPrimary) return;

              handleGripField();
              setLinkingLine((prev) => ({
                ...prev,
                startFieldId: fieldData.id,
                startTableId: tableData.id,
                startX: tableData.x + 15,
                startY:
                  tableData.y +
                  index * tableFieldHeight +
                  tableHeaderHeight +
                  tableColorStripHeight +
                  12,
                endX: tableData.x + 15,
                endY:
                  tableData.y +
                  index * tableFieldHeight +
                  tableHeaderHeight +
                  tableColorStripHeight +
                  12,
              }));
            }}
          />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {fieldData.name}
          </span>
        </div>
        <div className="hidden group-hover/field:inline-block">
          <Button
            theme="solid"
            size="small"
            style={{ backgroundColor: "#d42020b3" }}
            icon={<IconMinus />}
            onClick={() => deleteField(fieldData, tableData.id)}
          />
        </div>

        {settings.showDataTypes && (
          <div className="flex gap-1 items-center group-hover/field:hidden">
            {fieldData.primary && <IconKeyStroked className="text-zinc-400" />}
            {!fieldData.notNull && <span className="font-mono">?</span>}
            <span
              className={`font-mono ${dbToTypes[database][fieldData.type].color}`}
            >
              {fieldData.type +
                ((dbToTypes[database][fieldData.type].isSized ||
                  dbToTypes[database][fieldData.type].hasPrecision) &&
                fieldData.size
                  ? `(${fieldData.size})`
                  : "")}
            </span>
          </div>
        )}
      </div>
    );
  }
}
