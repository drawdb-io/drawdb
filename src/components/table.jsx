import { React, useState, useContext } from "react";
import {
  sqlDataTypes,
  tableThemes,
  defaultTableTheme,
  Tab,
  Action,
  ObjectType,
} from "../data/data";
import {
  IconEdit,
  IconMore,
  IconMinus,
  IconDeleteStroked,
  IconKeyStroked,
  IconCheckboxTick,
  IconColorPalette,
} from "@douyinfe/semi-icons";
import {
  Popconfirm,
  Select,
  Input,
  TextArea,
  Card,
  Checkbox,
  Row,
  Col,
  Popover,
  Tag,
  Button,
  SideSheet,
  Toast,
} from "@douyinfe/semi-ui";
import {
  LayoutContext,
  SelectContext,
  SettingsContext,
  TabContext,
  TableContext,
  UndoRedoContext,
} from "../pages/editor";

export default function Table(props) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  // const [visible, setVisible] = useState(false);
  const [editField, setEditField] = useState({});
  const { layout } = useContext(LayoutContext);
  const { deleteTable, updateTable, updateField } = useContext(TableContext);
  const { tab, setTab } = useContext(TabContext);
  const { settings } = useContext(SettingsContext);
  const { setUndoStack, setRedoStack } = useContext(UndoRedoContext);
  const { selectedElement, setSelectedElement } = useContext(SelectContext);

  const height = props.tableData.fields.length * 36 + 50 + 7;

  return (
    <>
      <foreignObject
        key={props.tableData.id}
        x={props.tableData.x}
        y={props.tableData.y}
        width={200}
        height={height}
        className="drop-shadow-lg rounded-md cursor-move"
        onMouseDown={props.onMouseDown}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          props.setOnRect({
            tableId: -1,
            field: -2,
          });
        }}
      >
        <div
          className={`border-2 border-gray-400 ${
            props.active && !props.moving && "border-blue-500 border-4"
          } ${
            props.moving && "border-blue-500 border-4 border-dashed"
          }  bg-gray-100 select-none rounded-lg w-full`}
        >
          <div
            className={`h-[10px] w-full rounded-t-md`}
            style={{ backgroundColor: props.tableData.color }}
          />
          <div className="font-bold text-slate-800 h-[40px] flex justify-between items-center border-b border-gray-400 bg-gray-200">
            <div className="px-3">{props.tableData.name}</div>
            {isHovered && (
              <div className="flex justify-end items-center mx-2">
                <Button
                  icon={<IconEdit />}
                  size="small"
                  theme="solid"
                  style={{
                    backgroundColor: "#2f68ad",
                    opacity: "0.7",
                    marginRight: "6px",
                  }}
                  onClick={() => {
                    if (!layout.sidebar) {
                      setSelectedElement({
                        element: ObjectType.TABLE,
                        id: props.tableData.id,
                        openDialogue: true,
                        openCollapse: false,
                      });
                    } else {
                      setTab(Tab.tables);
                      setSelectedElement({
                        element: ObjectType.TABLE,
                        id: props.tableData.id,
                        openDialogue: false,
                        openCollapse: true,
                      });
                      if (tab !== Tab.tables) return;
                      document
                        .getElementById(`scroll_table_${props.tableData.id}`)
                        .scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                ></Button>
                <Popover
                  content={
                    <div className="text-slate-600">
                      <div className="mb-2">
                        <strong>Comment :</strong>{" "}
                        {props.tableData.comment === "" ? (
                          "No comment"
                        ) : (
                          <div>{props.tableData.comment}</div>
                        )}
                      </div>
                      <div className="text-slate-600">
                        <strong
                          className={`${
                            props.tableData.indices.length === 0 ? "" : "block"
                          }`}
                        >
                          Indices :
                        </strong>{" "}
                        {props.tableData.indices.length === 0 ? (
                          "No indices"
                        ) : (
                          <div>
                            {props.tableData.indices.map((index, k) => (
                              <div
                                className="flex items-center my-1 px-2 py-1 rounded bg-gray-100"
                                key={k}
                              >
                                <i className="fa-solid fa-thumbtack me-2 mt-1 text-slate-500"></i>
                                <div>
                                  {index.fields.map((f) => (
                                    <Tag color="blue" key={f} className="me-1">
                                      {f}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        icon={<IconDeleteStroked />}
                        type="danger"
                        block
                        style={{ marginTop: "8px" }}
                        onClick={() => {
                          Toast.success(`Table deleted!`);
                          deleteTable(props.tableData.id);
                        }}
                      >
                        Delete table
                      </Button>
                    </div>
                  }
                  position="rightTop"
                  showArrow
                  trigger="click"
                  style={{ width: "200px" }}
                >
                  <Button
                    icon={<IconMore />}
                    type="tertiary"
                    size="small"
                    theme="solid"
                    style={{
                      opacity: "0.7",
                    }}
                  ></Button>
                </Popover>
              </div>
            )}
          </div>
          {props.tableData.fields.map((e, i) => {
            return settings.showFieldSummary ? (
              <Popover
                key={i}
                content={
                  <>
                    <div className="flex justify-between items-center pb-2">
                      <p className="me-4 font-bold">{e.name}</p>
                      <p className="ms-4 text-slate-600">{e.type}</p>
                    </div>
                    <hr />
                    {e.primary && (
                      <Tag color="blue" className="me-2 my-2">
                        Primary
                      </Tag>
                    )}
                    {e.unique && (
                      <Tag color="amber" className="me-2 my-2">
                        Unique
                      </Tag>
                    )}
                    {e.notNull && (
                      <Tag color="purple" className="me-2 my-2">
                        Not null
                      </Tag>
                    )}
                    {e.increment && (
                      <Tag color="green" className="me-2 my-2">
                        Increment
                      </Tag>
                    )}
                    <p className="text-slate-600">
                      <strong>Default :</strong>{" "}
                      {e.default === "" ? "Not set" : e.default}
                    </p>
                  </>
                }
                position="right"
                showArrow
              >
                {field(e, i)}
              </Popover>
            ) : (
              field(e, i)
            );
          })}
        </div>
      </foreignObject>
      <SideSheet
        title="Edit table"
        size="small"
        visible={
          selectedElement.element === ObjectType.TABLE &&
          selectedElement.id === props.tableData.id &&
          selectedElement.openDialogue
        }
        onCancel={() =>
          setSelectedElement((prev) => ({
            ...prev,
            openDialogue: !prev.openDialogue,
          }))
        }
        style={{ paddingBottom: "16px" }}
      >
        <div className="flex items-center">
          <div className="text-md font-semibold">Name: </div>
          <Input
            value={props.tableData.name}
            placeholder="Name"
            className="mx-2 mb-1"
            onChange={(value) =>
              updateTable(props.tableData.id, { name: value })
            }
            onFocus={(e) => setEditField({ name: e.target.value })}
            onBlur={(e) => {
              if (e.target.value === editField.name) return;
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "self",
                  tid: props.tableData.id,
                  undo: editField,
                  redo: { name: e.target.value },
                },
              ]);
              setRedoStack([]);
            }}
          />
        </div>
        <div>
          {props.tableData.fields.map((f, j) => (
            <Row gutter={6} key={j} className="hover:bg-slate-100 mt-2">
              <Col span={7}>
                <Input
                  value={f.name}
                  placeholder="Name"
                  onChange={(value) =>
                    updateField(props.tableData.id, j, { name: value })
                  }
                  onFocus={(e) => setEditField({ name: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value === editField.name) return;
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "field",
                        tid: props.tableData.id,
                        fid: j,
                        undo: editField,
                        redo: { name: e.target.value },
                      },
                    ]);
                    setRedoStack([]);
                  }}
                />
              </Col>
              <Col span={8}>
                <Select
                  className="w-full"
                  optionList={sqlDataTypes.map((value, index) => {
                    return {
                      label: value,
                      value: value,
                    };
                  })}
                  filter
                  value={f.type}
                  placeholder="Type"
                  onChange={(value) => {
                    if (value === f.type) return;
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "field",
                        tid: props.tableData.id,
                        fid: j,
                        undo: { type: f.type },
                        redo: { type: value },
                      },
                    ]);
                    setRedoStack([]);
                    updateField(props.tableData.id, j, {
                      type: value,
                      length: value === "VARCHAR" ? 255 : "n/a",
                    });
                  }}
                ></Select>
              </Col>
              <Col span={3}>
                <Button
                  type={f.notNull ? "primary" : "tertiary"}
                  title="Nullable"
                  theme={f.notNull ? "solid" : "light"}
                  onClick={() => {
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "field",
                        tid: props.tableData.id,
                        fid: j,
                        undo: { notNull: f.notNull },
                        redo: { notNull: !f.notNull },
                      },
                    ]);
                    setRedoStack([]);
                    updateField(props.tableData.id, j, { notNull: !f.notNull });
                  }}
                >
                  ?
                </Button>
              </Col>
              <Col span={3}>
                <Button
                  type={f.primary ? "primary" : "tertiary"}
                  title="Primary"
                  theme={f.primary ? "solid" : "light"}
                  onClick={() => {
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "field",
                        tid: props.tableData.id,
                        fid: j,
                        undo: { primary: f.primary },
                        redo: { primary: !f.primary },
                      },
                    ]);
                    setRedoStack([]);
                    updateField(props.tableData.id, j, { primary: !f.primary });
                  }}
                  icon={<IconKeyStroked />}
                ></Button>
              </Col>
              <Col span={3}>
                <Popover
                  content={
                    <div className="px-1 w-[240px]">
                      <div className="font-semibold">Default value</div>
                      <Input
                        className="my-2"
                        placeholder="Set default"
                        value={f.default}
                        disabled={
                          f.type === "BLOB" ||
                          f.type === "JSON" ||
                          f.type === "GEOMETRY" ||
                          f.type === "TEXT" ||
                          f.increment
                        }
                        onChange={(value) =>
                          updateField(props.tableData.id, j, { default: value })
                        }
                        onFocus={(e) =>
                          setEditField({ default: e.target.value })
                        }
                        onBlur={(e) => {
                          if (e.target.value === editField.default) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "field",
                              tid: props.tableData.id,
                              fid: j,
                              undo: editField,
                              redo: { default: e.target.value },
                            },
                          ]);
                          setRedoStack([]);
                        }}
                      />
                      <div className="font-semibold">Length</div>
                      <Input
                        className="my-2"
                        placeholder="Set length"
                        value={f.length}
                        disabled={!(f.type === "VARCHAR")}
                        onChange={(value) =>
                          updateField(props.tableData.id, j, { length: value })
                        }
                        onFocus={(e) =>
                          setEditField({ length: e.target.value })
                        }
                        onBlur={(e) => {
                          if (e.target.value === editField.length) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "field",
                              tid: props.tableData.id,
                              fid: j,
                              undo: editField,
                              redo: { length: e.target.value },
                            },
                          ]);
                          setRedoStack([]);
                        }}
                      />
                      <div className="font-semibold">Check Expression</div>
                      <Input
                        className="my-2"
                        placeholder="Set constraint"
                        value={f.check}
                        onChange={(value) =>
                          updateField(props.tableData.id, j, { check: value })
                        }
                        onFocus={(e) => setEditField({ check: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value === editField.check) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "field",
                              tid: props.tableData.id,
                              fid: j,
                              undo: editField,
                              redo: { check: e.target.value },
                            },
                          ]);
                          setRedoStack([]);
                        }}
                      />
                      <div className="flex justify-between items-center my-3">
                        <div className="font-medium">Unique</div>
                        <Checkbox
                          value="unique"
                          defaultChecked={f.unique}
                          onChange={(checkedValues) => {
                            setUndoStack((prev) => [
                              ...prev,
                              {
                                action: Action.EDIT,
                                element: ObjectType.TABLE,
                                component: "field",
                                tid: props.tableData.id,
                                fid: j,
                                undo: {
                                  [checkedValues.target.value]:
                                    !checkedValues.target.checked,
                                },
                                redo: {
                                  [checkedValues.target.value]:
                                    checkedValues.target.checked,
                                },
                              },
                            ]);
                            setRedoStack([]);
                            updateField(props.tableData.id, j, {
                              [checkedValues.target.value]:
                                checkedValues.target.checked,
                            });
                          }}
                        ></Checkbox>
                      </div>
                      <div className="flex justify-between items-center my-3">
                        <div className="font-medium">Autoincrement</div>
                        <Checkbox
                          value="increment"
                          defaultChecked={f.increment}
                          disabled={
                            !(
                              f.type === "INT" ||
                              f.type === "BIGINT" ||
                              f.type === "SMALLINT"
                            )
                          }
                          onChange={(checkedValues) => {
                            setUndoStack((prev) => [
                              ...prev,
                              {
                                action: Action.EDIT,
                                element: ObjectType.TABLE,
                                component: "field",
                                tid: props.tableData.id,
                                fid: j,
                                undo: {
                                  [checkedValues.target.value]:
                                    !checkedValues.target.checked,
                                },
                                redo: {
                                  [checkedValues.target.value]:
                                    checkedValues.target.checked,
                                },
                              },
                            ]);
                            setRedoStack([]);
                            updateField(props.tableData.id, j, {
                              [checkedValues.target.value]:
                                checkedValues.target.checked,
                            });
                          }}
                        ></Checkbox>
                      </div>
                      <div className="font-semibold">Comment</div>
                      <TextArea
                        className="my-2"
                        label="Comment"
                        placeholder="Add comment"
                        value={f.comment}
                        autosize
                        rows={2}
                        onChange={(value) =>
                          updateField(props.tableData.id, j, { comment: value })
                        }
                        onFocus={(e) =>
                          setEditField({ comment: e.target.value })
                        }
                        onBlur={(e) => {
                          if (e.target.value === editField.comment) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "field",
                              tid: props.tableData.id,
                              fid: j,
                              undo: editField,
                              redo: { comment: e.target.value },
                            },
                          ]);
                          setRedoStack([]);
                        }}
                      />
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
                              component: "field_delete",
                              tid: props.tableData.id,
                              data: f,
                            },
                          ]);
                          setRedoStack([]);
                          updateTable(props.tableData.id, {
                            fields: props.tableData.fields
                              .filter((field) => field.id !== j)
                              .map((e, i) => ({ ...e, id: i })),
                          });
                        }}
                      >
                        Delete field
                      </Button>
                    </div>
                  }
                  trigger="click"
                  position="right"
                  showArrow
                >
                  <Button type="tertiary" icon={<IconMore />}></Button>
                </Popover>
              </Col>
            </Row>
          ))}
          {props.tableData.indices.length > 0 && (
            <Card
              bodyStyle={{ padding: "14px" }}
              style={{ marginTop: "12px", marginBottom: "12px" }}
              headerLine={false}
            >
              <div className="font-medium mb-2 ms-1">Indices</div>
              {props.tableData.indices.map((idx, k) => (
                <div className="flex justify-between items-center mb-2" key={k}>
                  <Select
                    placeholder="Select fields"
                    multiple
                    optionList={props.tableData.fields.map((e) => ({
                      value: e.name,
                      label: e.name,
                    }))}
                    className="w-full"
                    value={idx.fields}
                    onChange={(value) => {
                      setUndoStack((prev) => [
                        ...prev,
                        {
                          action: Action.EDIT,
                          element: ObjectType.TABLE,
                          component: "index",
                          tid: props.tableData.id,
                          iid: k,
                          undo: {
                            fields: [...idx.fields],
                            name: `${idx.fields.join("_")}_index`,
                          },
                          redo: {
                            fields: [...value],
                            name: `${value.join("_")}_index`,
                          },
                        },
                      ]);
                      setRedoStack([]);
                      updateTable(props.tableData.id, {
                        indices: props.tableData.indices.map((index) =>
                          index.id === k
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
                      <div className="px-1">
                        <Input
                          className="my-2"
                          value={idx.name}
                          placeholder="Index name"
                          disabled
                        />
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
                                tid: props.tableData.id,
                                data: idx,
                              },
                            ]);
                            setRedoStack([]);
                            updateTable(props.tableData.id, {
                              indices: props.tableData.indices
                                .filter((e) => e.id !== k)
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
                    ></Button>
                  </Popover>
                </div>
              ))}
            </Card>
          )}
          <Card
            bodyStyle={{ padding: "14px" }}
            style={{ marginTop: "12px", marginBottom: "12px" }}
            headerLine={false}
          >
            <div className="font-medium ms-1 mb-1">Comment</div>
            <TextArea
              value={props.tableData.comment}
              autosize
              placeholder="Add comment"
              rows={1}
              onChange={(value) =>
                updateTable(props.tableData.id, { comment: value }, false)
              }
              onFocus={(e) => setEditField({ comment: e.target.value })}
              onBlur={(e) => {
                if (e.target.value === editField.comment) return;
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "comment",
                    tid: props.tableData.id,
                    undo: editField,
                    redo: { comment: e.target.value },
                  },
                ]);
                setRedoStack([]);
              }}
            />
          </Card>
          <Row gutter={6} className="mt-2">
            <Col span={8}>
              <Popover
                content={
                  <div>
                    <div className="flex justify-between items-center p-2">
                      <div className="font-medium">Theme</div>
                      <Button
                        type="tertiary"
                        size="small"
                        onClick={() => {
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "self",
                              tid: props.tableData.id,
                              undo: { color: props.tableData.color },
                              redo: { color: defaultTableTheme },
                            },
                          ]);
                          setRedoStack([]);
                          updateTable(props.tableData.id, {
                            color: defaultTableTheme,
                          });
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <hr />
                    <div className="py-3">
                      <div>
                        {tableThemes
                          .slice(0, Math.ceil(tableThemes.length / 2))
                          .map((c) => (
                            <button
                              key={c}
                              style={{ backgroundColor: c }}
                              className="p-3 rounded-full mx-1"
                              onClick={() => {
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.TABLE,
                                    component: "self",
                                    tid: props.tableData.id,
                                    undo: { color: props.tableData.color },
                                    redo: { color: c },
                                  },
                                ]);
                                setRedoStack([]);
                                updateTable(props.tableData.id, { color: c });
                              }}
                            >
                              {props.tableData.color === c ? (
                                <IconCheckboxTick style={{ color: "white" }} />
                              ) : (
                                <IconCheckboxTick style={{ color: c }} />
                              )}
                            </button>
                          ))}
                      </div>
                      <div className="mt-3">
                        {tableThemes
                          .slice(Math.ceil(tableThemes.length / 2))
                          .map((c) => (
                            <button
                              key={c}
                              style={{ backgroundColor: c }}
                              className="p-3 rounded-full mx-1"
                              onClick={() => {
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.TABLE,
                                    component: "self",
                                    tid: props.tableData.id,
                                    undo: { color: props.tableData.color },
                                    redo: { color: c },
                                  },
                                ]);
                                setRedoStack([]);
                                updateTable(props.tableData.id, { color: c });
                              }}
                            >
                              <IconCheckboxTick
                                style={{
                                  color:
                                    props.tableData.color === c ? "white" : c,
                                }}
                              />
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                }
                trigger="click"
                position="bottomLeft"
                showArrow
              >
                <Button type="tertiary" icon={<IconColorPalette />}></Button>
              </Popover>
            </Col>
            <Col span={7}>
              <Button
                block
                onClick={() => {
                  setUndoStack((prev) => [
                    ...prev,
                    {
                      action: Action.EDIT,
                      element: ObjectType.TABLE,
                      component: "index_add",
                      tid: props.tableData.id,
                    },
                  ]);
                  setRedoStack([]);
                  updateTable(props.tableData.id, {
                    indices: [
                      ...props.tableData.indices,
                      {
                        id: props.tableData.indices.length,
                        name: `index_${props.tableData.indices.length}`,
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
                      tid: props.tableData.id,
                    },
                  ]);
                  setRedoStack([]);
                  updateTable(props.tableData.id, {
                    fields: [
                      ...props.tableData.fields,
                      {
                        name: "",
                        type: "",
                        default: "",
                        check: "",
                        length: "n/a",
                        primary: false,
                        unique: false,
                        notNull: false,
                        increment: false,
                        comment: "",
                        id: props.tableData.fields.length,
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
                  deleteTable(props.tableData.id);
                }}
              ></Button>
            </Col>
          </Row>
        </div>
      </SideSheet>
    </>
  );

  function field(fieldData, index) {
    return (
      <div
        className={`${
          index === props.tableData.fields.length - 1
            ? ""
            : "border-b border-gray-400"
        } h-[36px] px-2 py-1 flex justify-between`}
        onMouseEnter={() => {
          setHoveredField(index);
          props.setOnRect({
            tableId: props.tableData.id,
            field: index,
          });
        }}
        onMouseLeave={() => {
          setHoveredField(-1);
        }}
      >
        <div className={`${hoveredField === index ? "text-slate-500" : ""}`}>
          <button
            className={`w-[10px] h-[10px] bg-[#2f68ad] opacity-80 z-50 rounded-full me-2`}
            onMouseDown={(ev) => {
              props.handleGripField(index);
              props.setLine((prev) => ({
                ...prev,
                startFieldId: index,
                startTableId: props.tableData.id,
                startX: props.tableData.x + 15,
                startY: props.tableData.y + index * 36 + 50 + 19,
                endX: props.tableData.x + 15,
                endY: props.tableData.y + index * 36 + 50 + 19,
              }));
            }}
          ></button>
          {fieldData.name}
        </div>
        <div className="text-slate-400">
          {hoveredField === index ? (
            <Popconfirm
              title="Are you sure you want to delete this field?"
              content="This modification will be irreversible"
              onConfirm={() => {
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "field_delete",
                    tid: props.tableData.id,
                    data: fieldData,
                  },
                ]);
                setRedoStack([]);
                updateTable(props.tableData.id, {
                  fields: props.tableData.fields
                    .filter((e) => e.id !== fieldData.id)
                    .map((t, i) => ({ ...t, id: i })),
                });
              }}
              onCancel={() => {}}
            >
              <Button
                theme="solid"
                size="small"
                style={{
                  opacity: "0.7",
                  backgroundColor: "#d42020",
                }}
                icon={<IconMinus />}
              ></Button>
            </Popconfirm>
          ) : (
            fieldData.type
          )}
        </div>
      </div>
    );
  }
}
