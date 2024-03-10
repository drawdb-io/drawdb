import { useContext, useState } from "react";
import { Action, ObjectType, sqlDataTypes } from "../data/data";
import {
  Collapse,
  Row,
  Col,
  Input,
  TextArea,
  Button,
  Card,
  Select,
  TagInput,
  InputNumber,
  AutoComplete,
  Toast,
  Empty,
  Popover,
} from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconPlus,
  IconSearch,
  IconInfoCircle,
  IconMore,
} from "@douyinfe/semi-icons";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { TypeContext } from "../pages/Editor";
import { isSized, hasPrecision, getSize } from "../utils";
import useUndoRedo from "../hooks/useUndoRedo";

export default function TableOverview() {
  const [value, setValue] = useState("");
  const { types, addType, deleteType, updateType } = useContext(TypeContext);
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const [filteredResult, setFilteredResult] = useState(
    types.map((t) => {
      return t.name;
    })
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      types
        .map((t) => {
          return t.name;
        })
        .filter((i) => i.includes(value))
    );
  };

  return (
    <>
      <Row gutter={6}>
        <Col span={13}>
          <AutoComplete
            data={filteredResult}
            value={value}
            showClear
            prefix={<IconSearch />}
            placeholder="Search..."
            onSearch={(v) => handleStringSearch(v)}
            emptyContent={
              <div className="p-3 popover-theme">No types found</div>
            }
            onChange={(v) => setValue(v)}
            onSelect={(v) => {
              const i = types.findIndex((t) => t.name === v);
              document
                .getElementById(`scroll_type_${i}`)
                .scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full"
          />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addType(true)}>
            Add type
          </Button>
        </Col>
        <Col span={3}>
          <Popover
            content={
              <div className="w-[240px] text-sm space-y-2 popover-theme">
                <div>
                  This feature is meant for object-relational databases like{" "}
                  <strong>PostgreSQL</strong>.
                </div>
                <div>
                  If used for <strong>MySQL</strong> or <strong>MariaDB</strong>{" "}
                  a <code>JSON</code> type will be generated with the
                  corresponding json validation check.
                </div>
                <div>
                  If used for <strong>SQLite</strong> it will be translated to a{" "}
                  <code>BLOB</code>.
                </div>
                <div>
                  If used for <strong>MSSQL</strong> a type alias to the first
                  field will be generated.
                </div>
              </div>
            }
            showArrow
            position="rightTop"
          >
            <Button theme="borderless" icon={<IconInfoCircle />} />
          </Popover>
        </Col>
      </Row>
      <Collapse accordion>
        {types.length <= 0 ? (
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
              title="No types"
              description={<div>Make your own custom data types.</div>}
            />
          </div>
        ) : (
          types.map((t, i) => (
            <div id={`scroll_type_${i}`} key={i}>
              <Collapse.Panel header={<div>{t.name}</div>} itemKey={`${i}`}>
                <div className="flex items-center mb-2.5">
                  <div className="text-md font-semibold">Name: </div>
                  <Input
                    value={t.name}
                    validateStatus={t.name === "" ? "error" : "default"}
                    placeholder="Name"
                    className="ms-2"
                    onChange={(value) => updateType(i, { name: value })}
                    onFocus={(e) => setEditField({ name: e.target.value })}
                    onBlur={(e) => {
                      if (e.target.value === editField.name) return;
                      setUndoStack((prev) => [
                        ...prev,
                        {
                          action: Action.EDIT,
                          element: ObjectType.TYPE,
                          component: "self",
                          tid: i,
                          undo: editField,
                          redo: { name: e.target.value },
                          message: `Edit type name to ${e.target.value}`,
                        },
                      ]);
                      setRedoStack([]);
                    }}
                  />
                </div>
                {t.fields.map((f, j) => (
                  <Row gutter={6} key={j} className="hover-1 my-2">
                    <Col span={10}>
                      <Input
                        value={f.name}
                        validateStatus={f.name === "" ? "error" : "default"}
                        placeholder="Name"
                        onChange={(value) =>
                          updateType(i, {
                            fields: t.fields.map((e, id) =>
                              id === j ? { ...f, name: value } : e
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
                              tid: i,
                              fid: j,
                              undo: editField,
                              redo: { name: e.target.value },
                              message: `Edit type field name to ${e.target.value}`,
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
                            .filter((type) => type.name !== t.name)
                            .map((type) => ({
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
                              element: ObjectType.TYPE,
                              component: "field",
                              tid: i,
                              fid: j,
                              undo: { type: f.type },
                              redo: { type: value },
                              message: `Edit type field type to ${value}`,
                            },
                          ]);
                          setRedoStack([]);
                          if (value === "ENUM" || value === "SET") {
                            updateType(i, {
                              fields: t.fields.map((e, id) =>
                                id === j
                                  ? {
                                      ...f,
                                      type: value,
                                      values: f.values ? [...f.values] : [],
                                    }
                                  : e
                              ),
                            });
                          } else if (isSized(value) || hasPrecision(value)) {
                            updateType(i, {
                              fields: t.fields.map((e, id) =>
                                id === j
                                  ? { ...f, type: value, size: getSize(value) }
                                  : e
                              ),
                            });
                          } else {
                            updateType(i, {
                              fields: t.fields.map((e, id) =>
                                id === j ? { ...f, type: value } : e
                              ),
                            });
                          }
                        }}
                      ></Select>
                    </Col>
                    <Col span={3}>
                      <Popover
                        content={
                          <div className="popover-theme w-[240px]">
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
                                    updateType(i, {
                                      fields: t.fields.map((e, id) =>
                                        id === j ? { ...f, values: v } : e
                                      ),
                                    })
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
                                        element: ObjectType.TYPE,
                                        component: "field",
                                        tid: i,
                                        fid: j,
                                        undo: editField,
                                        redo: { values: f.values },
                                        message: `Edit type field values to "${JSON.stringify(
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
                                    updateType(i, {
                                      fields: t.fields.map((e, id) =>
                                        id === j ? { ...f, size: value } : e
                                      ),
                                    })
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
                                        message: `Edit type field size to ${e.target.value}`,
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
                                    updateType(i, {
                                      fields: t.fields.map((e, id) =>
                                        id === j ? { ...f, size: value } : e
                                      ),
                                    })
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
                                        message: `Edit type field precision to ${e.target.value}`,
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
                                    tid: i,
                                    fid: j,
                                    data: f,
                                    message: `Delete field`,
                                  },
                                ]);
                                updateType(i, {
                                  fields: t.fields.filter(
                                    (field, k) => k !== j
                                  ),
                                });
                              }}
                            >
                              Delete field
                            </Button>
                          </div>
                        }
                        showArrow
                        trigger="click"
                        position="right"
                      >
                        <Button icon={<IconMore />} type="tertiary"></Button>
                      </Popover>
                    </Col>
                  </Row>
                ))}
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
                          updateType(i, { comment: value }, false)
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
                              element: ObjectType.TYPE,
                              component: "self",
                              tid: i,
                              undo: editField,
                              redo: { comment: e.target.value },
                              message: `Edit type comment to ${e.target.value}`,
                            },
                          ]);
                          setRedoStack([]);
                        }}
                      />
                    </Collapse.Panel>
                  </Collapse>
                </Card>
                <Row gutter={6} className="mt-2">
                  <Col span={12}>
                    <Button
                      icon={<IconPlus />}
                      onClick={() => {
                        setUndoStack((prev) => [
                          ...prev,
                          {
                            action: Action.EDIT,
                            element: ObjectType.TYPE,
                            component: "field_add",
                            tid: i,
                            message: `Add field to type`,
                          },
                        ]);
                        setRedoStack([]);
                        updateType(i, {
                          fields: [
                            ...t.fields,
                            {
                              name: "",
                              type: "",
                            },
                          ],
                        });
                      }}
                      block
                    >
                      Add field
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      icon={<IconDeleteStroked />}
                      type="danger"
                      onClick={() => {
                        Toast.success(`Type deleted!`);
                        deleteType(i);
                      }}
                      block
                    >
                      Delete
                    </Button>
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
