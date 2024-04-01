import { useState } from "react";
import {
  AutoComplete,
  Collapse,
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
import { Cardinality, Constraint, Action, ObjectType } from "../../data/constants";
import useTables from "../../hooks/useTables";
import useUndoRedo from "../../hooks/useUndoRedo";
import Empty from "./Empty";

export default function RelationshipsOverview() {
  const { relationships } = useTables();
  const [refActiveIndex, setRefActiveIndex] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    relationships.map((t) => t.name)
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      relationships.map((t) => t.name).filter((i) => i.includes(value))
    );
  };

  return (
    <>
      <AutoComplete
        data={filteredResult}
        value={searchText}
        showClear
        prefix={<IconSearch />}
        placeholder="Search..."
        emptyContent={
          <div className="p-3 popover-theme">No relationships found</div>
        }
        onSearch={(v) => handleStringSearch(v)}
        onChange={(v) => setSearchText(v)}
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
          <Empty
            title="No relationships"
            text="Drag to connect fields and form relationships!"
          />
        ) : (
          relationships.map((r) => <RelationshipPanel key={r.id} data={r} />)
        )}
      </Collapse>
    </>
  );
}

function RelationshipPanel({ data }) {
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
  const { tables, setRelationships, deleteRelationship } = useTables();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  return (
    <div id={`scroll_ref_${data.id}`}>
      <Collapse.Panel header={data.name} itemKey={`${data.id}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="me-3">
            <span className="font-semibold">Primary: </span>
            {tables[data.endTableId].name}
          </div>
          <div className="mx-1">
            <span className="font-semibold">Foreign: </span>
            {tables[data.startTableId].name}
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
                        foreign: `${tables[data.startTableId].name}(${
                          tables[data.startTableId].fields[data.startFieldId]
                            .name
                        })`,
                        primary: `${tables[data.endTableId].name}(${
                          tables[data.endTableId].fields[data.endFieldId].name
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
                            rid: data.id,
                            undo: {
                              startTableId: data.startTableId,
                              startFieldId: data.startFieldId,
                              endTableId: data.endTableId,
                              endFieldId: data.endFieldId,
                            },
                            redo: {
                              startTableId: data.endTableId,
                              startFieldId: data.endFieldId,
                              endTableId: data.startTableId,
                              endFieldId: data.startFieldId,
                            },
                            message: `Swap primary and foreign tables`,
                          },
                        ]);
                        setRedoStack([]);
                        setRelationships((prev) =>
                          prev.map((e, idx) =>
                            idx === data.id
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
              <Button icon={<IconMore />} type="tertiary" />
            </Popover>
          </div>
        </div>
        <div className="font-semibold my-1">Cardinality</div>
        <Select
          optionList={Object.values(Cardinality).map((v) => ({
            label: v,
            value: v,
          }))}
          value={data.cardinality}
          className="w-full"
          onChange={(value) => {
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.RELATIONSHIP,
                rid: data.id,
                undo: { cardinality: data.cardinality },
                redo: { cardinality: value },
                message: `Edit relationship cardinality`,
              },
            ]);
            setRedoStack([]);
            setRelationships((prev) =>
              prev.map((e, idx) =>
                idx === data.id ? { ...e, cardinality: value } : e
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
              value={data.updateConstraint}
              className="w-full"
              onChange={(value) => {
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.RELATIONSHIP,
                    rid: data.id,
                    undo: { updateConstraint: data.updateConstraint },
                    redo: { updateConstraint: value },
                    message: `Edit relationship update constraint`,
                  },
                ]);
                setRedoStack([]);
                setRelationships((prev) =>
                  prev.map((e, idx) =>
                    idx === data.id ? { ...e, updateConstraint: value } : e
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
              value={data.deleteConstraint}
              className="w-full"
              onChange={(value) => {
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.RELATIONSHIP,
                    rid: data.id,
                    undo: { deleteConstraint: data.deleteConstraint },
                    redo: { deleteConstraint: value },
                    message: `Edit relationship delete constraint`,
                  },
                ]);
                setRedoStack([]);
                setRelationships((prev) =>
                  prev.map((e, idx) =>
                    idx === data.id ? { ...e, deleteConstraint: value } : e
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
          onClick={() => deleteRelationship(data.id, true)}
        >
          Delete
        </Button>
      </Collapse.Panel>
    </div>
  );
}
