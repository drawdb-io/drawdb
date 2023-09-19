import React from "react";
import {
  Collapse,
  Form,
  Row,
  Col,
  Button,
  Checkbox,
  Popover,
  Table,
} from "@douyinfe/semi-ui";
import {
  IconRowsStroked,
  IconDeleteStroked,
  IconLoopTextStroked,
  IconMore,
} from "@douyinfe/semi-icons";
import { Cardinality, Constraint } from "../data/data";

export default function ReferenceOverview(props) {
  const columns = [
    {
      title: "Primary",
      dataIndex: "primary",
    },
    {
      title: "Foreign",
      dataIndex: "foreign",
    },
  ];
  return (
    <Collapse>
      {props.relationships.map((r, i) => (
        <Collapse.Panel key={i} header={<div>{r.name}</div>} itemKey={`${i}`}>
          <Form
            onChange={(value) =>
              props.setRelationships((prev) =>
                prev.map((e, idx) =>
                  idx === i ? { ...e, ...value.values } : e
                )
              )
            }
          >
            <div className="flex justify-between items-center my-1">
              <div className="me-3">
                <strong>Primary: </strong>
                {props.tables[r.endTableId].name}
              </div>
              <div className="mx-1">
                <strong>Foreign: </strong>
                {props.tables[r.startTableId].name}
              </div>
              <div className="ms-1">
                <Popover
                  content={
                    <div className="p-2 w-[260px]">
                      <Table
                        columns={columns}
                        dataSource={[
                          {
                            key: "1",
                            foreign: props.tables[r.startTableId].name,
                            primary: props.tables[r.endTableId].name,
                          },
                          {
                            key: "2",
                            foreign:
                              props.tables[r.startTableId].fields[
                                r.startFieldId
                              ].name,
                            primary:
                              props.tables[r.endTableId].fields[r.endFieldId]
                                .name,
                          },
                        ]}
                        pagination={false}
                        bordered
                      />
                      <div className="mt-2">
                        <Button icon={<IconLoopTextStroked />} block>
                          Swap
                        </Button>
                      </div>
                    </div>
                  }
                  trigger="click"
                  position="rightTop"
                  showArrow
                >
                  <Button icon={<IconMore />} type="tertiary"></Button>
                </Popover>
              </div>
            </div>
            <Form.Input initValue={r.name} field="name" label="Name" />
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
                onChange={(checkedValues) =>
                  props.setRelationships((prev) =>
                    prev.map((e, idx) =>
                      idx === i
                        ? {
                            ...e,
                            [checkedValues.target.value]:
                              checkedValues.target.checked,
                          }
                        : e
                    )
                  )
                }
              ></Checkbox>
            </div>
          </Form>
          <Row gutter={6} className="mt-1">
            <Col span={12}>
              <Button
                icon={<IconRowsStroked />}
                disabled={r.cardinality === Cardinality.ONE_TO_ONE}
                block
              >
                Extract to table
              </Button>
            </Col>
            <Col span={12}>
              <Button
                icon={<IconDeleteStroked />}
                block
                type="danger"
                onClick={() =>
                  props.setRelationships((prev) =>
                    prev
                      .filter((e) => e.id !== i)
                      .map((e, idx) => ({ ...e, id: idx }))
                  )
                }
              >
                Delete
              </Button>
            </Col>
          </Row>
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}
