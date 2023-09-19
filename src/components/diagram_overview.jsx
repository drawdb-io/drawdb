import { React, useState } from "react";
import { defaultTableTheme, sqlDataTypes, tableThemes } from "../data/data";
import {
  Collapse,
  Input,
  Row,
  Col,
  Form,
  Button,
  Card,
  Popover,
  Checkbox,
  Select,
} from "@douyinfe/semi-ui";
import {
  IconMore,
  IconKeyStroked,
  IconColorPalette,
  IconDeleteStroked,
  IconCheckboxTick,
} from "@douyinfe/semi-icons";

export default function DiagramOverview(props) {
  const [indexActiveKey, setIndexActiveKey] = useState("");

  const updateColor = (id, c) => {
    const updatedTables = [...props.tables];
    updatedTables[id] = { ...updatedTables[id], color: c };
    props.setTables(updatedTables);
  };

  return (
    <Collapse>
      {props.tables.map((t, i) => (
        <Collapse.Panel
          key={i}
          header={
            <div>
              <Input defaultValue={t.name} borderless />
            </div>
          }
          itemKey={`${i}`}
        >
          {t.fields.map((f, j) => (
            <Form
              key={j}
              onChange={(value) => {
                const updatedTables = [...props.tables];
                updatedTables[i].fields = updatedTables[i].fields.map(
                  (field, index) =>
                    index === j ? { ...field, ...value.values } : field
                );
                props.setTables(updatedTables);
              }}
            >
              <Row
                type="flex"
                justify="start"
                align="middle"
                gutter={6}
                className="hover:bg-slate-100"
              >
                <Col span={7}>
                  <Form.Input
                    field="name"
                    noLabel={true}
                    initValue={f.name}
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
                    initValue={f.type}
                  ></Form.Select>
                </Col>
                <Col span={3}>
                  <Button
                    type={f.notNull ? "primary" : "tertiary"}
                    title="Nullable"
                    theme={f.notNull ? "solid" : "light"}
                    onClick={() => {
                      const updatedTables = [...props.tables];
                      updatedTables[i].fields = updatedTables[i].fields.map(
                        (field, index) =>
                          index === j
                            ? { ...field, notNull: !f.notNull }
                            : field
                      );
                      props.setTables(updatedTables);
                    }}
                  >
                    ?
                  </Button>
                </Col>
                <Col span={3}>
                  <Button
                    type={f.primary ? "primary" : "tertiary"}
                    title="Nullable"
                    theme={f.primary ? "solid" : "light"}
                    onClick={() => {
                      const updatedTables = [...props.tables];
                      updatedTables[i].fields = updatedTables[i].fields.map(
                        (field, index) =>
                          index === j
                            ? { ...field, primary: !f.primary }
                            : field
                      );
                      props.setTables(updatedTables);
                    }}
                    icon={<IconKeyStroked />}
                  ></Button>
                </Col>
                <Col span={3}>
                  <Popover
                    content={
                      <div className="px-1">
                        <Form
                          onChange={(value) => {
                            const updatedTables = [...props.tables];
                            updatedTables[i] = {
                              ...updatedTables[i],
                              fields: updatedTables[i].fields.map(
                                (field, index) =>
                                  index === j
                                    ? { ...field, ...value.values }
                                    : field
                              ),
                            };
                            props.setTables(updatedTables);
                          }}
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
                              onChange={(checkedValues) => {
                                const updatedTables = [...props.tables];
                                updatedTables[i].fields = updatedTables[
                                  i
                                ].fields.map((field, index) =>
                                  index === j
                                    ? {
                                        ...field,
                                        [checkedValues.target.value]:
                                          checkedValues.target.checked,
                                      }
                                    : field
                                );
                                props.setTables(updatedTables);
                              }}
                            ></Checkbox>
                          </div>
                          <div className="flex justify-between items-center my-3">
                            <label htmlFor="increment" className="font-medium">
                              Autoincrement
                            </label>
                            <Checkbox
                              value="increment"
                              defaultChecked={f.increment}
                              onChange={(checkedValues) => {
                                const updatedTables = [...props.tables];
                                updatedTables[i].fields = updatedTables[
                                  i
                                ].fields.map((field, index) =>
                                  index === j
                                    ? {
                                        ...field,
                                        [checkedValues.target.value]:
                                          checkedValues.target.checked,
                                      }
                                    : field
                                );
                                props.setTables(updatedTables);
                              }}
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
                          onClick={() => {
                            const updatedTables = [...props.tables];
                            const updatedFields = [...t.fields];
                            updatedFields.splice(j, 1);
                            updatedTables[i] = {
                              ...t,
                              fields: [...updatedFields],
                            };
                            props.setTables(updatedTables);
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
          {t.indices.length > 0 && (
            <Card
              bodyStyle={{ padding: "4px" }}
              style={{ marginTop: "12px", marginBottom: "12px" }}
              headerLine={false}
            >
              <Collapse
                activeKey={indexActiveKey}
                onChange={(itemKey) => setIndexActiveKey(itemKey)}
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
                        defaultValue={idx.fields}
                        onChange={(value) => {
                          const updatedTables = [...props.tables];
                          const updatedIndices = [...t.indices];
                          updatedIndices[k] = {
                            name: `${value.join("_")}_index`,
                            fields: [...value],
                          };
                          updatedTables[i] = {
                            ...t,
                            indices: [...updatedIndices],
                          };
                          props.setTables(updatedTables);
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
                                const updatedTables = [...props.tables];
                                const updatedIndices = [...t.indices];
                                updatedIndices.splice(k, 1);
                                updatedTables[i] = {
                                  ...t,
                                  indices: [...updatedIndices],
                                };
                                props.setTables(updatedTables);
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
                <Form>
                  <Form.TextArea
                    field="comment"
                    noLabel={true}
                    initValue={t.comment}
                    autosize
                    placeholder="Add comment"
                    rows={1}
                  />
                </Form>
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
                        onClick={() => updateColor(i, defaultTableTheme)}
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
                              onClick={() => updateColor(i, c)}
                            >
                              {t.color === c ? (
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
                              onClick={() => updateColor(i, c)}
                            >
                              {t.color === c ? (
                                <IconCheckboxTick style={{ color: "white" }} />
                              ) : (
                                <IconCheckboxTick style={{ color: c }} />
                              )}
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
            <Col span={8}>
              <Button
                block
                onClick={() => {
                  setIndexActiveKey("1");
                  const updatedTables = [...props.tables];
                  updatedTables[i] = {
                    ...t,
                    indices: [
                      ...t.indices,
                      { name: `index_${t.indices.length}`, fields: [] },
                    ],
                  };
                  props.setTables(updatedTables);
                }}
              >
                Add index
              </Button>
            </Col>
            <Col span={8}>
              <Button
                onClick={() => {
                  const updatedTables = [...props.tables];
                  updatedTables[i].fields = [
                    ...updatedTables[i].fields,
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
                  ];
                  props.setTables(updatedTables);
                }}
                block
              >
                Add field
              </Button>
            </Col>
          </Row>
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}
