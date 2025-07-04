import { useMemo, useState } from "react";
import { Action, ObjectType } from "../../../data/constants";
import { Input, Button, Popover, Select } from "@douyinfe/semi-ui";
import { IconMore, IconKeyStroked } from "@douyinfe/semi-icons";
import { useEnums, useDiagram, useTypes, useUndoRedo } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";
import { DragHandle } from "../../SortableList/DragHandle";
import FieldDetails from "./FieldDetails";

export default function TableField({ data, tid, index, inherited }) {
  const { updateField } = useDiagram();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { tables, database } = useDiagram();
  const { t } = useTranslation();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const table = useMemo(() => tables.find((t) => t.id === tid), [tables, tid]);

  return (
    <div className="hover-1 my-2 flex gap-2 items-center">
      <DragHandle id={data.id} />

      <div className="min-w-20 flex-1/3">
        <Input
          value={data.name}
          id={`scroll_table_${tid}_input_${index}`}
          validateStatus={
            data.name.trim() === "" || inherited ? "error" : "default"
          }
          placeholder={t("name")}
          onChange={(value) => updateField(tid, data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_table", {
                  tableName: table.name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>

      <div className="min-w-24 flex-1/3">
        <Select
          className="w-full"
          optionList={[
            ...Object.keys(dbToTypes[database]).map((value) => ({
              label: value,
              value,
            })),
            ...types.map((type) => ({
              label: type.name.toUpperCase(),
              value: type.name.toUpperCase(),
            })),
            ...enums.map((type) => ({
              label: type.name.toUpperCase(),
              value: type.name.toUpperCase(),
            })),
          ]}
          filter
          value={data.type}
          validateStatus={data.type === "" ? "error" : "default"}
          placeholder={t("type")}
          onChange={(value) => {
            if (value === data.type) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: data.id,
                undo: { type: data.type },
                redo: { type: value },
                message: t("edit_table", {
                  tableName: table.name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            const incr =
              data.increment && !!dbToTypes[database][value].canIncrement;

            if (value === "ENUM" || value === "SET") {
              updateField(tid, data.id, {
                type: value,
                default: "",
                values: data.values ? [...data.values] : [],
                increment: incr,
              });
            } else if (
              dbToTypes[database][value].isSized ||
              dbToTypes[database][value].hasPrecision
            ) {
              updateField(tid, data.id, {
                type: value,
                size: dbToTypes[database][value].defaultSize,
                increment: incr,
              });
            } else if (!dbToTypes[database][value].hasDefault || incr) {
              updateField(tid, data.id, {
                type: value,
                increment: incr,
                default: "",
                size: "",
                values: [],
              });
            } else if (dbToTypes[database][value].hasCheck) {
              updateField(tid, data.id, {
                type: value,
                check: "",
                increment: incr,
              });
            } else {
              updateField(tid, data.id, {
                type: value,
                increment: incr,
                size: "",
                values: [],
              });
            }
          }}
        />
      </div>

      <div>
        <Button
          type={data.notNull ? "tertiary" : "primary"}
          title={t("nullable")}
          theme={data.notNull ? "light" : "solid"}
          onClick={() => {
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: data.id,
                undo: { notNull: data.notNull },
                redo: { notNull: !data.notNull },
                message: t("edit_table", {
                  tableName: table.name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            updateField(tid, data.id, { notNull: !data.notNull });
          }}
        >
          ?
        </Button>
      </div>

      <div>
        <Button
          type={data.primary ? "primary" : "tertiary"}
          title={t("primary")}
          theme={data.primary ? "solid" : "light"}
          icon={<IconKeyStroked />}
          onClick={() => {
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: data.id,
                undo: { primary: data.primary },
                redo: { primary: !data.primary },
                message: t("edit_table", {
                  tableName: table.name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            updateField(tid, data.id, { primary: !data.primary });
          }}
        />
      </div>

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
