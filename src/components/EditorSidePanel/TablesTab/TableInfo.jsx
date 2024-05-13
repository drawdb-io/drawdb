import { useState } from "react";
import {
  Collapse,
  Row,
  Col,
  Input,
  TextArea,
  Button,
  Card,
  Popover,
  Toast,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useTables, useUndoRedo } from "../../../hooks";
import { Action, ObjectType, defaultBlue } from "../../../data/constants";
import ColorPalette from "../../ColorPalette";
import TableField from "./TableField";
import IndexDetails from "./IndexDetails";

export default function TableInfo({ data }) {
  const [indexActiveKey, setIndexActiveKey] = useState("");
  const { deleteTable, updateTable, updateField, setRelationships } =
    useTables();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const [drag, setDrag] = useState({
    draggingElementIndex: null,
    draggingOverIndexList: [],
  });

  return (
    <div>
      <div className="flex items-center mb-2.5">
        <div className="text-md font-semibold">Name: </div>
        <Input
          value={data.name}
          validateStatus={data.name === "" ? "error" : "default"}
          placeholder="Name"
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
                message: `Edit table name to ${e.target.value}`,
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

            updateField(data.id, index, { ...b, id: index });
            updateField(data.id, j, { ...a, id: j });

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
            <Collapse.Panel header="Indices" itemKey="1">
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
          <Collapse.Panel header="Comment" itemKey="1">
            <TextArea
              field="comment"
              value={data.comment}
              autosize
              placeholder="Add comment"
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
                    message: `Edit table comment to ${e.target.value}`,
                  },
                ]);
                setRedoStack([]);
              }}
            />
          </Collapse.Panel>
        </Collapse>
      </Card>
      <Row gutter={6} className="mt-2">
        <Col span={8}>
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
                        message: `Edit table color to default`,
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
                        message: `Edit table color to ${c}`,
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
              className="h-[32px] w-[32px] rounded mb-2"
              style={{ backgroundColor: data.color }}
            />
          </Popover>
        </Col>
        <Col span={7}>
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
                  message: `Add index`,
                },
              ]);
              setRedoStack([]);
              updateTable(data.id, {
                indices: [
                  ...data.indices,
                  {
                    id: data.indices.length,
                    name: `index_${data.indices.length}`,
                    unique: false,
                    fields: [],
                  },
                ],
              });
            }}
          >
            Add index
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => {
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "field_add",
                  tid: data.id,
                  message: `Add field`,
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
            Add field
          </Button>
        </Col>
        <Col span={3}>
          <Button
            icon={<IconDeleteStroked />}
            type="danger"
            onClick={() => {
              Toast.success(`Table deleted!`);
              deleteTable(data.id);
            }}
          />
        </Col>
      </Row>
    </div>
  );
}
