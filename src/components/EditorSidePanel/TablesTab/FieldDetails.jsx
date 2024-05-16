import { useState } from "react";
import {
  Input,
  TextArea,
  Button,
  TagInput,
  InputNumber,
  Checkbox,
} from "@douyinfe/semi-ui";
import { Action, ObjectType } from "../../../data/constants";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { hasCheck, hasPrecision, isSized } from "../../../utils/toSQL";
import { useTables, useUndoRedo } from "../../../hooks";
import { useTranslation } from "react-i18next";

export default function FieldDetails({ data, tid, index }) {
  const { t } = useTranslation();
  const { tables } = useTables();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { updateField, deleteField } = useTables();
  const [editField, setEditField] = useState({});

  return (
    <div>
      <div className="font-semibold">{t("default_value")}</div>
      <Input
        className="my-2"
        placeholder={t("default_value")}
        value={data.default}
        disabled={
          data.type === "BLOB" ||
          data.type === "JSON" ||
          data.type === "TEXT" ||
          data.type === "UUID" ||
          data.increment
        }
        onChange={(value) => updateField(tid, index, { default: value })}
        onFocus={(e) => setEditField({ default: e.target.value })}
        onBlur={(e) => {
          if (e.target.value === editField.default) return;
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.TABLE,
              component: "field",
              tid: tid,
              fid: index,
              undo: editField,
              redo: { default: e.target.value },
              message: t("edit_table", {
                tableName: tables[tid].name,
                extra: "[field]",
              }),
            },
          ]);
          setRedoStack([]);
        }}
      />
      {(data.type === "ENUM" || data.type === "SET") && (
        <>
          <div className="font-semibold mb-1">
            {data.type} {t("values")}
          </div>
          <TagInput
            separator={[",", ", ", " ,"]}
            value={data.values}
            validateStatus={
              !data.values || data.values.length === 0 ? "error" : "default"
            }
            addOnBlur
            className="my-2"
            placeholder={t("use_for_batch_input")}
            onChange={(v) => updateField(tid, index, { values: v })}
            onFocus={() => setEditField({ values: data.values })}
            onBlur={() => {
              if (
                JSON.stringify(editField.values) === JSON.stringify(data.values)
              )
                return;
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "field",
                  tid: tid,
                  fid: index,
                  undo: editField,
                  redo: { values: data.values },
                  message: t("edit_table", {
                    tableName: tables[tid].name,
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
            placeholder="Set length"
            value={data.size}
            onChange={(value) => updateField(tid, index, { size: value })}
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
                  fid: index,
                  undo: editField,
                  redo: { size: e.target.value },
                  message: t("edit_table", {
                    tableName: tables[tid].name,
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
              !data.size || /^\d+,\s*\d+$|^$/.test(data.size)
                ? "default"
                : "error"
            }
            value={data.size}
            onChange={(value) => updateField(tid, index, { size: value })}
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
                  fid: index,
                  undo: editField,
                  redo: { size: e.target.value },
                  message: t("edit_table", {
                    tableName: tables[tid].name,
                    extra: "[field]",
                  }),
                },
              ]);
              setRedoStack([]);
            }}
          />
        </>
      )}
      {hasCheck(data.type) && (
        <>
          <div className="font-semibold">{t("check")}</div>
          <Input
            className="mt-2"
            placeholder={t("check")}
            value={data.check}
            disabled={data.increment}
            onChange={(value) => updateField(tid, index, { check: value })}
            onFocus={(e) => setEditField({ check: e.target.value })}
            onBlur={(e) => {
              if (e.target.value === editField.check) return;
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "field",
                  tid: tid,
                  fid: index,
                  undo: editField,
                  redo: { check: e.target.value },
                  message: t("edit_table", {
                    tableName: tables[tid].name,
                    extra: "[field]",
                  }),
                },
              ]);
              setRedoStack([]);
            }}
          />
          <div className="text-xs mt-1">{t("this_will_appear_as_is")}</div>
        </>
      )}
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
                component: "field",
                tid: tid,
                fid: index,
                undo: {
                  [checkedValues.target.value]: !checkedValues.target.checked,
                },
                redo: {
                  [checkedValues.target.value]: checkedValues.target.checked,
                },
              },
            ]);
            setRedoStack([]);
            updateField(tid, index, {
              [checkedValues.target.value]: checkedValues.target.checked,
            });
          }}
        />
      </div>
      <div className="flex justify-between items-center my-3">
        <div className="font-medium">{t("autoincrement")}</div>
        <Checkbox
          value="increment"
          checked={data.increment}
          disabled={
            !(
              data.type === "INT" ||
              data.type === "BIGINT" ||
              data.type === "SMALLINT"
            )
          }
          onChange={(checkedValues) => {
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: {
                  [checkedValues.target.value]: !checkedValues.target.checked,
                },
                redo: {
                  [checkedValues.target.value]: checkedValues.target.checked,
                },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            updateField(tid, index, {
              increment: !data.increment,
              check: data.increment ? data.check : "",
            });
          }}
        />
      </div>
      <div className="font-semibold">{t("comment")}</div>
      <TextArea
        className="my-2"
        placeholder={t("comment")}
        value={data.comment}
        autosize
        rows={2}
        onChange={(value) => updateField(tid, index, { comment: value })}
        onFocus={(e) => setEditField({ comment: e.target.value })}
        onBlur={(e) => {
          if (e.target.value === editField.comment) return;
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.TABLE,
              component: "field",
              tid: tid,
              fid: index,
              undo: editField,
              redo: { comment: e.target.value },
              message: t("edit_table", {
                tableName: tables[tid].name,
                extra: "[field]",
              }),
            },
          ]);
          setRedoStack([]);
        }}
      />
      <Button
        icon={<IconDeleteStroked />}
        type="danger"
        block
        onClick={() => deleteField(data, tid)}
      >
        {t("delete")}
      </Button>
    </div>
  );
}
