import React, { forwardRef } from "react";
import { dbToTypes } from "../../../../data/datatypes";
import { useDiagram } from "../../../../hooks";
import { Button } from "@douyinfe/semi-ui";
import { IconMinus, IconKeyStroked } from "@douyinfe/semi-icons";

const TableField = forwardRef((props, ref) => {
  const {
    tableData,
    fieldData,
    index,
    setHoveredTable,
    handleGripField,
    setLinkingLine,
    setHoveredField,
    hoveredField,
    tableFieldHeight,
    tableHeaderHeight,
    tableColorStripHeight,
  } = props;
  const { database, deleteField } = useDiagram();

  const FieldSize = React.memo(({ field }) => {
    let hasSize =
      dbToTypes[database][field.type].isSized ||
      dbToTypes[database][field.type].hasPrecision;
    let sizeValid = field.size && field.size !== "";

    if (hasSize && sizeValid) {
      return field.type + `(${field.size})`;
    } else {
      return field.type;
    }
  });

  FieldSize.displayName = "FieldSize";

  return (
    <div
      // Popover children needs forwardRef and props destructuring to work with
      // Functiona Components (https://semi.design/en-US/show/popover#Cautions)
      ref={ref}
      {...props}
      className={`${
        index === tableData.fields.length - 1 ? "" : "border-b border-gray-400"
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
          className="flex-shrink-0 w-[10px] h-[10px] bg-[#2f68adcc] rounded-full"
          onPointerDown={(e) => {
            if (!e.isPrimary) return;

            handleGripField(index);
            setLinkingLine((prev) => ({
              ...prev,
              startFieldId: index,
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

      <div className="text-zinc-400">
        {hoveredField === index ? (
          <Button
            theme="solid"
            size="small"
            style={{
              backgroundColor: "#d42020b3",
            }}
            icon={<IconMinus />}
            onClick={() => {
              deleteField(fieldData, tableData.id);
            }}
          />
        ) : (
          <div className="flex gap-1 items-center">
            {fieldData.primary && <IconKeyStroked />}
            {!fieldData.notNull && <span>?</span>}
            <span>
              <FieldSize field={fieldData} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

TableField.displayName = "TableField";

export default TableField;
