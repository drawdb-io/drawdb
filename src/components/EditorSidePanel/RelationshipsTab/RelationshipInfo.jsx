import {
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
} from "@douyinfe/semi-icons";
import {
  Cardinality,
  Constraint,
  Action,
  ObjectType,
} from "../../../data/constants";
import { useTables, useUndoRedo } from "../../../hooks";
import i18n from "../../../i18n/i18n";
import { useTranslation } from "react-i18next";

const columns = [
  {
    title: i18n.t("primary"),
    dataIndex: "primary",
  },
  {
    title: i18n.t("foreign"),
    dataIndex: "foreign",
  },
];

export default function RelationshipInfo({ data }) {
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { tables, setRelationships, deleteRelationship } = useTables();
  const { t } = useTranslation();

  const swapKeys = () => {
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
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[swap keys]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id
          ? {
              ...e,
              name: `${tables[e.startTableId].name}_${
                tables[e.startTableId].fields[e.startFieldId].name
              }_fk`,
              startTableId: e.endTableId,
              startFieldId: e.endFieldId,
              endTableId: e.startTableId,
              endFieldId: e.startFieldId,
            }
          : e,
      ),
    );
  };

  const changeCardinality = (value) => {
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { cardinality: data.cardinality },
        redo: { cardinality: value },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[cardinality]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { ...e, cardinality: value } : e,
      ),
    );
  };

  const changeConstraint = (key, value) => {
    const undoKey = `${key}Constraint`;
    console.log({
      action: Action.EDIT,
      element: ObjectType.RELATIONSHIP,
      rid: data.id,
      undo: { [undoKey]: data[undoKey] },
      redo: { [undoKey]: value },
      message: t("edit_relationship", {
        refName: data.name,
        extra: "[constraint]",
      }),
    });
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { [undoKey]: data[undoKey] },
        redo: { [undoKey]: value },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[constraint]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) => (idx === data.id ? { ...e, [undoKey]: value } : e)),
    );
  };

  return (
    <div id={`scroll_ref_${data.id}`}>
      <Collapse.Panel
        header={
          <div className="overflow-hidden text-ellipsis whitespace-nowrap">
            {data.name}
          </div>
        }
        itemKey={`${data.id}`}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="me-3">
            <span className="font-semibold">{t("primary")}: </span>
            {tables[data.endTableId].name}
          </div>
          <div className="mx-1">
            <span className="font-semibold">{t("foreign")}: </span>
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
                      onClick={swapKeys}
                    >
                      {t("swap")}
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
        <div className="font-semibold my-1">{t("cardinality")}:</div>
        <Select
          optionList={Object.values(Cardinality).map((v) => ({
            label: v,
            value: v,
          }))}
          value={data.cardinality}
          className="w-full"
          onChange={changeCardinality}
        />
        <Row gutter={6} className="my-3">
          <Col span={12}>
            <div className="font-semibold">{t("on_update")}: </div>
            <Select
              optionList={Object.values(Constraint).map((v) => ({
                label: v,
                value: v,
              }))}
              value={data.updateConstraint}
              className="w-full"
              onChange={(value) => changeConstraint("update", value)}
            />
          </Col>
          <Col span={12}>
            <div className="font-semibold">{t("on_delete")}: </div>
            <Select
              optionList={Object.values(Constraint).map((v) => ({
                label: v,
                value: v,
              }))}
              value={data.deleteConstraint}
              className="w-full"
              onChange={(value) => changeConstraint("delete", value)}
            />
          </Col>
        </Row>
        <Button
          icon={<IconDeleteStroked />}
          block
          type="danger"
          onClick={() => deleteRelationship(data.id)}
        >
          {t("delete")}
        </Button>
      </Collapse.Panel>
    </div>
  );
}
