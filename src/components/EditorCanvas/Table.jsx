import { useState } from "react";
import {
  sqlDataTypes,
  tableThemes,
  defaultBlue,
  Tab,
  Action,
  ObjectType,
} from "../../data/constants";
import {
  IconEdit,
  IconMore,
  IconMinus,
  IconDeleteStroked,
  IconKeyStroked,
  IconCheckboxTick,
} from "@douyinfe/semi-icons";
import {
  Select,
  Input,
  TextArea,
  Card,
  Checkbox,
  InputNumber,
  TagInput,
  Row,
  Col,
  Popover,
  Tag,
  Button,
  SideSheet,
  Toast,
} from "@douyinfe/semi-ui";
import { getSize, hasCheck, hasPrecision, isSized } from "../../utils/toSQL";
import useLayout from "../../hooks/useLayout";
import useSettings from "../../hooks/useSettings";
import useUndoRedo from "../../hooks/useUndoRedo";
import useTables from "../../hooks/useTables";
import useSelect from "../../hooks/useSelect";
import useTypes from "../../hooks/useTypes";

export default function Table(props) {
  const [hoveredField, setHoveredField] = useState(-1);
  const [editField, setEditField] = useState({});
  const { layout } = useLayout();
  const { deleteTable, updateTable, updateField, setRelationships } =
    useTables();
  const { settings } = useSettings();
  const { types } = useTypes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  const height = props.tableData.fields.length * 36 + 50 + 7;

  return (
    <>
      <foreignObject
        key={props.tableData.id}
        x={props.tableData.x}
        y={props.tableData.y}
        width={200}
        height={height}
        className="group drop-shadow-lg rounded-md cursor-move"
        onMouseDown={props.onMouseDown}
      >
        <div
          className={`border-2 hover:border-dashed hover:border-blue-500
               select-none rounded-lg w-full ${
                 settings.mode === "light"
                   ? "bg-zinc-100 text-zinc-800"
                   : "bg-zinc-800 text-zinc-200"
               } ${
            selectedElement.id === props.tableData.id &&
            selectedElement.element === ObjectType.TABLE
              ? "border-solid border-blue-500"
              : "border-zinc-500"
          }`}
        >
          <div
            className="h-[10px] w-full rounded-t-md"
            style={{ backgroundColor: props.tableData.color }}
          />
          <div
            className={`overflow-hidden font-bold h-[40px] flex justify-between items-center border-b border-gray-400 ${
              settings.mode === "light" ? "bg-zinc-200" : "bg-zinc-900"
            }`}
          >
            <div className="px-3 overflow-hidden text-ellipsis whitespace-nowrap">
              {props.tableData.name}
            </div>
            <div className="invisible group-hover:visible flex justify-end items-center mx-2">
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
                    setSelectedElement((prev) => ({
                      ...prev,
                      element: ObjectType.TABLE,
                      id: props.tableData.id,
                      open: true,
                    }));
                  } else {
                    setSelectedElement((prev) => ({
                      ...prev,
                      currentTab: Tab.TABLES,
                      element: ObjectType.TABLE,
                      id: props.tableData.id,
                      open: true,
                    }));
                    if (selectedElement.currentTab !== Tab.TABLES) return;
                    document
                      .getElementById(`scroll_table_${props.tableData.id}`)
                      .scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
              <Popover
                content={
                  <div className="popover-theme">
                    <div className="mb-2">
                      <strong>Comment :</strong>{" "}
                      {props.tableData.comment === "" ? (
                        "No comment"
                      ) : (
                        <div>{props.tableData.comment}</div>
                      )}
                    </div>
                    <div>
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
                              key={k}
                              className={`flex items-center my-1 px-2 py-1 rounded ${
                                settings.mode === "light"
                                  ? "bg-gray-100"
                                  : "bg-zinc-800"
                              }`}
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
                  style={{
                    opacity: "0.7",
                    backgroundColor: "grey",
                    color: "white",
                  }}
                />
              </Popover>
            </div>
          </div>
          {props.tableData.fields.map((e, i) => {
            return settings.showFieldSummary ? (
              <Popover
                key={i}
                content={
                  <div className="popover-theme">
                    <div className="flex justify-between items-center pb-2">
                      <p className="me-4 font-bold">{e.name}</p>
                      <p className="ms-4">{e.type}</p>
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
                    <p>
                      <strong>Default :</strong>{" "}
                      {e.default === "" ? "Not set" : e.default}
                    </p>
                  </div>
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
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() =>
          setSelectedElement((prev) => ({
            ...prev,
            open: !prev.open,
          }))
        }
        style={{ paddingBottom: "16px" }}
      >
        <div className="flex items-center sidesheet-theme">
          <div className="text-md font-semibold">Name: </div>
          <Input
            value={props.tableData.name}
            validateStatus={props.tableData.name === "" ? "error" : "default"}
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
                  message: `Edit table name to ${e.target.value}`,
                },
              ]);
              setRedoStack([]);
            }}
          />
        </div>
        <div>
          {props.tableData.fields.map((f, j) => (
            <Row gutter={6} key={j} className="hover-2 mt-2">
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
                        message: `Edit table field name to "${e.target.value}"`,
                      },
                    ]);
                    setRedoStack([]);
                  }}
                />
              </Col>
              <Col span={8}>
                <Select
                  className="w-full"
                  optionList={[
                    ...sqlDataTypes.map((value) => ({
                      label: value,
                      value: value,
                    })),
                    ...types.map((type) => ({
                      label: type.name.toUpperCase(),
                      value: type.name.toUpperCase(),
                    })),
                  ]}
                  filter
                  value={f.type}
                  validateStatus={f.type === "" ? "error" : "default"}
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
                        message: `Edit table field type to "${value}"`,
                      },
                    ]);
                    setRedoStack([]);
                    const incr =
                      f.increment &&
                      (value === "INT" ||
                        value === "BIGINT" ||
                        value === "SMALLINT");
                    if (value === "ENUM" || value === "SET") {
                      updateField(props.tableData.id, j, {
                        type: value,
                        default: "",
                        values: f.values ? [...f.values] : [],
                        increment: incr,
                      });
                    } else if (isSized(value) || hasPrecision(value)) {
                      updateField(props.tableData.id, j, {
                        type: value,
                        size: getSize(value),
                        increment: incr,
                      });
                    } else if (
                      value === "BLOB" ||
                      value === "JSON" ||
                      value === "UUID" ||
                      value === "TEXT" ||
                      incr
                    ) {
                      updateField(props.tableData.id, j, {
                        type: value,
                        increment: incr,
                        default: "",
                        size: "",
                        values: [],
                      });
                    } else if (hasCheck(value)) {
                      updateField(props.tableData.id, j, {
                        type: value,
                        check: "",
                        increment: incr,
                      });
                    } else {
                      updateField(props.tableData.id, j, {
                        type: value,
                        increment: incr,
                        size: "",
                        values: [],
                      });
                    }
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
                        message: `Edit table field to${
                          f.notNull ? "" : " not"
                        } null`,
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
                        message: `Edit table field to${
                          f.primary ? " not" : ""
                        } primary`,
                      },
                    ]);
                    setRedoStack([]);
                    updateField(props.tableData.id, j, { primary: !f.primary });
                  }}
                  icon={<IconKeyStroked />}
                />
              </Col>
              <Col span={3}>
                <Popover
                  content={
                    <div className="px-1 w-[240px] popover-theme">
                      <div className="font-semibold">Default value</div>
                      <Input
                        className="my-2"
                        placeholder="Set default"
                        value={f.default}
                        disabled={
                          f.type === "BLOB" ||
                          f.type === "JSON" ||
                          f.type === "TEXT" ||
                          f.type === "UUID" ||
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
                              message: `Edit table field default to ${e.target.value}`,
                            },
                          ]);
                          setRedoStack([]);
                        }}
                      />
                      {(f.type === "ENUM" || f.type === "SET") && (
                        <>
                          <div className="font-semibold mb-1">
                            {f.type} values
                          </div>
                          <TagInput
                            separator={[",", ", ", " ,"]}
                            value={f.values}
                            validateStatus={
                              !f.values || f.values.length === 0
                                ? "error"
                                : "default"
                            }
                            className="my-2"
                            placeholder="Use ',' for batch input"
                            onChange={(v) =>
                              updateField(props.tableData.id, j, {
                                values: v,
                              })
                            }
                            onFocus={() => setEditField({ values: f.values })}
                            onBlur={() => {
                              if (
                                JSON.stringify(editField.values) ===
                                JSON.stringify(f.values)
                              )
                                return;
                              setUndoStack((prev) => [
                                ...prev,
                                {
                                  action: Action.EDIT,
                                  element: ObjectType.TABLE,
                                  component: "field",
                                  tid: props.tableData.id,
                                  fid: j,
                                  undo: editField,
                                  redo: { values: f.values },
                                  message: `Edit table field values to "${JSON.stringify(
                                    f.values
                                  )}"`,
                                },
                              ]);
                              setRedoStack([]);
                            }}
                          />
                        </>
                      )}
                      {isSized(f.type) && (
                        <>
                          <div className="font-semibold">Size</div>
                          <InputNumber
                            className="my-2 w-full"
                            placeholder="Set length"
                            value={f.size}
                            onChange={(value) =>
                              updateField(props.tableData.id, j, {
                                size: value,
                              })
                            }
                            onFocus={(e) =>
                              setEditField({ size: e.target.value })
                            }
                            onBlur={(e) => {
                              if (e.target.value === editField.size) return;
                              setUndoStack((prev) => [
                                ...prev,
                                {
                                  action: Action.EDIT,
                                  element: ObjectType.TABLE,
                                  component: "field",
                                  tid: props.tableData.id,
                                  fid: j,
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
                      {hasPrecision(f.type) && (
                        <>
                          <div className="font-semibold">Precision</div>
                          <Input
                            className="my-2 w-full"
                            placeholder="Set precision: (size, d)"
                            validateStatus={
                              /^\(\d+,\s*\d+\)$|^$/.test(f.size)
                                ? "default"
                                : "error"
                            }
                            value={f.size}
                            onChange={(value) =>
                              updateField(props.tableData.id, j, {
                                size: value,
                              })
                            }
                            onFocus={(e) =>
                              setEditField({ size: e.target.value })
                            }
                            onBlur={(e) => {
                              if (e.target.value === editField.size) return;
                              setUndoStack((prev) => [
                                ...prev,
                                {
                                  action: Action.EDIT,
                                  element: ObjectType.TABLE,
                                  component: "field",
                                  tid: props.tableData.id,
                                  fid: j,
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
                      {hasCheck(f.type) && (
                        <>
                          <div className="font-semibold">Check Expression</div>
                          <Input
                            className="my-2"
                            placeholder="Set constraint"
                            value={f.check}
                            disabled={f.increment}
                            onChange={(value) =>
                              updateField(props.tableData.id, j, {
                                check: value,
                              })
                            }
                            onFocus={(e) =>
                              setEditField({ check: e.target.value })
                            }
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
                                  message: `Edit table field check expression to ${e.target.value}`,
                                },
                              ]);
                              setRedoStack([]);
                            }}
                          />
                          <div className="text-xs mt-1">
                            *This will be in the script as is.
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center my-3">
                        <div className="font-medium">Unique</div>
                        <Checkbox
                          value="unique"
                          checked={f.unique}
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
                                message: `Edit table field to${
                                  f.unique ? " not" : ""
                                } unique`,
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
                          checked={f.increment}
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
                                message: `Edit table field to${
                                  f.primary ? " not" : ""
                                } auto increment`,
                              },
                            ]);
                            setRedoStack([]);
                            updateField(props.tableData.id, j, {
                              increment: !f.increment,
                              check: f.increment ? f.check : "",
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
                              message: `Edit table field comment to ${e.target.value}`,
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
                              message: `Delete field`,
                            },
                          ]);
                          setRedoStack([]);
                          setRelationships((prev) => {
                            return prev.map((e) => {
                              if (
                                e.startTableId === props.tableData.id &&
                                e.startFieldId > f.id
                              ) {
                                return {
                                  ...e,
                                  startFieldId: e.startFieldId - 1,
                                  startX: props.tableData.x + 15,
                                  startY:
                                    props.tableData.y +
                                    (e.startFieldId - 1) * 36 +
                                    50 +
                                    19,
                                };
                              }
                              if (
                                e.endTableId === props.tableData.id &&
                                e.endFieldId > f.id
                              ) {
                                return {
                                  ...e,
                                  endFieldId: e.endFieldId - 1,
                                  endX: props.tableData.x + 15,
                                  endY:
                                    props.tableData.y +
                                    (e.endFieldId - 1) * 36 +
                                    50 +
                                    19,
                                };
                              }
                              return e;
                            });
                          });
                          updateTable(props.tableData.id, {
                            fields: props.tableData.fields
                              .filter((field) => field.id !== j)
                              .map((e, k) => ({ ...e, id: k })),
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
                  <Button type="tertiary" icon={<IconMore />} />
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
                    validateStatus={
                      idx.fields.length === 0 ? "error" : "default"
                    }
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
                          message: `Edit index fields to "${JSON.stringify(
                            value
                          )}"`,
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
                      <div className="px-1 popover-theme">
                        <div className="font-semibold mb-1">Index name: </div>
                        <Input
                          value={idx.name}
                          placeholder="Index name"
                          disabled
                        />
                        <div className="flex justify-between items-center my-3">
                          <div className="font-medium">Unique</div>
                          <Checkbox
                            value="unique"
                            checked={idx.unique}
                            onChange={(checkedValues) => {
                              setUndoStack((prev) => [
                                ...prev,
                                {
                                  action: Action.EDIT,
                                  element: ObjectType.TABLE,
                                  component: "index",
                                  tid: props.tableData.id,
                                  iid: k,
                                  undo: {
                                    [checkedValues.target.value]:
                                      !checkedValues.target.checked,
                                  },
                                  redo: {
                                    [checkedValues.target.value]:
                                      checkedValues.target.checked,
                                  },
                                  message: `Edit table field to${
                                    idx.unique ? " not" : ""
                                  } unique`,
                                },
                              ]);
                              setRedoStack([]);
                              updateTable(props.tableData.id, {
                                indices: props.tableData.indices.map((index) =>
                                  index.id === k
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
                                tid: props.tableData.id,
                                data: idx,
                                message: `Delete index`,
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
                    />
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
                    component: "self",
                    tid: props.tableData.id,
                    undo: editField,
                    redo: { comment: e.target.value },
                    message: `Edit table comment to "${e.target.value}"`,
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
                    <div className="flex justify-between items-center p-2 popover-theme">
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
                              redo: { color: defaultBlue },
                              message: `Edit table color to default`,
                            },
                          ]);
                          setRedoStack([]);
                          updateTable(props.tableData.id, {
                            color: defaultBlue,
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
                                    message: `Edit table color to ${c}`,
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
                                    message: `Edit table color to ${c}`,
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
                <div
                  className="h-[32px] w-[32px] rounded"
                  style={{ backgroundColor: props.tableData.color }}
                />
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
                      message: `Add index`,
                    },
                  ]);
                  setRedoStack([]);
                  updateTable(props.tableData.id, {
                    indices: [
                      ...props.tableData.indices,
                      {
                        id: props.tableData.indices.length,
                        name: `index_${props.tableData.indices.length}`,
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
                      tid: props.tableData.id,
                      message: `Add field`,
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
              />
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
          index === props.tableData.fields.length - 1 ||
          "border-b border-gray-400"
        } h-[36px] px-2 py-1 flex justify-between items-center gap-1 w-full overflow-hidden`}
        onMouseEnter={() => {
          setHoveredField(index);
          props.setHoveredTable({
            tableId: props.tableData.id,
            field: index,
          });
        }}
        onMouseLeave={() => {
          setHoveredField(-1);
        }}
      >
        <div
          className={`${
            hoveredField === index ? "text-zinc-400" : ""
          } flex items-center gap-2 overflow-hidden`}
        >
          <button
            className="flex-shrink-0 w-[10px] h-[10px] bg-[#2f68ad] opacity-80 z-50 rounded-full"
            onMouseDown={() => {
              props.handleGripField(index);
              props.setLinkingLine((prev) => ({
                ...prev,
                startFieldId: index,
                startTableId: props.tableData.id,
                startX: props.tableData.x + 15,
                startY: props.tableData.y + index * 36 + 50 + 19,
                endX: props.tableData.x + 15,
                endY: props.tableData.y + index * 36 + 50 + 19,
              }));
            }}
          />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {fieldData.name}
          </span>
        </div>
        <div className="text-zinc-400">
          {hoveredField === index ? (
            <Button
              theme="solid"
              size="small"
              style={{
                opacity: "0.7",
                backgroundColor: "#d42020",
              }}
              icon={<IconMinus />}
              onClick={() => {
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "field_delete",
                    tid: props.tableData.id,
                    data: fieldData,
                    message: `Delete field`,
                  },
                ]);
                setRedoStack([]);
                setRelationships((prev) =>
                  prev
                    .filter(
                      (e) =>
                        !(
                          (e.startTableId === props.tableData.id &&
                            e.startFieldId === index) ||
                          (e.endTableId === props.tableData.id &&
                            e.endFieldId === index)
                        )
                    )
                    .map((e, i) => ({ ...e, id: i }))
                );
                setRelationships((prev) => {
                  return prev.map((e) => {
                    if (
                      e.startTableId === props.tableData.id &&
                      e.startFieldId > fieldData.id
                    ) {
                      return {
                        ...e,
                        startFieldId: e.startFieldId - 1,
                        startX: props.tableData.x + 15,
                        startY:
                          props.tableData.y +
                          (e.startFieldId - 1) * 36 +
                          50 +
                          19,
                      };
                    }
                    if (
                      e.endTableId === props.tableData.id &&
                      e.endFieldId > fieldData.id
                    ) {
                      return {
                        ...e,
                        endFieldId: e.endFieldId - 1,
                        endX: props.tableData.x + 15,
                        endY:
                          props.tableData.y + (e.endFieldId - 1) * 36 + 50 + 19,
                      };
                    }
                    return e;
                  });
                });
                updateTable(props.tableData.id, {
                  fields: props.tableData.fields
                    .filter((e) => e.id !== fieldData.id)
                    .map((t, i) => {
                      return { ...t, id: i };
                    }),
                });
              }}
            />
          ) : (
            <div className="flex gap-1 items-center">
              {fieldData.primary && <IconKeyStroked />}
              <span>{fieldData.type}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
