import React, { useContext, useState } from "react";
import {
  AutoComplete,
  Collapse,
  Empty,
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
  IconSearch,
} from "@douyinfe/semi-icons";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { Action, Cardinality, Constraint, ObjectType } from "../data/data";
import { TableContext, UndoRedoContext } from "../pages/editor";

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
  const { tables, relationships, setRelationships } = useContext(TableContext);
  const { setUndoStack, setRedoStack } = useContext(UndoRedoContext);
  const [refActiveIndex, setRefActiveIndex] = useState("");
  const [value, setValue] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    relationships.map((t) => {
      return t.name;
    })
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      relationships
        .map((t) => {
          return t.name;
        })
        .filter((i) => i.includes(value))
    );
  };
  return (
    <>
      <AutoComplete
        data={filteredResult}
        value={value}
        showClear
        prefix={<IconSearch />}
        placeholder="Search..."
        emptyContent={<div className="p-3">No relationships found</div>}
        onSearch={(v) => handleStringSearch(v)}
        onChange={(v) => setValue(v)}
        onSelect={(v) => {
          const { id } = relationships.find((t) => t.name === v);
          setRefActiveIndex(`${id}`);
          document
            .getElementById(`scroll_ref_${id}`)
            .scrollIntoView({ behavior: "smooth" });
        }}
        className="w-full"
      />
      <Collapse
        activeKey={refActiveIndex}
        onChange={(k) => setRefActiveIndex(k)}
        accordion
      >
        {relationships.length <= 0 ? (
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
              title="No relationships"
              description="Drag to connect fields and form relationships!"
            />
          </div>
        ) : (
          relationships.map((r, i) => (
            <div id={`scroll_ref_${r.id}`} key={i}>
              <Collapse.Panel header={<div>{r.name}</div>} itemKey={`${i}`}>
                <Form
                  onChange={(value) =>
                    setRelationships((prev) =>
                      prev.map((e, idx) =>
                        idx === i ? { ...e, ...value.values } : e
                      )
                    )
                  }
                >
                  <div className="flex justify-between items-center my-1">
                    <div className="me-3">
                      <strong>Primary: </strong>
                      {tables[r.endTableId].name}
                    </div>
                    <div className="mx-1">
                      <strong>Foreign: </strong>
                      {tables[r.startTableId].name}
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
                                  foreign: tables[r.startTableId].name,
                                  primary: tables[r.endTableId].name,
                                },
                                {
                                  key: "2",
                                  foreign:
                                    tables[r.startTableId].fields[
                                      r.startFieldId
                                    ].name,
                                  primary:
                                    tables[r.endTableId].fields[r.endFieldId]
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
                        setRelationships((prev) =>
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
                      onClick={() => {
                        setUndoStack((prev) => [
                          ...prev,
                          {
                            action: Action.DELETE,
                            element: ObjectType.RELATIONSHIP,
                            data: relationships[i],
                          },
                        ]);
                        setRelationships((prev) =>
                          prev
                            .filter((e) => e.id !== i)
                            .map((e, idx) => ({ ...e, id: idx }))
                        );
                        setRedoStack([]);
                      }}
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
