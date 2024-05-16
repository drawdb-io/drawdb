import { useState } from "react";
import { Action, ObjectType, sqlDataTypes } from "../../../data/constants";
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
import { isSized, hasPrecision, getSize } from "../../../utils/toSQL";
import { useUndoRedo, useTypes } from "../../../hooks";
import { useTranslation } from "react-i18next";

export default function TypeField({ data, tid, fid }) {
  const { types, updateType } = useTypes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const { t } = useTranslation();

  return (
    <Row gutter={6} className="hover-1 my-2">
      <Col span={10}>
        <Input
          value={data.name}
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
            ...sqlDataTypes.map((value) => ({
              label: value,
              value: value,
            })),
            ...types
              .filter(
                (type) => type.name.toLowerCase() !== data.name.toLowerCase(),
              )
              .map((type) => ({
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
            } else if (isSized(value) || hasPrecision(value)) {
              updateType(tid, {
                fields: types[tid].fields.map((e, id) =>
                  id === fid
                    ? { ...data, type: value, size: getSize(value) }
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
                    onChange={(v) =>
                      updateType(tid, {
                        fields: types[tid].fields.map((e, id) =>
                          id === fid ? { ...data, values: v } : e,
                        ),
                      })
                    }
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
              {isSized(data.type) && (
                <>
                  <div className="font-semibold">{t("size")}</div>
                  <InputNumber
                    className="my-2 w-full"
                    placeholder={t("size")}
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
              {hasPrecision(data.type) && (
                <>
                  <div className="font-semibold">{t("precision")}</div>
                  <Input
                    className="my-2 w-full"
                    placeholder={t("set_precision")}
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
                icon={<IconDeleteStroked />}
                block
                type="danger"
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
