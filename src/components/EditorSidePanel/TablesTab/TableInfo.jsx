import { useState } from "react";
import {
  Collapse,
  Input,
  TextArea,
  Button,
  Card,
  Popover,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useUndoRedo } from "../../../hooks";
import { Action, ObjectType, defaultBlue } from "../../../data/constants";
import ColorPalette from "../../ColorPicker";
import TableField from "./TableField";
import IndexDetails from "./IndexDetails";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";

export default function TableInfo({ data }) {
  const { t } = useTranslation();
  const [indexActiveKey, setIndexActiveKey] = useState("");
  const { deleteTable, updateTable, updateField, setRelationships, database } =
    useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const [drag, setDrag] = useState({
    draggingElementIndex: null,
    draggingOverIndexList: [],
  });

  return (
    <div>
      <div className="flex items-center mb-2.5">
        <div className="text-md font-semibold break-keep">{t("name")}: </div>
        <Input
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder={t("name")}
          className="ms-2"
          onChange={(value) => updateTable(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "self",
                tid: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_table", {
                  tableName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>
      {data.fields.map((f, j) => (
        <div
          key={"field_" + j}
          className={`cursor-pointer ${drag.draggingOverIndexList.includes(j) ? "opacity-25" : ""}`}
          style={{ direction: "ltr" }}
          draggable
          onDragStart={() => {
            setDrag((prev) => ({ ...prev, draggingElementIndex: j }));
          }}
          onDragLeave={() => {
            setDrag((prev) => ({
              ...prev,
              draggingOverIndexList: prev.draggingOverIndexList.filter(
                (index) => index !== j,
              ),
            }));
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (drag.draggingElementIndex != null) {
              if (j !== drag.draggingElementIndex) {
                setDrag((prev) => {
                  if (prev.draggingOverIndexList.includes(j)) {
                    return prev;
                  }

                  return {
                    ...prev,
                    draggingOverIndexList: prev.draggingOverIndexList.concat(j),
                  };
                });
              }

              return;
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const index = drag.draggingElementIndex;
            setDrag({ draggingElementIndex: null, draggingOverIndexList: [] });
            if (index == null || index === j) {
              return;
            }

            const a = data.fields[index];
            const b = data.fields[j];

            updateField(data.id, index, {
              ...b,
              ...(!dbToTypes[database][b.type].isSized && { size: "" }),
              ...(!dbToTypes[database][b.type].hasCheck && { check: "" }),
              ...(dbToTypes[database][b.type].noDefault && { default: "" }),
              id: index,
            });
            updateField(data.id, j, {
              ...a,
              ...(!dbToTypes[database][a.type].isSized && { size: "" }),
              ...(!dbToTypes[database][a.type].hasCheck && { check: "" }),
              ...(!dbToTypes[database][a.type].noDefault && { default: "" }),
              id: j,
            });

            setRelationships((prev) =>
              prev.map((e) => {
                if (e.startTableId === data.id) {
                  if (e.startFieldId === index) {
                    return { ...e, startFieldId: j };
                  }
                  if (e.startFieldId === j) {
                    return { ...e, startFieldId: index };
                  }
                }
                if (e.endTableId === data.id) {
                  if (e.endFieldId === index) {
                    return { ...e, endFieldId: j };
                  }
                  if (e.endFieldId === j) {
                    return { ...e, endFieldId: index };
                  }
                }
                return e;
              }),
            );
          }}
          onDragEnd={(e) => {
            e.preventDefault();
            setDrag({ draggingElementIndex: null, draggingOverIndexList: [] });
          }}
        >
          <TableField data={f} tid={data.id} index={j} />
        </div>
      ))}
      {data.indices.length > 0 && (
        <Card
          bodyStyle={{ padding: "4px" }}
          style={{ marginTop: "12px", marginBottom: "12px" }}
          headerLine={false}
        >
          <Collapse
            activeKey={indexActiveKey}
            keepDOM
            lazyRender
            onChange={(itemKey) => setIndexActiveKey(itemKey)}
            accordion
          >
            <Collapse.Panel header={t("indices")} itemKey="1">
              {data.indices.map((idx, k) => (
                <IndexDetails
                  key={"index_" + k}
                  data={idx}
                  iid={k}
                  tid={data.id}
                  fields={data.fields.map((e) => ({
                    value: e.name,
                    label: e.name,
                  }))}
                />
              ))}
            </Collapse.Panel>
          </Collapse>
        </Card>
      )}
      <Card
        bodyStyle={{ padding: "4px" }}
        style={{ marginTop: "12px", marginBottom: "12px" }}
        headerLine={false}
      >
        <Collapse keepDOM lazyRender>
          <Collapse.Panel header={t("comment")} itemKey="1">
            <TextArea
              field="comment"
              value={data.comment}
              autosize
              placeholder={t("comment")}
              rows={1}
              onChange={(value) =>
                updateTable(data.id, { comment: value }, false)
              }
              onFocus={(e) => setEditField({ comment: e.target.value })}
              onBlur={(e) => {
                if (e.target.value === editField.comment) return;
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "self",
                    tid: data.id,
                    undo: editField,
                    redo: { comment: e.target.value },
                    message: t("edit_table", {
                      tableName: e.target.value,
                      extra: "[comment]",
                    }),
                  },
                ]);
                setRedoStack([]);
              }}
            />
          </Collapse.Panel>
        </Collapse>
      </Card>
      <div className="flex justify-between items-center gap-1 mb-2">
        <div>
          <Popover
            content={
              <div className="popover-theme">
                <ColorPalette
                  currentColor={data.color}
                  onClearColor={() => {
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "self",
                        tid: data.id,
                        undo: { color: data.color },
                        redo: { color: defaultBlue },
                        message: t("edit_table", {
                          tableName: data.name,
                          extra: "[color]",
                        }),
                      },
                    ]);
                    setRedoStack([]);
                    updateTable(data.id, { color: defaultBlue });
                  }}
                  onPickColor={(c) => {
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "self",
                        tid: data.id,
                        undo: { color: data.color },
                        redo: { color: c },
                        message: t("edit_table", {
                          tableName: data.name,
                          extra: "[color]",
                        }),
                      },
                    ]);
                    setRedoStack([]);
                    updateTable(data.id, { color: c });
                  }}
                />
              </div>
            }
            trigger="click"
            position="bottomLeft"
            showArrow
          >
            <div
              className="h-[32px] w-[32px] rounded"
              style={{ backgroundColor: data.color }}
            />
          </Popover>
        </div>
        <div className="flex gap-1">
          <Button
            block
            onClick={() => {
              setIndexActiveKey("1");
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "index_add",
                  tid: data.id,
                  message: t("edit_table", {
                    tableName: data.name,
                    extra: "[add index]",
                  }),
                },
              ]);
              setRedoStack([]);
              updateTable(data.id, {
                indices: [
                  ...data.indices,
                  {
                    id: data.indices.length,
                    name: `${data.name}_index_${data.indices.length}`,
                    unique: false,
                    fields: [],
                  },
                ],
              });
            }}
          >
            {t("add_index")}
          </Button>
          <Button
            onClick={() => {
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "field_add",
                  tid: data.id,
                  message: t("edit_table", {
                    tableName: data.name,
                    extra: "[add field]",
                  }),
                },
              ]);
              setRedoStack([]);
              updateTable(data.id, {
                fields: [
                  ...data.fields,
                  {
                    name: "",
                    type: "",
                    default: "",
                    check: "",
                    primary: false,
                    unique: false,
                    notNull: false,
                    increment: false,
                    comment: "",
                    id: data.fields.length,
                  },
                ],
              });
            }}
            block
          >
            {t("add_field")}
          </Button>
          <Button
            icon={<IconDeleteStroked />}
            type="danger"
            onClick={() => deleteTable(data.id)}
          />
        </div>
      </div>
    </div>
  );
}
