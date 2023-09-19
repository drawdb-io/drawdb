import { React, useContext, useState } from "react";
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
import { TableContext, UndoRedoContext } from "../pages/editor";

export default function TableOverview(props) {
  const [indexActiveKey, setIndexActiveKey] = useState("");
  const [value, setValue] = useState("");
  const { tables, setTables, addTable, deleteTable, updateField } =
    useContext(TableContext);
  const { setUndoStack, setRedoStack } = useContext(UndoRedoContext);
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

  const updateTable = (tid, updatedValues) => {
    setTables((prev) =>
      prev.map((table, i) => {
        if (tid === i) {
          return {
            ...table,
            ...updatedValues,
          };
        }
        return table;
      })
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
            emptyContent={<div className="p-3">No tables found</div>}
            onSearch={(v) => handleStringSearch(v)}
            onChange={(v) => setValue(v)}
            onSelect={(v) => {
              const { id } = tables.find((t) => t.name === v);
              props.setSelectedTable(`${id}`);
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
        activeKey={props.selectedTable}
        onChange={(k) => props.setSelectedTable(k)}
        accordion
      >
        {tables.length <= 0 ? (
          <div className="select-none">
            <Empty
              image={
                <IllustrationNoContent style={{ width: 160, height: 160 }} />
              }
              darkModeImage={
                <IllustrationNoContentDark
                  style={{ width: 160, height: 160 }}
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
                {t.fields.map((f, j) => (
                  <Row
                    type="flex"
                    justify="start"
                    align="middle"
                    gutter={6}
                    key={j}
                    className="hover:bg-slate-100 mb-2"
                  >
                    <Col span={7}>
                      <Input
                        field="name"
                        value={f.name}
                        className="m-0"
                        placeholder="Name"
                        onChange={(value) => updateField(i, j, { name: value })}
                        onFocus={(e) =>
                          setEditField({
                            tid: i,
                            fid: j,
                            values: { name: e.target.value },
                          })
                        }
                        onBlur={(e) => {
                          if (e.target.value === editField.name) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "field",
                              data: {
                                undo: editField,
                                redo: {
                                  tid: i,
                                  fid: j,
                                  values: { name: e.target.value },
                                },
                              },
                            },
                          ]);
                          setRedoStack([]);
                          setEditField({});
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
                              data: {
                                undo: {
                                  tid: i,
                                  fid: j,
                                  values: { type: f.type },
                                },
                                redo: {
                                  tid: i,
                                  fid: j,
                                  values: { type: value },
                                },
                              },
                            },
                          ]);
                          setRedoStack([]);
                          setEditField({});
                          updateField(i, j, { type: value });
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
                              data: {
                                undo: {
                                  tid: i,
                                  fid: j,
                                  values: { notNull: f.notNull },
                                },
                                redo: {
                                  tid: i,
                                  fid: j,
                                  values: { notNull: !f.notNull },
                                },
                              },
                            },
                          ]);
                          setRedoStack([]);
                          setEditField({});
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
                              data: {
                                undo: {
                                  tid: i,
                                  fid: j,
                                  values: { primary: f.primary },
                                },
                                redo: {
                                  tid: i,
                                  fid: j,
                                  values: { primary: !f.primary },
                                },
                              },
                            },
                          ]);
                          setRedoStack([]);
                          setEditField({});
                          updateField(i, j, { primary: !f.primary });
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
                              onChange={(value) =>
                                updateField(i, j, { default: value })
                              }
                              onFocus={(e) =>
                                setEditField({
                                  tid: i,
                                  fid: j,
                                  values: { default: e.target.value },
                                })
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
                                    data: {
                                      undo: editField,
                                      redo: {
                                        tid: i,
                                        fid: j,
                                        values: { default: e.target.value },
                                      },
                                    },
                                  },
                                ]);
                                setRedoStack([]);
                                setEditField({});
                              }}
                            />
                            <div className="font-semibold">
                              Check Expression
                            </div>
                            <Input
                              className="my-2"
                              placeholder="Set constraint"
                              value={f.check}
                              onChange={(value) =>
                                updateField(i, j, { check: value })
                              }
                              onFocus={(e) =>
                                setEditField({
                                  tid: i,
                                  fid: j,
                                  values: { check: e.target.value },
                                })
                              }
                              onBlur={(e) => {
                                if (e.target.value === editField.check) return;
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.TABLE,
                                    component: "field",
                                    data: {
                                      undo: editField,
                                      redo: {
                                        tid: i,
                                        fid: j,
                                        values: { check: e.target.value },
                                      },
                                    },
                                  },
                                ]);
                                setRedoStack([]);
                                setEditField({});
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
                                      data: {
                                        undo: {
                                          tid: i,
                                          fid: j,
                                          values: {
                                            [checkedValues.target.value]:
                                              !checkedValues.target.checked,
                                          },
                                        },
                                        redo: {
                                          tid: i,
                                          fid: j,
                                          values: {
                                            [checkedValues.target.value]:
                                              checkedValues.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  ]);
                                  setRedoStack([]);
                                  setEditField({});
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
                                defaultChecked={f.increment}
                                onChange={(checkedValues) => {
                                  setUndoStack((prev) => [
                                    ...prev,
                                    {
                                      action: Action.EDIT,
                                      element: ObjectType.TABLE,
                                      component: "field",
                                      data: {
                                        undo: {
                                          tid: i,
                                          fid: j,
                                          values: {
                                            [checkedValues.target.value]:
                                              !checkedValues.target.checked,
                                          },
                                        },
                                        redo: {
                                          tid: i,
                                          fid: j,
                                          values: {
                                            [checkedValues.target.value]:
                                              checkedValues.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  ]);
                                  setRedoStack([]);
                                  setEditField({});
                                  updateField(i, j, {
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
                                updateField(i, j, { comment: value })
                              }
                              onFocus={(e) =>
                                setEditField({
                                  tid: i,
                                  fid: j,
                                  values: { comment: e.target.value },
                                })
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
                                    data: {
                                      undo: editField,
                                      redo: {
                                        tid: i,
                                        fid: j,
                                        values: { comment: e.target.value },
                                      },
                                    },
                                  },
                                ]);
                                setRedoStack([]);
                                setEditField({});
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
                                  },
                                ]);
                                setRedoStack([]);
                                setTables((prev) =>
                                  prev.map((table) => {
                                    if (table.id === i) {
                                      return {
                                        ...table,
                                        fields: table.fields.filter(
                                          (field, k) => k !== j
                                        ),
                                      };
                                    }
                                    return table;
                                  })
                                );
                              }}
                            >
                              Delete field
                            </Button>
                          </div>
                        }
                        trigger="click"
                        position="rightTop"
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
                                      values: {
                                        fields: [...idx.fields],
                                        name: `${idx.fields.join("_")}_index`,
                                      },
                                    },
                                    redo: {
                                      values: {
                                        fields: [...value],
                                        name: `${value.join("_")}_index`,
                                      },
                                    },
                                  },
                                ]);
                                setRedoStack([]);
                                setEditField({});
                                setTables((prev) =>
                                  prev.map((table, i) => {
                                    if (table.id === i) {
                                      return {
                                        ...table,
                                        indices: table.indices.map((index) =>
                                          index.id === k
                                            ? {
                                                ...index,
                                                fields: [...value],
                                                name: `${value.join(
                                                  "_"
                                                )}_index`,
                                              }
                                            : index
                                        ),
                                      };
                                    }
                                    return table;
                                  })
                                );
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
                                          tid: t.id,
                                          data: idx,
                                        },
                                      ]);
                                      setRedoStack([]);
                                      setTables((prev) =>
                                        prev.map((table) => {
                                          if (table.id === i) {
                                            return {
                                              ...table,
                                              indices: table.indices
                                                .filter(
                                                  (index) => index.id !== idx.id
                                                )
                                                .map((e, j) => ({
                                                  ...e,
                                                  id: j,
                                                })),
                                            };
                                          }
                                          return table;
                                        })
                                      );
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
                        showClear
                        onClear={() => updateTable(i, { comment: "" })}
                        value={t.comment}
                        autosize
                        placeholder="Add comment"
                        rows={1}
                        onChange={(value) => updateTable(i, { comment: value })}
                        onFocus={(e) =>
                          setEditField({
                            tid: t.id,
                            values: { comment: e.target.value },
                          })
                        }
                        onBlur={(e) => {
                          if (e.target.value === editField.comment) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.TABLE,
                              component: "comment",
                              data: {
                                undo: editField,
                                redo: {
                                  tid: i,
                                  values: { comment: e.target.value },
                                },
                              },
                            },
                          ]);
                          setRedoStack([]);
                          setEditField({});
                        }}
                      />
                    </Collapse.Panel>
                  </Collapse>
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
                                    tid: i,
                                    undo: { color: t.color },
                                    redo: { color: defaultTableTheme },
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
                          },
                        ]);
                        setRedoStack([]);
                        setTables((prev) =>
                          prev.map((table) => {
                            if (table.id === i) {
                              return {
                                ...table,
                                indices: [
                                  ...table.indices,
                                  {
                                    id: table.indices.length,
                                    name: `index_${table.indices.length}`,
                                    fields: [],
                                  },
                                ],
                              };
                            }
                            return table;
                          })
                        );
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
                          },
                        ]);
                        setRedoStack([]);
                        setTables((prev) =>
                          prev.map((table) => {
                            if (table.id === i) {
                              return {
                                ...table,
                                fields: [
                                  ...table.fields,
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
                                    id: table.fields.length,
                                  },
                                ],
                              };
                            }
                            return table;
                          })
                        );
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
                        props.setSelectedTable("");
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
