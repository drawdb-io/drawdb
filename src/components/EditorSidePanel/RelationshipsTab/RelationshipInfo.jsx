import {
  Row,
  Col,
  Select,
  Button,
  Popover,
  Table,
  Input,
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
import { useDiagram, useLayout, useUndoRedo } from "../../../hooks";
import i18n from "../../../i18n/i18n";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";

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
  const { tables, deleteRelationship, updateRelationship } = useDiagram();
  const { t } = useTranslation();
  const { layout } = useLayout();
  const [editField, setEditField] = useState({});

  const relValues = useMemo(() => {
    const { fields: startTableFields, name: startTableName } = tables.find(
      (t) => t.id === data.startTableId,
    );
    const { name: startFieldName } = startTableFields.find(
      (f) => f.id === data.startFieldId,
    );
    const { fields: endTableFields, name: endTableName } = tables.find(
      (t) => t.id === data.endTableId,
    );
    const { name: endFieldName } = endTableFields.find(
      (f) => f.id === data.endFieldId,
    );
    return {
      startTableName,
      startFieldName,
      endTableName,
      endFieldName,
    };
  }, [tables, data]);

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

    updateRelationship(data.id, {
      name: `fk_${relValues.endTableName}_${relValues.endFieldName}_${relValues.startTableName}`,
      startTableId: data.endTableId,
      startFieldId: data.endFieldId,
      endTableId: data.startTableId,
      endFieldId: data.startFieldId,
    });
  };

  const changeCardinality = (value) => {
    if (layout.readOnly) return;

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
    updateRelationship(data.id, { cardinality: value });
  };

  const changeConstraint = (key, value) => {
    if (layout.readOnly) return;

    const undoKey = `${key}Constraint`;
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
    updateRelationship(data.id, { [undoKey]: value });
  };

  return (
    <>
      <div className="flex items-center mb-2.5">
        <div className="text-md font-semibold break-keep">{t("name")}: </div>
        <Input
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder={t("name")}
          className="ms-2"
          readonly={layout.readOnly}
          onChange={(value) => updateRelationship(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.RELATIONSHIP,
                component: "self",
                rid: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_relationship", {
                  refName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="me-3">
          <span className="font-semibold">{t("primary")}: </span>
          {relValues.endTableName}
        </div>
        <div className="mx-1">
          <span className="font-semibold">{t("foreign")}: </span>
          {relValues.startTableName}
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
                      foreign: `${relValues.startTableName}(${relValues.startFieldName})`,
                      primary: `${relValues.endTableName}(${relValues.endFieldName})`,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                />
                <div className="mt-2">
                  <Button
                    block
                    icon={<IconLoopTextStroked />}
                    onClick={swapKeys}
                    disabled={layout.readOnly}
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
          label: t(v),
          value: v,
        }))}
        value={data.cardinality}
        className="w-full"
        onChange={changeCardinality}
      />

      {data.cardinality !== Cardinality.ONE_TO_ONE && (
        <>
          <div className="text-md font-semibold break-keep mt-2">
            {t("many_side_label")}:
          </div>
          <Input
            value={data.manyLabel}
            placeholder={t("label")}
            onChange={(value) => updateRelationship(data.id, { manyLabel: value })}
            onFocus={(e) => setEditField({ manyLabel: e.target.value })}
            readonly={layout.readOnly}
            onBlur={(e) => {
              if (e.target.value === editField.manyLabel) return;
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.RELATIONSHIP,
                  component: "self",
                  rid: data.id,
                  undo: editField,
                  redo: { manyLabel: e.target.value },
                  message: t("edit_relationship", {
                    refName: e.target.value,
                    extra: "[manyLabel]",
                  }),
                },
              ]);
              setRedoStack([]);
            }}
          />
        </>
      )}

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
        block
        type="danger"
        disabled={layout.readOnly}
        icon={<IconDeleteStroked />}
        onClick={() => deleteRelationship(data.id)}
      >
        {t("delete")}
      </Button>
    </>
  );
}
