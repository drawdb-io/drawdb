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

export default function FieldDetails({ data, tid, index }) {
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { updateField, deleteField } = useTables();
  const [editField, setEditField] = useState({});

  return (
    <div>
      <div className="font-semibold">Default value</div>
      <Input
        className="my-2"
        placeholder="Set default"
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
              message: `Edit table field default to ${e.target.value}`,
            },
          ]);
          setRedoStack([]);
        }}
      />
      {(data.type === "ENUM" || data.type === "SET") && (
        <>
          <div className="font-semibold mb-1">{data.type} values</div>
          <TagInput
            separator={[",", ", ", " ,"]}
            value={data.values}
            validateStatus={
              !data.values || data.values.length === 0 ? "error" : "default"
            }
            className="my-2"
            placeholder="Use ',' for batch input"
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
                  message: `Edit table field values to "${JSON.stringify(
                    data.values,
                  )}"`,
                },
              ]);
              setRedoStack([]);
            }}
          />
        </>
      )}
      {isSized(data.type) && (
        <>
          <div className="font-semibold">Size</div>
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
                  message: `Edit table field size to ${e.target.value}`,
                },
              ]);
              setRedoStack([]);
            }}
          />
        </>
      )}
      {hasPrecision(data.type) && (
        <>
          <div className="font-semibold">Precision</div>
          <Input
            className="my-2 w-full"
            placeholder="Set precision: (size, d)"
            validateStatus={
              !data.size || /^\(\d+,\s*\d+\)$|^$/.test(data.size)
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
                  message: `Edit table field precision to ${e.target.value}`,
                },
              ]);
              setRedoStack([]);
            }}
          />
        </>
      )}
      {hasCheck(data.type) && (
        <>
          <div className="font-semibold">Check Expression</div>
          <Input
            className="mt-2"
            placeholder="Set constraint"
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
                  message: `Edit table field check expression to ${e.target.value}`,
                },
              ]);
              setRedoStack([]);
            }}
          />
          <div className="text-xs mt-1">
            *This will appear in the script as is.
          </div>
        </>
      )}
      <div className="flex justify-between items-center my-3">
        <div className="font-medium">Unique</div>
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
        <div className="font-medium">Autoincrement</div>
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
                message: `Edit table field to${
                  data.increment ? " not" : ""
                } auto increment`,
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
      <div className="font-semibold">Comment</div>
      <TextArea
        className="my-2"
        placeholder="Add comment"
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
              message: `Edit field comment to "${e.target.value}"`,
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
        Delete field
      </Button>
    </div>
  );
}
