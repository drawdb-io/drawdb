import { Action, ObjectType } from "../../../data/constants";
import { Input, Button, Popover, Select } from "@douyinfe/semi-ui";
import { IconMore, IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useLayout, useUndoRedo } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";

export default function UniqueConstraintDetails({ data, fields, cid, tid }) {
  const { t } = useTranslation();
  const { layout } = useLayout();
  const { tables, updateTable } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const table = useMemo(() => tables.find((t) => t.id === tid), [tables, tid]);

  const constraints = table.uniqueConstraints ?? [];

  return (
    <div className="flex justify-between items-center mb-2">
      <Select
        placeholder={t("select_fields")}
        multiple
        validateStatus={data.fields.length === 0 ? "error" : "default"}
        optionList={fields}
        className="w-full"
        value={data.fields}
        onChange={(value) => {
          if (layout.readOnly) return;

          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.TABLE,
              component: "unique_constraint",
              tid: tid,
              cid: cid,
              undo: {
                fields: [...data.fields],
              },
              redo: {
                fields: [...value],
              },
              message: t("edit_table", {
                tableName: table.name,
                extra: "[unique constraint field]",
              }),
            },
          ]);
          setRedoStack([]);
          updateTable(tid, {
            uniqueConstraints: constraints.map((constraint) =>
              constraint.id === cid
                ? {
                    ...constraint,
                    fields: [...value],
                  }
                : constraint,
            ),
          });
        }}
      />
      <Popover
        content={
          <div className="px-1 popover-theme">
            <div className="font-semibold mb-1">{t("name")}: </div>
            <Input
              value={data.name}
              placeholder={t("name")}
              readonly={layout.readOnly}
              validateStatus={data.name.trim() === "" ? "error" : "default"}
              onFocus={() =>
                setEditField({
                  name: data.name,
                })
              }
              onChange={(value) =>
                updateTable(tid, {
                  uniqueConstraints: constraints.map((constraint) =>
                    constraint.id === cid
                      ? {
                          ...constraint,
                          name: value,
                        }
                      : constraint,
                  ),
                })
              }
              onBlur={(e) => {
                if (e.target.value === editField.name) return;
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "unique_constraint",
                    tid: tid,
                    cid: cid,
                    undo: editField,
                    redo: { name: e.target.value },
                    message: t("edit_table", {
                      tableName: table.name,
                      extra: "[unique constraint]",
                    }),
                  },
                ]);
                setRedoStack([]);
              }}
            />
            <Button
              block
              type="danger"
              className="mt-2"
              disabled={layout.readOnly}
              icon={<IconDeleteStroked />}
              onClick={() => {
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "unique_constraint_delete",
                    tid: tid,
                    data: data,
                    message: t("edit_table", {
                      tableName: table.name,
                      extra: "[delete unique constraint]",
                    }),
                  },
                ]);
                setRedoStack([]);
                updateTable(tid, {
                  uniqueConstraints: constraints
                    .filter((e) => e.id !== cid)
                    .map((e, j) => ({
                      ...e,
                      id: j,
                    })),
                });
              }}
            >
              {t("delete")}
            </Button>
          </div>
        }
        trigger="click"
        position="rightTop"
        showArrow
      >
        <Button
          icon={<IconMore />}
          type="tertiary"
          style={{ marginLeft: "12px" }}
        />
      </Popover>
    </div>
  );
}
