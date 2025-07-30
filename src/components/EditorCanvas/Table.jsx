import { useEffect, useMemo, useState } from "react";
import {
  Tab,
  ObjectType,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
  Notation,
} from "../../data/constants";
import {
  IconEdit,
  IconMore,
  IconMinus,
  IconDeleteStroked,
} from "@douyinfe/semi-icons";
import { Popover, Tag, Button, SideSheet } from "@douyinfe/semi-ui";
import { useLayout, useSettings, useDiagram, useSelect } from "../../hooks";
import TableInfo from "../EditorSidePanel/TablesTab/TableInfo";
import { useTranslation} from "react-i18next";
import { dbToTypes } from "../../data/datatypes";
import { isRtl } from "../../i18n/utils/rtl";
import i18n from "../../i18n/i18n";

//Helper function to calculate text width
const getTextWidth = (text, font) => {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
};

export default function Table(props) {
  const [hoveredField, setHoveredField] = useState(-1);
  const { database, updateTable } = useDiagram();
  const {
    tableData,
    onPointerDown,
    setHoveredTable,
    handleGripField,
    setLinkingLine,
    moving,
  } = props;
  const { layout } = useLayout();
  const { deleteTable, deleteField } = useDiagram();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { selectedElement, setSelectedElement } = useSelect();

  useEffect(() => {
    // Check if we need to update the table name
    const desiredTableCase = settings.upperCaseFields ? tableData.name.toUpperCase() : tableData.name.toLowerCase();
    const tableNameNeedsUpdate = tableData.name !== desiredTableCase;

    // Check if any field names need to be updated
    const fieldsNeedUpdate = tableData.fields.some(field => {
      const desiredFieldCase = settings.upperCaseFields ? field.name.toUpperCase() : field.name.toLowerCase();
      return field.name !== desiredFieldCase;
    });

    // Only update if there are actual changes needed
    if (tableNameNeedsUpdate || fieldsNeedUpdate) {
      // Create updated fields with correct case
      const updatedFields = tableData.fields.map(field => ({
        ...field,
        name: settings.upperCaseFields ? field.name.toUpperCase() : field.name.toLowerCase()
      }));

      // Update both table name and fields
      updateTable(tableData.id, {
        name: settings.upperCaseFields ? tableData.name.toUpperCase() : tableData.name.toLowerCase(),
        fields: updatedFields
      });
    }
  }, [
    settings.upperCaseFields,
    tableData.fields,
    tableData.id,
    tableData.name,
    updateTable
  ]);
  const calculatedContentWidth = useMemo(() => {
    if(!tableData) return settings.tableWidth;

    let maxCalculatedWidth = 0;
    const baseFontSize = 14;
    const headerFontSize = baseFontSize + 2; // Slightly larger for header

    // Calculate the width of the table name header
    const headerFont = `700 ${headerFontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif`;
    const tableNameWidth = getTextWidth(tableData.name || " ", headerFont);
    const headerHorizontalPadding = 24;
    const headerIconsWidth = 70;
    maxCalculatedWidth = Math.max(
      maxCalculatedWidth,
      tableNameWidth + headerHorizontalPadding + headerIconsWidth
    );

    // Calculate the width of each field
    const fieldFont = `${baseFontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif`;

    const fieldRowHorizontalPadding = 16;
    const gripButtonWidth = 18;
    const spaceBetweenNameAndType = 10;
    const spaceForHoverDeleteIcon = 30;

    tableData.fields.forEach((field) => {
      let currentFieldContentWidth = 0;
      currentFieldContentWidth += getTextWidth(field.name || " ", fieldFont);

      let typeString = field.type || "";
      const fieldTypeInfo = dbToTypes[database]?.[field.type];
      if ((fieldTypeInfo?.isSized || fieldTypeInfo?.hasPrecision) && field.size && String(field.size).trim() !== "") {
        typeString += `(${field.size})`;
      }
      currentFieldContentWidth += getTextWidth(typeString, fieldFont);

      let indicatorsWidth = spaceBetweenNameAndType; // Initial space before indicators
      if (settings.notation === 'default') {
        if (field.primary) indicatorsWidth += 16 + 4; // IconKeyStroked approx 16px + margin
        if (!field.notNull) indicatorsWidth += getTextWidth("?", fieldFont) + 4; // '?' char + margin
      } else {
        indicatorsWidth += getTextWidth(field.notNull ? "NOT NULL" : "NULL", fieldFont) + 4; // text + margin
      }
      currentFieldContentWidth += indicatorsWidth;

      const totalFieldRowWidth = fieldRowHorizontalPadding + gripButtonWidth + currentFieldContentWidth + spaceForHoverDeleteIcon;
      maxCalculatedWidth = Math.max(maxCalculatedWidth, totalFieldRowWidth);
    });

    const minTableWidth = 180;
    const safetyBuffer = 25; // Extra buffer for aesthetics and measurement inaccuracies
    return Math.max(minTableWidth, Math.ceil(maxCalculatedWidth + safetyBuffer));

  }, [tableData, settings.notation, database, settings.tableWidth]);

  useEffect(() => {
    const currentWidth = tableData.width || settings.tableWidth;
    // Expand if calculated width is greater than current width.
    // This ensures the table grows to fit its content.
    // It respects manual widening, as it won't shrink if currentWidth is already larger.
    if (calculatedContentWidth > currentWidth) {
      // Only update if the difference is somewhat significant to prevent rapid, tiny adjustments
      if (Math.abs(currentWidth - calculatedContentWidth) > 2) {
        updateTable(tableData.id, { width: calculatedContentWidth });
      }
    }
  }, [tableData.id, tableData.width, calculatedContentWidth, updateTable, settings.tableWidth]);

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

  const primaryKeyCount = tableData.fields.filter(field => field.primary).length;

  const sortedFields = [...tableData.fields].sort((a, b) => {
    const aIsPK = a.primary;
    const bIsPK = b.primary;
    const aIsFK = a.foreignK === true;
    const bIsFK = b.foreignK === true;

    let groupA;
    if (aIsPK) {
      groupA = 1;
    } else if (!aIsFK) {
      groupA = 2;
    } else {
      groupA = 3;
    }

    let groupB;
    if (bIsPK) {
      groupB = 1;
    } else if (!bIsFK) {
      groupB = 2;
    } else {
      groupB = 3;
    }

    if (groupA !== groupB) {
      return groupA - groupB;
    }
    return 0;
  });

  return (
    <>
      <foreignObject
        key={tableData.id}
        x={tableData.x}
        y={tableData.y}
        // width={settings.tableWidth}
        width={tableData.width || settings.tableWidth}
        height={height}
        className="group drop-shadow-lg  cursor-move"
        onPointerDown={onPointerDown}
      >
        <div
          onDoubleClick={openEditor}
          className={`select-none w-full ${
            (selectedElement.element === ObjectType.TABLE && selectedElement.id === tableData.id)
              ? `border-2 border-solid border-blue-500 ${settings.notation === Notation.DEFAULT ? "rounded-lg" : ""}`
              : (moving ||
                  (selectedElement.element === ObjectType.TABLE &&
                    (Array.isArray(selectedElement.id)
                      ? selectedElement.id.includes(tableData.id)
                      : selectedElement.id === tableData.id)))
                ? `border-2 border-dashed border-blue-500 ${settings.notation === Notation.DEFAULT ? "rounded-lg" : ""}`
                : settings.notation !== Notation.DEFAULT
                  ? "border-none"
                  : "border-2 border-zinc-500 rounded-lg hover:border-dashed hover:border-blue-500"
            }`}
          style={{ direction: "ltr" }}
        >
          <div
            className={`h-[10px] w-full ${
               settings.notation !== Notation.DEFAULT
                 ? ""
                 : "rounded-t-md"
            }`}
            style={{ backgroundColor: tableData.color, height: settings.notation !== Notation.DEFAULT ? 0 : "10px" }}
          />
          <div
            className={`overflow-hidden font-bold h-[40px] flex justify-between items-center border-b border-gray-400 ${
              settings.notation !== Notation.DEFAULT
              ? "bg-transparent"
              : settings.mode === "light"
              ? "bg-zinc-200"
              : "bg-zinc-900"
            }`}
          >
            <div className={` px-3 overflow-hidden text-ellipsis whitespace-nowrap ${
               settings.notation !== Notation.DEFAULT
                 ? ""
                 : ""
            }`}
            >
              {tableData.name}
            </div>
            <div className="hidden group-hover:block">
              <div className="flex justify-end items-center mx-2">
                <Button
                  icon={<IconEdit />}
                  size="small"
                  theme="solid"
                  style={{
                    backgroundColor: "#2f68adb3",
                    marginRight: "6px",
                  }}
                  onClick={openEditor}
                />
                <Popover
                  key={tableData.key}
                  content={
                    <div className="popover-theme">
                      <div className="mb-2">
                        <strong>{t("comment")}:</strong>{" "}
                        {tableData.comment === "" ? (
                          t("not_set")
                        ) : (
                          <div>{tableData.comment}</div>
                        )}
                      </div>
                      <div>
                        <strong
                          className={`${
                            tableData.indices.length === 0 ? "" : "block"
                          }`}
                        >
                          {t("indices")}:
                        </strong>{" "}
                        {tableData.indices.length === 0 ? (
                          t("not_set")
                        ) : (
                          <div>
                            {tableData.indices.map((index, k) => (
                              <div
                                key={k}
                                className={`flex items-center my-1 px-2 py-1 rounded ${
                                  settings.mode === "light"
                                    ? "bg-gray-100"
                                    : "bg-zinc-800"
                                }`}
                              >
                                <i className="fa-solid fa-thumbtack me-2 mt-1 text-slate-500"></i>
                                <div>
                                  {index.fields.map((f) => (
                                    <Tag color="blue" key={f} className="me-1">
                                      {f}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        icon={<IconDeleteStroked />}
                        type="danger"
                        block
                        style={{ marginTop: "8px" }}
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
                    icon={<IconMore />}
                    type="tertiary"
                    size="small"
                    style={{
                      backgroundColor: "#808080b3",
                      color: "white",
                    }}
                  />
                </Popover>
              </div>
            </div>
          </div>
          {sortedFields.map((e, i) => {
            return settings.showFieldSummary ? (
              <Popover
                key={i}
                content={
                  <div className="popover-theme">
                    <div
                      className="flex justify-between items-center pb-2"
                      style={{ direction: "ltr" }}
                    >
                      <p className="me-4 font-bold">{e.name}</p>
                      <p className="ms-4">
                        {e.type +
                          ((dbToTypes[database][e.type].isSized ||
                            dbToTypes[database][e.type].hasPrecision) &&
                          e.size &&
                          e.size !== ""
                            ? "(" + e.size + ")"
                            : "")}
                      </p>
                    </div>
                    <hr />
                    {e.primary && (
                      <Tag color="blue" className="me-2 my-2">
                        {t("primary")}
                      </Tag>
                    )}
                    {e.unique && (
                      <Tag color="amber" className="me-2 my-2">
                        {t("unique")}
                      </Tag>
                    )}
                    {e.notNull && (
                      <Tag color="purple" className="me-2 my-2">
                        {t("not_null")}
                      </Tag>
                    )}
                    {e.increment && (
                      <Tag color="green" className="me-2 my-2">
                        {t("autoincrement")}
                      </Tag>
                    )}
                    <p>
                      <strong>{t("default_value")}: </strong>
                      {e.default === "" ? t("not_set") : e.default}
                    </p>
                    <p>
                      <strong>{t("comment")}: </strong>
                      {e.comment === "" ? t("not_set") : e.comment}
                    </p>
                  </div>
                }
                position="right"
                showArrow
                style={
                  isRtl(i18n.language)
                    ? { direction: "rtl" }
                    : { direction: "ltr" }
                }
              >
                {field(e, i)}
              </Popover>
            ) : (
              field(e, i)
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
        className={`
          ${(tableData.fields.length === 1 && settings.notation === Notation.DEFAULT)
            ? "rounded-b-md"
            : ""
          } ${(settings.notation !== Notation.DEFAULT && index === tableData.fields.length - 1)
              ? (
                  primaryKeyCount === tableData.fields.length
                    ? "border-l border-r border-b border-gray-400"
                    : "border-b border-gray-400"
                )
              : ""
          } ${
          (fieldData.primary && settings.notation !== Notation.DEFAULT && primaryKeyCount === 1)
            ? "border-b border-gray-400"
            : ""
          } ${
            (fieldData.primary && settings.notation !== Notation.DEFAULT && index ===primaryKeyCount - 1)
              ? "border-b border-gray-400"
              : ""
          } ${
          (!fieldData.primary && settings.notation !== Notation.DEFAULT )
            ? "border-l border-r"
            : ""
          } ${
          settings.mode === "light"
            ? "bg-zinc-100 text-zinc-800"
            : "bg-zinc-800 text-zinc-200"
          } ${
          (settings.notation !== Notation.DEFAULT && index !== tableData.fields.length - 1)
            ? "border-l border-r border-gray-400"
            : ""
          } ${
          (settings.notation !== Notation.DEFAULT && index === tableData.fields.length - 1)
            ? "border-b border-gray-400"
            : ""
          } ${
            (fieldData.primary && settings.notation === Notation.DEFAULT)
              ? "border-b border-gray-400"
              : ""
          } ${
            (settings.notation === Notation.DEFAULT && index !== tableData.fields.length - 1 && fieldData.primary === false)
              ? "border-b border-gray-400"
              : ""
          } ${
          (settings.notation === Notation.DEFAULT && index === tableData.fields.length - 1)
            ? "rounded-b-md"
            : ""
        } group h-[36px] px-2 py-1 flex justify-between items-center gap-1 w-full overflow-hidden`}
        onPointerEnter={(e) => {
          if (!e.isPrimary) return;

          setHoveredField(index);
          setHoveredTable({
            tableId: tableData.id,
            field: index,
          });
        }}
        onPointerLeave={(e) => {
          if (!e.isPrimary) return;

          setHoveredField(-1);
        }}
        onPointerDown={(e) => {
          // Required for onPointerLeave to trigger when a touch pointer leaves
          // https://stackoverflow.com/a/70976017/1137077
          e.target.releasePointerCapture(e.pointerId);
        }}
      >
        <div
          className={`${
            hoveredField === index ? "text-zinc-400" : ""
          } flex items-center gap-2 overflow-hidden`}
        >
          <button
            className={`flex-shrink-0 w-[10px] h-[10px] bg-[#2f68adcc] rounded-full ${
              (fieldData.primary && settings.notation !== Notation.DEFAULT)
                ? "bg-[#ff2222cc]"
                : "bg-[#2f68adcc]"
            }`}
            onPointerDown={(e) => {
              if (!e.isPrimary) return;

              handleGripField(fieldData,tableData.id);

              const effectiveColorStripHeight = settings.notation === Notation.DEFAULT ? tableColorStripHeight : 0;
              const gripYOffset = tableHeaderHeight + effectiveColorStripHeight + (index * tableFieldHeight) + (tableFieldHeight / 2);
              const gripXOffset = settings.tableWidth / 2; // Or a fixed small offset from table edge

              setLinkingLine((prev) => ({
                ...prev,
                // startTableId and startFieldId will be set by handleGripField in Canvas.jsx
                // This setLinkingLine is primarily for the visual startX/startY of the temporary line.
                startX: tableData.x + gripXOffset,
                startY: tableData.y + gripYOffset,
                endX: tableData.x + gripXOffset,   // Initialize end to start
                endY: tableData.y + gripYOffset,
              }));
            }}
          />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {fieldData.name}
          </span>
        </div>
        <div className="text-zinc-400">
          {hoveredField === index ? (
            <Button
              theme="solid"
              size="small"
              style={{
                backgroundColor: "#d42020b3",
              }}
              icon={<IconMinus />}
              onClick={() => deleteField(fieldData, tableData.id)}
            />
          ) : (
            <div className="flex gap-1 items-center">
              {fieldData.primary &&
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="#ff2222cc"
                  className="bi bi-key"
                  viewBox="0 0 16 16"
                >
                  <path d="M0 8a4 4 0 0 1 7.465-2H14a.5.5 0 0 1 .354.146l1.5 1.5a.5.5 0 0 1 0
                    .708l-1.5 1.5a.5.5 0 0 1-.708 0L13 9.207l-.646.647a.5.5 0 0 1-.708 0L11
                    9.207l-.646.647a.5.5 0 0 1-.708 0L9 9.207l-.646.647A.5.5 0 0 1 8 10h-.535A4
                    4 0 0 1 0 8m4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.163 9h.63l.853-.854a.5.5
                    0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1
                    .708 0l.646.647.793-.793-1-1h-6.63a.5.5 0 0 1-.451-.285A3 3 0 0 0 4 5"/>
                  <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>}
              {fieldData.foreignK &&
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="#2f68adcc"
                  className="bi bi-key"
                  viewBox="0 0 16 16"
                >
                  <path d="M0 8a4 4 0 0 1 7.465-2H14a.5.5 0 0 1 .354.146l1.5 1.5a.5.5 0 0 1 0
                    .708l-1.5 1.5a.5.5 0 0 1-.708 0L13 9.207l-.646.647a.5.5 0 0 1-.708 0L11
                    9.207l-.646.647a.5.5 0 0 1-.708 0L9 9.207l-.646.647A.5.5 0 0 1 8 10h-.535A4
                    4 0 0 1 0 8m4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.163 9h.63l.853-.854a.5.5
                    0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1
                    .708 0l.646.647.793-.793-1-1h-6.63a.5.5 0 0 1-.451-.285A3 3 0 0 0 4 5"/>
                  <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>}
              {settings.notation !== Notation.DEFAULT ? (
                <>
                <span>
                  {fieldData.type +
                    ((dbToTypes[database][fieldData.type].isSized ||
                      dbToTypes[database][fieldData.type].hasPrecision) &&
                    fieldData.size &&
                    fieldData.size !== ""
                      ? "(" + fieldData.size + ")"
                      : "")}
                </span>
                {!fieldData.notNull && <span>NULL</span>}
                {fieldData.notNull && <span>NOT NULL</span>}
                </>
              ) : (
                <>
                  {!fieldData.notNull && <span>?</span>}
                  <span>
                  {fieldData.type +
                    ((dbToTypes[database][fieldData.type].isSized ||
                      dbToTypes[database][fieldData.type].hasPrecision) &&
                    fieldData.size &&
                    fieldData.size !== ""
                      ? "(" + fieldData.size + ")"
                      : "")}
                </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
