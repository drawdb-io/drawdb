import React from "react";
import { sqlDataTypes } from "../data/data";
import {
  Collapse,
  Input,
  Row,
  Col,
  Form,
  Button,
  Card,
  TextArea,
} from "@douyinfe/semi-ui";
import {
  IconMore,
  IconKeyStroked,
  IconColorPalette,
} from "@douyinfe/semi-icons";

export default function DiagramOverview(props) {
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
          <Form>
            {t.fields.map((f, j) => (
              <div key={j}>
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
                    <Button type="tertiary" icon={<IconMore />}></Button>
                  </Col>
                </Row>
              </div>
            ))}
          </Form>
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
              <Button type="tertiary" icon={<IconColorPalette />}></Button>
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
