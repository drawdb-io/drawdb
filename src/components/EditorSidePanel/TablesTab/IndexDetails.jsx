import { Action, ObjectType } from "../../../data/constants";
import { Input, Button, Popover, Checkbox, Select } from "@douyinfe/semi-ui";
import { IconMore, IconDeleteStroked } from "@douyinfe/semi-icons";
import { useTables, useUndoRedo } from "../../../hooks";

export default function IndexDetails({ data, fields, iid, tid }) {
  const { tables, updateTable } = useTables();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  return (
    <div className="flex justify-between items-center mb-2">
      <Select
        placeholder="Select fields"
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
                name: `${data.fields.join("_")}_index`,
              },
              redo: {
                fields: [...value],
                name: `${value.join("_")}_index`,
              },
              message: `Edit index fields to "${JSON.stringify(value)}"`,
            },
          ]);
          setRedoStack([]);
          updateTable(tid, {
            indices: tables[tid].indices.map((index) =>
              index.id === iid
                ? {
                    ...index,
                    fields: [...value],
                    name: `${value.join("_")}_index`,
                  }
                : index
            ),
          });
        }}
      />
      <Popover
        content={
          <div className="px-1 popover-theme">
            <div className="font-semibold mb-1">Index name: </div>
            <Input value={data.name} placeholder="Index name" disabled />
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
                      message: `Edit table field to${
                        data.unique ? " not" : ""
                      } unique`,
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
                        : index
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
                    message: `Delete index`,
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
              Delete
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
