import React from "react";
import {
  Collapse,
  Input,
  Form,
  Row,
  Col,
  Button,
  Checkbox,
} from "@douyinfe/semi-ui";
import { IconRowsStroked, IconDeleteStroked } from "@douyinfe/semi-icons";
import { Cardinality, Constraint } from "../data/data";

// import { Table } from "@douyinfe/semi-ui";

export default function ReferenceOverview(props) {
  //   const columns = [
  //     {
  //       title: "Primary",
  //       dataIndex: "primary",
  //     },
  //     {
  //       title: "Foreign",
  //       dataIndex: "foreign",
  //     },
  //   ];

  return (
    <Collapse>
      {props.relationships.map((r, i) => (
        <Collapse.Panel
          key={i}
          header={
            <div>
              <Input defaultValue={r.name} borderless />
            </div>
          }
          itemKey={`${i}`}
        >
          <Form>
            <Form.Input initValue={r.name} field="name" label="Name" />

            {/* <Table
              columns={columns}
              dataSource={[
                {
                  key: "1",
                  primary: props.tables[r.startTableId].name,
                  foreign: props.tables[r.endTableId].name,
                },
                {
                  key: "2",
                  primary: props.tables[r.startTableId].fields[r.startFieldId].name,
                  foreign: props.tables[r.endTableId].fields[r.endFieldId].name,
                },
              ]}
              pagination={false}
              bordered
            /> */}

            <Form.Select
              optionList={Object.values(Cardinality).map((v) => ({
                label: v,
                value: v,
              }))}
              field="cardinality"
              label="Cardinality"
              initValue={r.cardinality}
              className="w-full"
            ></Form.Select>
            <Row gutter={6}>
              <Col span={12}>
                <Form.Select
                  optionList={Object.values(Constraint).map((v) => ({
                    label: v,
                    value: v,
                  }))}
                  field="updateConstraint"
                  label="On update"
                  initValue={r.updateConstraint}
                  className="w-full"
                ></Form.Select>
              </Col>
              <Col span={12}>
                <Form.Select
                  optionList={Object.values(Constraint).map((v) => ({
                    label: v,
                    value: v,
                  }))}
                  field="deleteConstraint"
                  label="On delete"
                  initValue={r.deleteConstraint}
                  className="w-full"
                ></Form.Select>
              </Col>
            </Row>
            <div className="flex justify-between items-center my-3">
              <label htmlFor="unique" className="font-medium text-black">
                Mandetory
              </label>
              <Checkbox
                value="mandetory"
                defaultChecked={r.mandetory}
                onChange={(checkedValues) => {}}
              ></Checkbox>
            </div>
            <Row gutter={6} className="mt-1">
              <Col span={12}>
                <Button
                  icon={<IconRowsStroked />}
                  disabled={r.Cardinality === Cardinality.ONE_TO_ONE}
                  block
                >
                  Extract to table
                </Button>
              </Col>
              <Col span={12}>
                <Button icon={<IconDeleteStroked />} block type="danger">
                  Delete
                </Button>
              </Col>
            </Row>
          </Form>
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}
