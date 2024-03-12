import { useState } from "react";
import {
  Action,
  ObjectType,
  defaultTableTheme,
  sqlDataTypes,
  tableThemes,
} from "../data/data";
import {
  Collapse,
  Row,
  Col,
  Input,
  TextArea,
  Button,
  Card,
  TagInput,
  InputNumber,
  Popover,
  Checkbox,
  Select,
  AutoComplete,
  Toast,
  Empty,
} from "@douyinfe/semi-ui";
import {
  IconMore,
  IconKeyStroked,
  IconDeleteStroked,
  IconCheckboxTick,
  IconPlus,
  IconSearch,
} from "@douyinfe/semi-icons";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { getSize, hasCheck, hasPrecision, isSized } from "../utils/toSQL";
import useTables from "../hooks/useTables";
import useUndoRedo from "../hooks/useUndoRedo";
import useSelect from "../hooks/useSelect";
import useTypes from "../hooks/useTypes";

export default function TableOverview() {
  const [indexActiveKey, setIndexActiveKey] = useState("");
  const [value, setValue] = useState("");
  const {
    tables,
    addTable,
    deleteTable,
    updateField,
    updateTable,
    setRelationships,
  } = useTables();
  const { types } = useTypes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const [editField, setEditField] = useState({});
  const [filteredResult, setFilteredResult] = useState(
    tables.map((t) => {
      return t.name;
    })
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      tables
        .map((t) => {
          return t.name;
        })
        .filter((i) => i.includes(value))
    );
  };

  return (
    <>
      <Row gutter={6}>
        <Col span={16}>
          <AutoComplete
            data={filteredResult}
            value={value}
            showClear
            prefix={<IconSearch />}
            placeholder="Search..."
            onSearch={(v) => handleStringSearch(v)}
            emptyContent={
              <div className="p-3 popover-theme">No tables found</div>
            }
            onChange={(v) => setValue(v)}
            onSelect={(v) => {
              const { id } = tables.find((t) => t.name === v);
              setSelectedElement({
                element: ObjectType.TABLE,
                id: id,
                openDialogue: false,
                openCollapse: true,
              });
              document
                .getElementById(`scroll_table_${id}`)
                .scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full"
          />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addTable(true)}>
            Add table
          </Button>
        </Col>
      </Row>
      <Collapse
        activeKey={selectedElement.openCollapse ? `${selectedElement.id}` : ""}
        onChange={(k) =>
          setSelectedElement({
            element: ObjectType.TABLE,
            id: parseInt(k),
            openDialogue: false,
            openCollapse: true,
          })
        }
        accordion
      >
        {tables.length <= 0 ? (
          <div className="select-none mt-2">
            <Empty
              image={
                <IllustrationNoContent style={{ width: 154, height: 154 }} />
              }
              darkModeImage={
                <IllustrationNoContentDark
                  style={{ width: 154, height: 154 }}
                />
              }
              title="No tables"
              description="Start building your diagram!"
            />
          </div>
        ) : (
          tables.map((t, i) => (
            <div id={`scroll_table_${t.id}`} key={t.id}>
              <Collapse.Panel header={<div>{t.name}</div>} itemKey={`${t.id}`}>
                <div className="flex items-center mb-2.5">
                  <div className="text-md font-semibold">Name: </div>
                  <Input
                    value={t.name}
                    validateStatus={t.name === "" ? "error" : "default"}
                    placeholder="Name"
                    className="ms-2"
                    onChange={(value) => updateTable(t.id, { name: value })}
                    onFocus={(e) => setEditField({ name: e.target.value })}
                    onBlur={(e) => {
                      if (e.target.value === editField.name) return;
                      setUndoStack((prev) => [
                        ...prev,
                        {
                          action: Action.EDIT,
                          element: ObjectType.TABLE,
                          component: "self",
                          tid: t.id,
                          undo: editField,
                          redo: { name: e.target.value },
                          message: `Edit table name to ${e.target.value}`,
                        },
                      ]);
                      setRedoStack([]);
                    }}
                  />
                </div>
                {t.fields.map((f, j) => (
                  <Row gutter={6} key={j} className="hover-1 my-2">
                    <Col span={7}>
                      <Input
                        value={f.name}
                        validateStatus={f.name === "" ? "error" : "default"}
                        placeholder="Name"
                        onChange={(value) => updateField(i, j, { name: value })}
                        onFocus={(e) => setEditField({ name: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value === editField.name) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "field",
                              tid: i,
                              fid: j,
                              undo: editField,
                              redo: { name: e.target.value },
                              message: `Edit table field name to ${e.target.value}`,
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
                              tid: i,
                              fid: j,
                              undo: { type: f.type },
                              redo: { type: value },
                              message: `Edit table field type to ${value}`,
                            },
                          ]);
                          setRedoStack([]);
                          const incr =
                            f.increment &&
                            (value === "INT" ||
                              value === "BIGINT" ||
                              value === "SMALLINT");
                          if (value === "ENUM" || value === "SET") {
                            updateField(i, j, {
                              type: value,
                              default: "",
                              values: f.values ? [...f.values] : [],
                              increment: incr,
                            });
                          } else if (isSized(value) || hasPrecision(value)) {
                            updateField(i, j, {
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
                            updateField(t.id, j, {
                              type: value,
                              increment: incr,
                              default: "",
                              size: "",
                              values: [],
                            });
                          } else if (hasCheck(value)) {
                            updateField(i, j, {
                              type: value,
                              check: "",
                              increment: incr,
                            });
                          } else {
                            updateField(i, j, {
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
                              tid: i,
                              fid: j,
                              undo: { notNull: f.notNull },
                              redo: { notNull: !f.notNull },
                              message: `Edit table field to${
                                f.notNull ? "" : " not"
                              } null`,
                            },
                          ]);
                          setRedoStack([]);
                          updateField(i, j, { notNull: !f.notNull });
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
                              tid: i,
                              fid: j,
                              undo: { primary: f.primary },
                              redo: { primary: !f.primary },
                              message: `Edit table field to${
                                f.primary ? " not" : ""
                              } primary`,
                            },
                          ]);
                          setRedoStack([]);
                          updateField(i, j, { primary: !f.primary });
                        }}
                        icon={<IconKeyStroked />}
                      ></Button>
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
                                updateField(i, j, { default: value })
                              }
                              onFocus={(e) =>
                                setEditField({ default: e.target.value })
                              }
                              onBlur={(e) => {
                                if (e.target.value === editField.default)
                                  return;
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.TABLE,
                                    component: "field",
                                    tid: i,
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
                                    updateField(i, j, { values: v })
                                  }
                                  onFocus={() =>
                                    setEditField({ values: f.values })
                                  }
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
                                        tid: i,
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
                                    updateField(i, j, { size: value })
                                  }
                                  onFocus={(e) =>
                                    setEditField({ size: e.target.value })
                                  }
                                  onBlur={(e) => {
                                    if (e.target.value === editField.size)
                                      return;
                                    setUndoStack((prev) => [
                                      ...prev,
                                      {
                                        action: Action.EDIT,
                                        element: ObjectType.TABLE,
                                        component: "field",
                                        tid: i,
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
                                    updateField(i, j, { size: value })
                                  }
                                  onFocus={(e) =>
                                    setEditField({ size: e.target.value })
                                  }
                                  onBlur={(e) => {
                                    if (e.target.value === editField.size)
                                      return;
                                    setUndoStack((prev) => [
                                      ...prev,
                                      {
                                        action: Action.EDIT,
                                        element: ObjectType.TABLE,
                                        component: "field",
                                        tid: i,
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
                                <div className="font-semibold">
                                  Check Expression
                                </div>
                                <Input
                                  className="mt-2"
                                  placeholder="Set constraint"
                                  value={f.check}
                                  disabled={f.increment}
                                  onChange={(value) =>
                                    updateField(i, j, { check: value })
                                  }
                                  onFocus={(e) =>
                                    setEditField({ check: e.target.value })
                                  }
                                  onBlur={(e) => {
                                    if (e.target.value === editField.check)
                                      return;
                                    setUndoStack((prev) => [
                                      ...prev,
                                      {
                                        action: Action.EDIT,
                                        element: ObjectType.TABLE,
                                        component: "field",
                                        tid: i,
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
                                      tid: i,
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
                                  updateField(i, j, {
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
                                      tid: i,
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
                                        f.increment ? " not" : ""
                                      } auto increment`,
                                    },
                                  ]);
                                  setRedoStack([]);
                                  updateField(i, j, {
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
                                updateField(i, j, { comment: value })
                              }
                              onFocus={(e) =>
                                setEditField({ comment: e.target.value })
                              }
                              onBlur={(e) => {
                                if (e.target.value === editField.comment)
                                  return;
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.TABLE,
                                    component: "field",
                                    tid: i,
                                    fid: j,
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
                              onClick={() => {
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.TABLE,
                                    component: "field_delete",
                                    tid: t.id,
                                    data: f,
                                    message: `Delete field`,
                                  },
                                ]);
                                setRedoStack([]);
                                setRelationships((prev) =>
                                  prev
                                    .filter(
                                      (e) =>
                                        !(
                                          (e.startTableId === t.id &&
                                            e.startFieldId === j) ||
                                          (e.endTableId === t.id &&
                                            e.endFieldId === j)
                                        )
                                    )
                                    .map((e, i) => ({ ...e, id: i }))
                                );
                                setRelationships((prev) => {
                                  return prev.map((e) => {
                                    if (
                                      e.startTableId === t.id &&
                                      e.startFieldId > f.id
                                    ) {
                                      return {
                                        ...e,
                                        startFieldId: e.startFieldId - 1,
                                        startX: t.x + 15,
                                        startY:
                                          t.y +
                                          (e.startFieldId - 1) * 36 +
                                          50 +
                                          19,
                                      };
                                    }
                                    if (
                                      e.endTableId === t.id &&
                                      e.endFieldId > f.id
                                    ) {
                                      return {
                                        ...e,
                                        endFieldId: e.endFieldId - 1,
                                        endX: t.x + 15,
                                        endY:
                                          t.y +
                                          (e.endFieldId - 1) * 36 +
                                          50 +
                                          19,
                                      };
                                    }
                                    return e;
                                  });
                                });
                                updateTable(i, {
                                  fields: t.fields
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
                {t.indices.length > 0 && (
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
                        {t.indices.map((idx, k) => (
                          <div
                            className="flex justify-between items-center mb-2"
                            key={k}
                          >
                            <Select
                              placeholder="Select fields"
                              multiple
                              validateStatus={
                                idx.fields.length === 0 ? "error" : "default"
                              }
                              optionList={t.fields.map((e) => ({
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
                                    tid: i,
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
                                updateTable(i, {
                                  indices: t.indices.map((index) =>
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
                                  <div className="font-semibold mb-1">
                                    Index name:{" "}
                                  </div>
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
                                            tid: i,
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
                                        updateTable(i, {
                                          indices: t.indices.map((index) =>
                                            index.id === k
                                              ? {
                                                  ...index,
                                                  [checkedValues.target.value]:
                                                    checkedValues.target
                                                      .checked,
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
                                          tid: t.id,
                                          data: idx,
                                          message: `Delete index`,
                                        },
                                      ]);
                                      setRedoStack([]);
                                      updateTable(i, {
                                        indices: t.indices
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
                        value={t.comment}
                        autosize
                        placeholder="Add comment"
                        rows={1}
                        onChange={(value) =>
                          updateTable(i, { comment: value }, false)
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
                              component: "self",
                              tid: i,
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
                                    tid: i,
                                    undo: { color: t.color },
                                    redo: { color: defaultTableTheme },
                                    message: `Edit table color to default`,
                                  },
                                ]);
                                setRedoStack([]);
                                updateTable(i, { color: defaultTableTheme });
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
                                          tid: i,
                                          undo: { color: t.color },
                                          redo: { color: c },
                                          message: `Edit table color to ${c}`,
                                        },
                                      ]);
                                      setRedoStack([]);
                                      updateTable(i, { color: c });
                                    }}
                                  >
                                    {t.color === c ? (
                                      <IconCheckboxTick
                                        style={{ color: "white" }}
                                      />
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
                                          tid: i,
                                          undo: { color: t.color },
                                          redo: { color: c },
                                          message: `Edit table color to ${c}`,
                                        },
                                      ]);
                                      setRedoStack([]);
                                      updateTable(i, { color: c });
                                    }}
                                  >
                                    <IconCheckboxTick
                                      style={{
                                        color: t.color === c ? "white" : c,
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
                        className="h-[32px] w-[32px] rounded mb-2"
                        style={{ backgroundColor: t.color }}
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
                            tid: t.id,
                            message: `Add index`,
                          },
                        ]);
                        setRedoStack([]);
                        updateTable(i, {
                          indices: [
                            ...t.indices,
                            {
                              id: t.indices.length,
                              name: `index_${t.indices.length}`,
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
                            tid: t.id,
                            message: `Add field`,
                          },
                        ]);
                        setRedoStack([]);
                        updateTable(i, {
                          fields: [
                            ...t.fields,
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
                              id: t.fields.length,
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
                        deleteTable(i);
                      }}
                    ></Button>
                  </Col>
                </Row>
              </Collapse.Panel>
            </div>
          ))
        )}
      </Collapse>
    </>
  );
}
