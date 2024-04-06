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
import ColorPallete from "../../ColorPallete";
import TableField from "./TableField";
import IndexDetails from "./IndexDetails";

export default function TableInfo({ data }) {
  const [indexActiveKey, setIndexActiveKey] = useState("");
  const { deleteTable, updateTable } = useTables();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <div id={`scroll_table_${data.id}`}>
      <Collapse.Panel
        header={
          <div className="overflow-hidden text-ellipsis whitespace-nowrap">
            {data.name}
          </div>
        }
        itemKey={`${data.id}`}
      >
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
          <TableField key={"field_" + j} data={f} tid={data.id} index={j} />
        ))}
        {data.indices.length > 0 && (
          <Card
            bodyStyle={{ padding: "4px" }}
            style={{ marginTop: "12px", marginBottom: "12px" }}
            headerLine={false}
          >
            <Collapse
              activeKey={indexActiveKey}
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
          <Collapse>
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
                  <ColorPallete
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
      </Collapse.Panel>
    </div>
  );
}
