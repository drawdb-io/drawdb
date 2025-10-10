import { useState } from "react";
import { Action, ObjectType } from "../../../data/constants";
import {
  Row,
  Col,
  Input,
  Button,
  Select,
  TagInput,
  InputNumber,
  Popover,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked, IconMore } from "@douyinfe/semi-icons";
import {
  useUndoRedo,
  useTypes,
  useDiagram,
  useEnums,
  useLayout,
} from "../../../hooks";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";

export default function TypeField({ data, tid, fid }) {
  const { types, updateType } = useTypes();
  const { enums } = useEnums();
  const { layout } = useLayout();
  const { database } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const { t } = useTranslation();

  return (
    <Row gutter={6} className="hover-1 my-2">
      <Col span={10}>
        <Input
          value={data.name}
          readonly={layout.readOnly}
          validateStatus={data.name === "" ? "error" : "default"}
          placeholder={t("name")}
          onChange={(value) =>
            updateType(tid, {
              fields: types[tid].fields.map((e, id) =>
                id === fid ? { ...data, name: value } : e,
              ),
            })
          }
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TYPE,
                component: "field",
                tid: tid,
                fid: fid,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_type", {
                  typeName: data.name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </Col>
      <Col span={11}>
        <Select
          className="w-full"
          optionList={[
            ...Object.keys(dbToTypes[database]).map((value) => ({
              label: value,
              value: value,
            })),
            ...types
              .filter(
                (type) => type.name.toLowerCase() !== types[tid].name.toLowerCase(),
              )
              .map((type) => ({
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
            if (layout.readOnly) return;
            if (value === data.type) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TYPE,
                component: "field",
                tid: tid,
                fid: fid,
                undo: { type: data?.type },
                redo: { type: value },
                message: t("edit_type", {
                  typeName: data.name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            if (value === "ENUM" || value === "SET") {
              updateType(tid, {
                fields: types[tid].fields?.map((e, id) =>
                  id === fid
                    ? {
                        ...data,
                        type: value,
                        values: data.values ? [...data.values] : [],
                      }
                    : e,
                ),
              });
            } else if (
              dbToTypes[database][value].isSized ||
              dbToTypes[database][value].hasPrecision
            ) {
              updateType(tid, {
                fields: types[tid].fields.map((e, id) =>
                  id === fid
                    ? {
                        ...data,
                        type: value,
                        size: dbToTypes[database][value].defaultSize,
                      }
                    : e,
                ),
              });
            } else {
              updateType(tid, {
                fields: types[tid].fields.map((e, id) =>
                  id === fid ? { ...data, type: value } : e,
                ),
              });
            }
          }}
        />
      </Col>
      <Col span={3}>
        <Popover
          content={
            <div className="popover-theme w-[240px]">
              {(data.type === "ENUM" || data.type === "SET") && (
                <>
                  <div className="font-semibold mb-1">
                    {data.type} {t("values")}
                  </div>
                  <TagInput
                    separator={[",", ", ", " ,"]}
                    value={data.values}
                    validateStatus={
                      !data.values || data.values.length === 0
                        ? "error"
                        : "default"
                    }
                    className="my-2"
                    placeholder={t("use_for_batch_input")}
                    onChange={(v) => {
                      if (layout.readOnly) return;
                      updateType(tid, {
                        fields: types[tid].fields.map((e, id) =>
                          id === fid ? { ...data, values: v } : e,
                        ),
                      });
                    }}
                    onFocus={() => setEditField({ values: data.values })}
                    onBlur={() => {
                      if (
                        JSON.stringify(editField.values) ===
                        JSON.stringify(data.values)
                      )
                        return;
                      setUndoStack((prev) => [
                        ...prev,
                        {
                          action: Action.EDIT,
                          element: ObjectType.TYPE,
                          component: "field",
                          tid: tid,
                          fid: fid,
                          undo: editField,
                          redo: { values: data.values },
                          message: t("edit_type", {
                            typeName: data.name,
                            extra: "[field]",
                          }),
                        },
                      ]);
                      setRedoStack([]);
                    }}
                  />
                </>
              )}
              {dbToTypes[database][data.type].isSized && (
                <>
                  <div className="font-semibold">{t("size")}</div>
                  <InputNumber
                    className="my-2 w-full"
                    placeholder={t("size")}
                    value={data.size}
                    readonly={layout.readOnly}
                    onChange={(value) =>
                      updateType(tid, {
                        fields: types[tid].fields.map((e, id) =>
                          id === fid ? { ...data, size: value } : e,
                        ),
                      })
                    }
                    onFocus={(e) => setEditField({ size: e.target.value })}
                    onBlur={(e) => {
                      if (e.target.value === editField.size) return;
                      setUndoStack((prev) => [
                        ...prev,
                        {
                          action: Action.EDIT,
                          element: ObjectType.TABLE,
                          component: "field",
                          tid: tid,
                          fid: fid,
                          undo: editField,
                          redo: { size: e.target.value },
                          message: t("edit_type", {
                            typeName: data.name,
                            extra: "[field]",
                          }),
                        },
                      ]);
                      setRedoStack([]);
                    }}
                  />
                </>
              )}
              {dbToTypes[database][data.type].hasPrecision && (
                <>
                  <div className="font-semibold">{t("precision")}</div>
                  <Input
                    className="my-2 w-full"
                    placeholder={t("set_precision")}
                    readonly={layout.readOnly}
                    validateStatus={
                      /^\(\d+,\s*\d+\)$|^$/.test(data.size)
                        ? "default"
                        : "error"
                    }
                    value={data.size}
                    onChange={(value) =>
                      updateType(tid, {
                        fields: types[tid].fields.map((e, id) =>
                          id === fid ? { ...data, size: value } : e,
                        ),
                      })
                    }
                    onFocus={(e) => setEditField({ size: e.target.value })}
                    onBlur={(e) => {
                      if (e.target.value === editField.size) return;
                      setUndoStack((prev) => [
                        ...prev,
                        {
                          action: Action.EDIT,
                          element: ObjectType.TABLE,
                          component: "field",
                          tid: tid,
                          fid: fid,
                          undo: editField,
                          redo: { size: e.target.value },
                          message: t("edit_type", {
                            typeName: data.name,
                            extra: "[field]",
                          }),
                        },
                      ]);
                      setRedoStack([]);
                    }}
                  />
                </>
              )}
              <Button
                block
                type="danger"
                disabled={layout.readOnly}
                icon={<IconDeleteStroked />}
                onClick={() => {
                  setUndoStack((prev) => [
                    ...prev,
                    {
                      action: Action.EDIT,
                      element: ObjectType.TYPE,
                      component: "field_delete",
                      tid: tid,
                      fid: fid,
                      data: data,
                      message: t("edit_type", {
                        typeName: data.name,
                        extra: "[delete field]",
                      }),
                    },
                  ]);
                  updateType(tid, {
                    fields: types[tid].fields.filter((_, k) => k !== fid),
                  });
                }}
              >
                {t("delete")}
              </Button>
            </div>
          }
          showArrow
          trigger="click"
          position="right"
        >
          <Button icon={<IconMore />} type="tertiary" />
        </Popover>
      </Col>
    </Row>
  );
}
