import { useMemo, useState } from "react";
import { Action, ObjectType } from "../../../data/constants";
import { Input, Button, Popover, Select, Tooltip } from "@douyinfe/semi-ui";
import { IconMore, IconKeyStroked } from "@douyinfe/semi-icons";
import { useEnums, useDiagram, useTypes, useUndoRedo } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";
import { DragHandle } from "../../SortableList/DragHandle";
import FieldDetails from "./FieldDetails";
import { getIssues } from "../../../utils/issues";

export default function TableField({ data, tid, index, inherited }) {
  const { updateField } = useDiagram();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { tables, database } = useDiagram();
  const { t } = useTranslation();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const table = useMemo(() => tables.find((t) => t.id === tid), [tables, tid]);

  const allIssues = useMemo(() => getIssues({ tables, types, enums, relationships: [], database }), [tables, types, enums, database]);

  const fieldIssues = useMemo(() => {
    if (!table || !data) return [];
    return allIssues.filter((issue) =>
      typeof issue === "string" &&
      issue.includes(table.name) &&
      (data.name === "" || issue.includes(data.name))
    );
  }, [allIssues, table, data]);

  const reportOverride = (fieldKey, newVal) => {
    if (inherited && data[fieldKey] !== newVal) {
      fieldIssues.push(
        t("inherited_field_override", {
          tableName: table.name,
          fieldName: data.name || "(unnamed)",
        })
      );
    }
  };

  const recordUndo = (key, oldVal, newVal) => {
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.TABLE,
        component: "field",
        tid,
        fid: data.id,
        undo: { [key]: oldVal },
        redo: { [key]: newVal },
        message: t("edit_table", {
          tableName: table.name,
          extra: "[field]",
        }),
      },
    ]);
    setRedoStack([]);
  };

  return (
    <div className="hover-1 my-2 flex gap-2 items-center">
      <DragHandle id={data.id} />

      {/* Field name input */}
      <div className="min-w-20 flex-1/3" style={{ opacity: inherited ? 0.6 : 1 }}>
        <Tooltip content={fieldIssues.find((i) => i.includes("field name")) || (inherited ? t("inherited_field_cannot_be_modified") : "") }>
          <Input
            value={data.name}
            id={`scroll_table_${tid}_input_${index}`}
            validateStatus={data.name.trim() === "" || inherited ? "error" : "default"}
            placeholder={t("name")}
            style={inherited ? { backgroundColor: "#f5f5f5" } : {}}
            onChange={(value) => updateField(tid, data.id, { name: value })}
            onFocus={(e) => setEditField({ name: e.target.value })}
            onBlur={(e) => {
              const newName = e.target.value;
              if (newName === editField.name) return;
              reportOverride("name", newName);
              recordUndo("name", editField.name, newName);
              updateField(tid, data.id, { name: newName });
            }}
          />
        </Tooltip>
      </div>

      {/* Field type select */}
      <div className="min-w-24 flex-1/3">
        <Tooltip content={fieldIssues.find((i) => i.includes("field type")) || ""}>
          <Select
            className="w-full"
            optionList={[
              ...Object.keys(dbToTypes[database]).map((value) => ({ label: value, value })),
              ...types.map((type) => ({ label: type.name.toUpperCase(), value: type.name.toUpperCase() })),
              ...enums.map((type) => ({ label: type.name.toUpperCase(), value: type.name.toUpperCase() })),
            ]}
            filter
            value={data.type}
            validateStatus={data.type === "" ? "error" : "default"}
            placeholder={t("type")}
            onChange={(value) => {
              if (value === data.type) return;
              reportOverride("type", value);
              recordUndo("type", data.type, value);
              const canIncr = !!dbToTypes[database][value]?.canIncrement;
              const updated = {
                type: value,
                increment: data.increment && canIncr,
                size: "",
                values: [],
                default: dbToTypes[database][value]?.hasDefault ? data.default : "",
                check: "",
              };
              if (["ENUM", "SET"].includes(value)) {
                updated.values = [...(data.values || [])];
                updated.default = "";
              } else if (
                dbToTypes[database][value]?.isSized ||
                dbToTypes[database][value]?.hasPrecision
              ) {
                updated.size = dbToTypes[database][value].defaultSize;
              }
              updateField(tid, data.id, updated);
            }}
          />
        </Tooltip>
      </div>

      {/* Not null toggle */}
      <div>
        <Button
          type={data.notNull ? "tertiary" : "primary"}
          title={t("nullable")}
          theme={data.notNull ? "light" : "solid"}
          onClick={() => {
            reportOverride("notNull", !data.notNull);
            recordUndo("notNull", data.notNull, !data.notNull);
            updateField(tid, data.id, { notNull: !data.notNull });
          }}
        >
          ?
        </Button>
      </div>

      {/* Primary key toggle */}
      <div>
        <Button
          type={data.primary ? "primary" : "tertiary"}
          title={t("primary")}
          theme={data.primary ? "solid" : "light"}
          icon={<IconKeyStroked />}
          onClick={() => {
            reportOverride("primary", !data.primary);
            recordUndo("primary", data.primary, !data.primary);
            updateField(tid, data.id, { primary: !data.primary });
          }}
        />
      </div>

      {/* Field settings */}
      <div>
        <Popover
          content={
            <div className="px-1 w-[240px] popover-theme">
              <FieldDetails data={data} tid={tid} />
            </div>
          }
          trigger="click"
          position="right"
          showArrow
        >
          <Button type="tertiary" icon={<IconMore />} />
        </Popover>
      </div>
    </div>
  );
}
