import { Action, ObjectType } from "../../../data/constants";
import { Input, Button, Popover, Checkbox, Select, Row, Col } from "@douyinfe/semi-ui";
import { IconMore, IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useUndoRedo } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function IndexDetails({ data, fields, iid, tid }) {
  const { t } = useTranslation();
  const { tables, updateTable } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <Row gutter={6} className="hover-1 my-2">
      <Col span={8}>
          <Input
          value={data.name}
          placeholder={t("name")}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          onFocus={() =>
              setEditField({
              name: data.name,
              })
          }
          onChange={(value) =>
              updateTable(tid, {
              indices: tables[tid].indices.map((index) =>
                  index.id === iid
                  ? {
                      ...index,
                      name: value,
                      }
                  : index,
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
                  component: "index",
                  tid: tid,
                  iid: iid,
                  undo: editField,
                  redo: { name: e.target.value },
                  message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[index]",
                  }),
              },
              ]);
              setRedoStack([]);
          }}
          />
      </Col>
      <Col span={12}>
        <Select
            placeholder={t("select_fields")}
            multiple
            validateStatus={data.fields.length === 0 ? "error" : "default"}
            optionList={fields}
            className="w-full"
            value={data.fields}
            onChange={(value) => {
            setUndoStack((prev) => [
                ...prev,
                {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "index",
                tid: tid,
                iid: iid,
                undo: {
                    fields: [...data.fields],
                },
                redo: {
                  fields: [...value],
                },
                message: t("edit_table", {
                    tableName: tables[tid].name,
                    extra: "[index field]",
                }),
                },
            ]);
            setRedoStack([]);
            updateTable(tid, {
                indices: tables[tid].indices.map((index) =>
                index.id === iid
                    ? {
                        ...index,
                        fields: [...value],
                    }
                    : index,
                ),
            });
            }}
        />
      </Col>
      <Col span={3}>
        <Popover
            content={
            <div className="px-1 popover-theme">
                <div className="font-semibold mb-1">{t("name")}: </div>
                <Input
                value={data.name}
                placeholder={t("name")}
                validateStatus={data.name.trim() === "" ? "error" : "default"}
                onFocus={() =>
                    setEditField({
                    name: data.name,
                    })
                }
                onChange={(value) =>
                    updateTable(tid, {
                    indices: tables[tid].indices.map((index) =>
                        index.id === iid
                        ? {
                            ...index,
                            name: value,
                            }
                        : index,
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
                        component: "index",
                        tid: tid,
                        iid: iid,
                        undo: editField,
                        redo: { name: e.target.value },
                        message: t("edit_table", {
                        tableName: tables[tid].name,
                        extra: "[index]",
                        }),
                    },
                    ]);
                    setRedoStack([]);
                }}
                />
                <div className="flex justify-between items-center my-3">
                <div className="font-medium">{t("unique")}</div>
                <Checkbox
                    value="unique"
                    checked={data.unique}
                    onChange={(checkedValues) => {
                    setUndoStack((prev) => [
                        ...prev,
                        {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "index",
                        tid: tid,
                        iid: iid,
                        undo: {
                            [checkedValues.target.value]:
                            !checkedValues.target.checked,
                        },
                        redo: {
                            [checkedValues.target.value]:
                            checkedValues.target.checked,
                        },
                        message: t("edit_table", {
                            tableName: tables[tid].name,
                            extra: "[index field]",
                        }),
                        },
                    ]);
                    setRedoStack([]);
                    updateTable(tid, {
                        indices: tables[tid].indices.map((index) =>
                        index.id === iid
                            ? {
                                ...index,
                                [checkedValues.target.value]:
                                checkedValues.target.checked,
                            }
                            : index,
                        ),
                    });
                    }}
                ></Checkbox>
                </div>
                <Button
                icon={<IconDeleteStroked />}
                type="danger"
                block
                onClick={() => {
                    setUndoStack((prev) => [
                    ...prev,
                    {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "index_delete",
                        tid: tid,
                        data: data,
                        message: t("edit_table", {
                        tableName: tables[tid].name,
                        extra: "[delete index]",
                        }),
                    },
                    ]);
                    setRedoStack([]);
                    updateTable(tid, {
                    indices: tables[tid].indices
                        .filter((e) => e.id !== iid)
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
            />
        </Popover>
      </Col>
    </Row>
  );
}
