import { React } from "react";
import { defaultTableTheme, sqlDataTypes, tableThemes } from "../data/data";
import {
  Collapse,
  Input,
  Row,
  Col,
  Form,
  Button,
  Card,
  TextArea,
  Popover,
  Checkbox,
} from "@douyinfe/semi-ui";
import {
  IconMore,
  IconKeyStroked,
  IconColorPalette,
  IconDeleteStroked,
  IconCheckboxTick,
} from "@douyinfe/semi-icons";

export default function DiagramOverview(props) {
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
            <Form key={j}>
              <div>
                <Row
                  type="flex"
                  justify="start"
                  align="middle"
                  gutter={6}
                  className="hover:bg-slate-100"
                >
                  <Col span={7}>
                    <Form.Input
                      field={`name-${j}`}
                      noLabel={true}
                      initValue={f.name}
                      className="m-0"
                    />
                  </Col>
                  <Col span={8}>
                    <Form.Select
                      className="w-full"
                      field={`type-${j}`}
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
                    <Button type="tertiary" title="Nullable">
                      ?
                    </Button>
                  </Col>
                  <Col span={3}>
                    <Button type="tertiary" icon={<IconKeyStroked />}></Button>
                  </Col>
                  <Col span={3}>
                    <Popover
                      content={
                        <div className="px-1">
                          <Form>
                            <Form.Input
                              field="default"
                              label="Default"
                              initValue={f.default}
                              trigger="blur"
                            />
                            <Form.Input
                              field="check"
                              label="Check Expression"
                              trigger="blur"
                            />
                            <div className="flex justify-between items-center my-3">
                              <label
                                htmlFor="increment"
                                className="font-medium"
                              >
                                Autoincrement
                              </label>
                              <Checkbox
                                value="increment"
                                defaultChecked={f.increment}
                              ></Checkbox>
                            </div>
                            <Form.TextArea
                              field="comment"
                              label="Comment"
                              initValue={f.comment}
                              autosize
                              rows={2}
                            />
                          </Form>
                          <div className="flex justify-end mt-2">
                            <Button icon={<IconDeleteStroked />} type="danger">
                              Delete
                            </Button>
                          </div>
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
              </div>
            </Form>
          ))}
          <Card
            bodyStyle={{ padding: "4px" }}
            style={{ marginTop: "12px", marginBottom: "12px" }}
            headerLine={false}
          >
            <Collapse>
              <Collapse.Panel header="Indices" itemKey="1">
                <p>indices</p>
              </Collapse.Panel>
            </Collapse>
          </Card>
          <Card
            bodyStyle={{ padding: "4px" }}
            style={{ marginTop: "12px", marginBottom: "12px" }}
            headerLine={false}
          >
            <Collapse>
              <Collapse.Panel header="Comment" itemKey="1">
                <TextArea autosize rows={1} />
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
              <Button block>Add index</Button>
            </Col>
            <Col span={8}>
              <Button block>Add field</Button>
            </Col>
          </Row>
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}
