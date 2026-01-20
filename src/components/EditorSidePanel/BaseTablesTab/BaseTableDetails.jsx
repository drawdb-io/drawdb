import { useState } from "react";
import { Button, Input } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useBaseTables, useLayout, useUndoRedo } from "../../../hooks";
import { Action, ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import BaseTableField from "./BaseTableField";
import { SortableList } from "../../SortableList/SortableList";

export default function BaseTableDetails({ data }) {
  const { t } = useTranslation();
  const { layout } = useLayout();
  const { deleteBaseTable, updateBaseTable, setBaseTables } = useBaseTables();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <>
      <div className="flex justify-center items-center gap-2 mb-4">
        <div className="font-semibold">{t("name")}: </div>
        <Input
          value={data.name}
          readonly={layout.readOnly}
          placeholder={t("name")}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          onChange={(value) => {
            updateBaseTable(data.id, { name: value });
          }}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;

            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.BASETABLE,
                id: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_base_table", {
                  baseTableName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>

      <SortableList
        items={data.fields}
        keyPrefix={`base_table-${data.id}`}
        onChange={(newFields) =>
          setBaseTables((prev) =>
            prev.map((bt) =>
              bt.id === data.id ? { ...bt, fields: newFields } : bt,
            ),
          )
        }
        renderItem={(item, i) => (
          <BaseTableField
            data={item}
            bid={data.id}
            index={i}
          />
        )}
      />

      <div className="flex gap-2 mt-4">
        <Button
          block
          disabled={layout.readOnly}
          onClick={() => {
            const id = nanoid();
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.BASETABLE,
                component: "field_add",
                bid: data.id,
                fid: id,
                message: t("edit_base_table", {
                  baseTableName: data.name,
                  extra: "[add field]",
                }),
              },
            ]);
            setRedoStack([]);
            updateBaseTable(data.id, {
              fields: [
                ...data.fields,
                {
                  id,
                  name: "",
                  type: "",
                  default: "",
                  check: "",
                  primary: false,
                  unique: false,
                  notNull: false,
                  increment: false,
                  comment: "",
                },
              ],
            });
          }}
        >
          {t("add_field")}
        </Button>
        <Button
          type="danger"
          disabled={layout.readOnly}
          icon={<IconDeleteStroked />}
          onClick={() => deleteBaseTable(data.id, true)}
        >
          {t("delete")}
        </Button>
      </div>
    </>
  );
}

