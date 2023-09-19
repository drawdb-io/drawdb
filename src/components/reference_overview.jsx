import React, { useContext, useState } from "react";
import {
  AutoComplete,
  Collapse,
  Empty,
  Row,
  Col,
  Select,
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
import { Cardinality, Constraint, Action, ObjectType } from "../data/data";
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
  const { tables, relationships, setRelationships, deleteRelationship } =
    useContext(TableContext);
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
                <div className="flex justify-between items-center mb-3">
                  <div className="me-3">
                    <span className="font-semibold">Primary: </span>
                    {tables[r.endTableId].name}
                  </div>
                  <div className="mx-1">
                    <span className="font-semibold">Foreign: </span>
                    {tables[r.startTableId].name}
                  </div>
                  <div className="ms-1">
                    <Popover
                      content={
                        <div className="p-2">
                          <Table
                            columns={columns}
                            dataSource={[
                              {
                                key: "1",
                                foreign: `${tables[r.startTableId].name}(${
                                  tables[r.startTableId].fields[r.startFieldId]
                                    .name
                                })`,
                                primary: `${tables[r.endTableId].name}(${
                                  tables[r.endTableId].fields[r.endFieldId].name
                                })`,
                              },
                            ]}
                            pagination={false}
                            size="small"
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
                <div className="font-semibold my-1">Cardinality</div>
                <Select
                  optionList={Object.values(Cardinality).map((v) => ({
                    label: v,
                    value: v,
                  }))}
                  value={r.cardinality}
                  className="w-full"
                  onChange={(value) => {
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.RELATIONSHIP,
                        rid: i,
                        undo: { cardinality: r.cardinality },
                        redo: { cardinality: value },
                      },
                    ]);
                    setRedoStack([]);
                    setRelationships((prev) =>
                      prev.map((e, idx) =>
                        idx === i ? { ...e, cardinality: value } : e
                      )
                    );
                  }}
                ></Select>
                <Row gutter={6} className="my-3">
                  <Col span={12}>
                    <div className="font-semibold">On update: </div>
                    <Select
                      optionList={Object.values(Constraint).map((v) => ({
                        label: v,
                        value: v,
                      }))}
                      value={r.updateConstraint}
                      className="w-full"
                      onChange={(value) => {
                        setUndoStack((prev) => [
                          ...prev,
                          {
                            action: Action.EDIT,
                            element: ObjectType.RELATIONSHIP,
                            rid: i,
                            undo: { updateConstraint: r.updateConstraint },
                            redo: { updateConstraint: value },
                          },
                        ]);
                        setRedoStack([]);
                        setRelationships((prev) =>
                          prev.map((e, idx) =>
                            idx === i ? { ...e, updateConstraint: value } : e
                          )
                        );
                      }}
                    ></Select>
                  </Col>
                  <Col span={12}>
                    <div className="font-semibold">On delete: </div>
                    <Select
                      optionList={Object.values(Constraint).map((v) => ({
                        label: v,
                        value: v,
                      }))}
                      value={r.deleteConstraint}
                      className="w-full"
                      onChange={(value) => {
                        setUndoStack((prev) => [
                          ...prev,
                          {
                            action: Action.EDIT,
                            element: ObjectType.RELATIONSHIP,
                            rid: i,
                            undo: { deleteConstraint: r.deleteConstraint },
                            redo: { deleteConstraint: value },
                          },
                        ]);
                        setRedoStack([]);
                        setRelationships((prev) =>
                          prev.map((e, idx) =>
                            idx === i ? { ...e, deleteConstraint: value } : e
                          )
                        );
                      }}
                    ></Select>
                  </Col>
                </Row>
                <div className="flex justify-between items-center my-3">
                  <div className="font-semibold">Mandetory</div>
                  <Checkbox
                    value="mandetory"
                    checked={r.mandetory}
                    onChange={(checkedValues) => {
                      setUndoStack((prev) => [
                        ...prev,
                        {
                          action: Action.EDIT,
                          element: ObjectType.RELATIONSHIP,
                          rid: i,
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
                      );
                    }}
                  ></Checkbox>
                </div>
                <Row gutter={6} className="mt-3">
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
                      onClick={() => deleteRelationship(r.id, true)}
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
