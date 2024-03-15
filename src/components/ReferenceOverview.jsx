import { useState } from "react";
import {
  AutoComplete,
  Collapse,
  Empty,
  Row,
  Col,
  Select,
  Button,
  Popover,
  Table,
} from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconLoopTextStroked,
  IconMore,
  IconSearch,
} from "@douyinfe/semi-icons";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { Cardinality, Constraint, Action, ObjectType } from "../data/constants";
import useTables from "../hooks/useTables";
import useUndoRedo from "../hooks/useUndoRedo";

export default function ReferenceOverview() {
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
    useTables();
  const { setUndoStack, setRedoStack } = useUndoRedo();
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
        emptyContent={
          <div className="p-3 popover-theme">No relationships found</div>
        }
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
                        <div className="p-2 popover-theme">
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
                            <Button
                              icon={<IconLoopTextStroked />}
                              block
                              onClick={() => {
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.RELATIONSHIP,
                                    rid: i,
                                    undo: {
                                      startTableId: r.startTableId,
                                      startFieldId: r.startFieldId,
                                      endTableId: r.endTableId,
                                      endFieldId: r.endFieldId,
                                    },
                                    redo: {
                                      startTableId: r.endTableId,
                                      startFieldId: r.endFieldId,
                                      endTableId: r.startTableId,
                                      endFieldId: r.startFieldId,
                                    },
                                    message: `Swap primary and foreign tables`,
                                  },
                                ]);
                                setRedoStack([]);
                                setRelationships((prev) =>
                                  prev.map((e, idx) =>
                                    idx === i
                                      ? {
                                          ...e,
                                          startTableId: e.endTableId,
                                          startFieldId: e.endFieldId,
                                          endTableId: e.startTableId,
                                          endFieldId: e.startFieldId,
                                        }
                                      : e
                                  )
                                );
                              }}
                            >
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
                        message: `Edit relationship cardinality`,
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
                            message: `Edit relationship update constraint`,
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
                            message: `Edit relationship delete constraint`,
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
                <Button
                  icon={<IconDeleteStroked />}
                  block
                  type="danger"
                  onClick={() => deleteRelationship(r.id, true)}
                >
                  Delete
                </Button>
              </Collapse.Panel>
            </div>
          ))
        )}
      </Collapse>
    </>
  );
}
