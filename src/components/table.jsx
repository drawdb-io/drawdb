import { React, useState, useContext } from "react";
import {
  sqlDataTypes,
  tableThemes,
  defaultTableTheme,
  Tab,
} from "../data/data";
import {
  IconEdit,
  IconPlus,
  IconMore,
  IconMinus,
  IconDeleteStroked,
  IconKeyStroked,
  IconCheckboxTick,
  IconColorPalette,
} from "@douyinfe/semi-icons";
import {
  // Modal,
  Select,
  Card,
  Form,
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
  SettingsContext,
  TabContext,
  TableContext,
} from "../pages/editor";

export default function Table(props) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  const [visible, setVisible] = useState(false);
  const { layout } = useContext(LayoutContext);
  const { setTables } = useContext(TableContext);
  const { tab, setTab } = useContext(TabContext);
  const { settings } = useContext(SettingsContext);

  const height = props.tableData.fields.length * 36 + 50 + 3;

  const updatedField = (tid, fid, updatedValues) => {
    setTables((prev) =>
      prev.map((table, i) => {
        if (tid === i) {
          return {
            ...table,
            fields: table.fields.map((field, j) =>
              fid === j ? { ...field, ...updatedValues } : field
            ),
          };
        }
        return table;
      })
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
    <g>
      <foreignObject
        key={props.tableData.id}
        x={props.tableData.x}
        y={props.tableData.y}
        width={200}
        height={height}
        className="shadow-lg rounded-md cursor-move"
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
          className={`border-2 ${
            isHovered ? "border-sky-500" : "border-gray-400"
          } bg-gray-100 select-none rounded-md w-full`}
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
                      setVisible(true);
                    } else {
                      setTab(Tab.tables);
                      props.setSelectedTable(`${props.tableData.id}`);
                      if (tab !== Tab.tables) return;
                      document
                        .getElementById(`scroll_table_${props.tableData.id}`)
                        .scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                ></Button>
                <Button
                  icon={<IconPlus />}
                  size="small"
                  theme="solid"
                  style={{
                    backgroundColor: "#3cb558",
                    opacity: "0.7",
                    marginRight: "6px",
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
                    <p className="text-slate-600">
                      <strong>Comment :</strong>{" "}
                      {e.comment === "" ? "Not comment" : e.comment}
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
        visible={visible}
        onCancel={() => setVisible((prev) => !prev)}
        style={{ paddingBottom: "16px" }}
      >
        <Form
          labelPosition="left"
          onChange={(value) => updateTable(props.tableData.id, value.values)}
        >
          <Form.Input
            initValue={props.tableData.name}
            field="name"
            label="Name"
          />
        </Form>
        <div>
          {props.tableData.fields.map((f, j) => (
            <Form
              key={j}
              onChange={(value) =>
                updatedField(props.tableData.id, j, value.values)
              }
              initValues={f}
            >
              <Row
                type="flex"
                justify="start"
                align="middle"
                gutter={6}
                className="hover:bg-slate-100"
              >
                <Col span={8}>
                  <Form.Input
                    field="name"
                    noLabel={true}
                    className="m-0"
                    placeholder="Name"
                  />
                </Col>
                <Col span={8}>
                  <Form.Select
                    className="w-full"
                    field="type"
                    noLabel={true}
                    optionList={sqlDataTypes.map((value, index) => {
                      return {
                        label: value,
                        value: value,
                      };
                    })}
                    filter
                    placeholder="Type"
                  ></Form.Select>
                </Col>
                <Col
                  span={8}
                  style={{ display: "flex", justifyContent: "space-around" }}
                >
                  <Button
                    type={f.notNull ? "primary" : "tertiary"}
                    title="Nullable"
                    theme={f.notNull ? "solid" : "light"}
                    onClick={() =>
                      updatedField(props.tableData.id, j, {
                        notNull: !f.notNull,
                      })
                    }
                  >
                    ?
                  </Button>
                  <Button
                    type={f.primary ? "primary" : "tertiary"}
                    title="Primary"
                    theme={f.primary ? "solid" : "light"}
                    onClick={() =>
                      updatedField(props.tableData.id, j, {
                        primary: !f.primary,
                      })
                    }
                    icon={<IconKeyStroked />}
                  ></Button>
                  <Popover
                    content={
                      <div className="px-1">
                        <Form
                          onChange={(value) =>
                            updatedField(props.tableData.id, j, value.values)
                          }
                        >
                          <Form.Input
                            field="default"
                            label="Default"
                            initValue={f.default}
                            trigger="blur"
                            placeholder="Set default"
                          />
                          <Form.Input
                            field="check"
                            label="Check Expression"
                            trigger="blur"
                            placeholder="Set constraint"
                            initValue={f.check}
                          />
                          <div className="flex justify-between items-center my-3">
                            <label htmlFor="unique" className="font-medium">
                              Unique
                            </label>
                            <Checkbox
                              value="unique"
                              defaultChecked={f.unique}
                              onChange={(checkedValues) =>
                                updatedField(props.tableData.id, j, {
                                  [checkedValues.target.value]:
                                    checkedValues.target.checked,
                                })
                              }
                            ></Checkbox>
                          </div>
                          <div className="flex justify-between items-center my-3">
                            <label htmlFor="increment" className="font-medium">
                              Autoincrement
                            </label>
                            <Checkbox
                              value="increment"
                              defaultChecked={f.increment}
                              onChange={(checkedValues) =>
                                updatedField(props.tableData.id, j, {
                                  [checkedValues.target.value]:
                                    checkedValues.target.checked,
                                })
                              }
                            ></Checkbox>
                          </div>
                          <Form.TextArea
                            field="comment"
                            label="Comment"
                            placeholder="Add comment"
                            initValue={f.comment}
                            autosize
                            rows={2}
                          />
                        </Form>
                        <Button
                          icon={<IconDeleteStroked />}
                          type="danger"
                          block
                          onClick={(ev) => {
                            setTables((prev) => {
                              const updatedTables = [...prev];
                              const updatedFields = [
                                ...updatedTables[props.tableData.id].fields,
                              ];
                              updatedFields.splice(j, 1);
                              updatedTables[props.tableData.id].fields = [
                                ...updatedFields,
                              ];
                              return updatedTables;
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
                    <Button type="tertiary" icon={<IconMore />}></Button>
                  </Popover>
                </Col>
              </Row>
            </Form>
          ))}
          {props.tableData.indices.length > 0 && (
            <Card
              bodyStyle={{ padding: "14px" }}
              style={{ marginTop: "12px", marginBottom: "12px" }}
              headerLine={false}
            >
              <div className="font-medium ms-1 mb-1">Indices</div>
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
                    defaultValue={idx.fields}
                    onChange={(value) => {
                      setTables((prev) =>
                        prev.map((t, i) => {
                          if (t.id === props.tableData.id) {
                            return {
                              ...t,
                              indices: t.indices.map((index, j) => {
                                if (j === k)
                                  return {
                                    name: `${value.join("_")}_index`,
                                    fields: [...value],
                                  };
                                return index;
                              }),
                            };
                          }
                          return t;
                        })
                      );
                    }}
                  />
                  <Popover
                    content={
                      <div className="px-1">
                        <Form>
                          <Form.Input
                            field="name"
                            label="Name"
                            initValue={idx.name}
                            trigger="blur"
                            placeholder="Index name"
                          />
                        </Form>
                        <Button
                          icon={<IconDeleteStroked />}
                          type="danger"
                          block
                          onClick={() => {
                            setTables((prev) =>
                              prev.map((t, i) => {
                                if (t.id === props.tableData.id) {
                                  const updatedIndices = [...t.indices];
                                  updatedIndices.splice(k, 1);
                                  return {
                                    ...t,
                                    indices: updatedIndices,
                                  };
                                }
                                return t;
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
            </Card>
          )}
          <Card
            bodyStyle={{ padding: "14px" }}
            style={{ marginTop: "12px", marginBottom: "12px" }}
            headerLine={false}
          >
            <div className="font-medium ms-1">Comment</div>
            <Form
              onChange={(value) =>
                updateTable(props.tableData.id, value.values)
              }
            >
              <Form.TextArea
                field="comment"
                noLabel={true}
                showClear
                onClear={() => updateTable(props.tableData.id, { comment: "" })}
                initValue={props.tableData.comment}
                autosize
                placeholder="Add comment"
                rows={1}
              />
            </Form>
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
                        onClick={() =>
                          updateTable(props.tableData.id, {
                            color: defaultTableTheme,
                          })
                        }
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
                              onClick={() =>
                                updateTable(props.tableData.id, { color: c })
                              }
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
                              onClick={() =>
                                updateTable(props.tableData.id, { color: c })
                              }
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
                  setTables((prev) =>
                    prev.map((t, i) => {
                      if (t.id === props.tableData.id) {
                        return {
                          ...t,
                          indices: [
                            ...t.indices,
                            { name: `index_${t.indices.length}`, fields: [] },
                          ],
                        };
                      }
                      return t;
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
                  setTables((prev) =>
                    prev.map((t, i) => {
                      if (t.id === props.tableData.id) {
                        return {
                          ...t,
                          fields: [
                            ...t.fields,
                            {
                              name: "",
                              type: "",
                              default: "",
                              primary: false,
                              unique: false,
                              notNull: false,
                              increment: false,
                              comment: "",
                            },
                          ],
                        };
                      }
                      return t;
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
                  setTables((prev) =>
                    prev
                      .filter((e) => e.id !== props.tableData.id)
                      .map((e, idx) => ({ ...e, id: idx }))
                  );
                  props.setSelectedTable("");
                  setVisible(false);
                }}
              ></Button>
            </Col>
          </Row>
        </div>
      </SideSheet>
    </g>
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
            <Button
              theme="solid"
              size="small"
              style={{
                opacity: "0.7",
                backgroundColor: "#d42020",
              }}
              onClick={(ev) => {
                setTables((prev) => {
                  const updatedTables = [...prev];
                  const updatedFields = [
                    ...updatedTables[props.tableData.id].fields,
                  ];
                  updatedFields.splice(index, 1);
                  updatedTables[props.tableData.id].fields = [...updatedFields];
                  return updatedTables;
                });
              }}
              icon={<IconMinus />}
            ></Button>
          ) : (
            fieldData.type
          )}
        </div>
      </div>
    );
  }
}
