import {
  Row,
  Col,
  Select,
  Button,
  Popover,
  Table,
  Input,
  Checkbox,
} from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconLoopTextStroked,
  IconMore,
} from "@douyinfe/semi-icons";
import {
  RelationshipType,
  RelationshipCardinalities,
  Constraint,
  SubtypeRestriction,
  Action,
  ObjectType,
  Notation,
} from "../../../data/constants";
import { useDiagram, useSettings, useUndoRedo} from "../../../hooks";
import i18n from "../../../i18n/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
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
  const { settings } = useSettings();
  const { tables, setTables, setRelationships, deleteRelationship, updateRelationship } =
    useDiagram();
  const { t } = useTranslation();
  const [editField, setEditField] = useState({});
  // Helper function to get the effective end table ID and field ID
  const getEffectiveEndTable = () => {
    if (data.endTableId !== undefined) {
      return {
        tableId: data.endTableId,
        fieldId: data.endFieldId,
      };
    } else if (data.endTableIds && data.endTableIds.length > 0) {
      return {
        tableId: data.endTableIds[0],
        fieldId: data.endFieldIds ? data.endFieldIds[0] : 0,
      };
    }
    return { tableId: null, fieldId: null };
  };

  const effectiveEndTable = getEffectiveEndTable();

  const swapKeys = () => {
    // Disable swap for subtype relationships with multiple children
    if (data.subtype && data.endTableIds && data.endTableIds.length > 1) {
      console.warn("Cannot swap keys for subtype relationships with multiple children");
      return;
    }
    
    const effectiveEndTable = getEffectiveEndTable();
    
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: {
          startTableId: data.startTableId,
          startFieldId: data.startFieldId,
          endTableId: effectiveEndTable.tableId,
          endFieldId: effectiveEndTable.fieldId,
        },
        redo: {
          startTableId: effectiveEndTable.tableId,
          startFieldId: effectiveEndTable.fieldId,
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
              name: `fk_${tables[effectiveEndTable.tableId].name}_${
                tables[effectiveEndTable.tableId].fields[effectiveEndTable.fieldId].name
              }_${tables[e.startTableId].name}`,
              startTableId: effectiveEndTable.tableId,
              startFieldId: effectiveEndTable.fieldId,
              endTableId: e.startTableId,
              endFieldId: e.startFieldId,
              // Clear multi-child arrays when swapping back to single format
              endTableIds: undefined,
              endFieldIds: undefined,
            }
          : e,
      ),
    );
  };

  const changeRelationshipType = (value) => {
    const defaultCardinality =
      RelationshipCardinalities[value] && RelationshipCardinalities[value][0]
        ? RelationshipCardinalities[value][0].label
        : "";

    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: {
          relationshipType: data.relationshipType,
          cardinality: data.cardinality,
        },
        redo: {
          relationshipType: value,
          cardinality: defaultCardinality,
        },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[relationship type]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id
          ? { ...e, relationshipType: value, cardinality: defaultCardinality }
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

  const changeSubtypeRestriction = (value) => {
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { subtype_restriction: data.subtype_restriction },
        redo: { subtype_restriction: value },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[subtype_restriction]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { ...e, subtype_restriction: value } : e,
      ),
    );
  };

  const toggleSubtype = () => {
    const prevVal = data.subtype;
    const newSubtypeValue = !prevVal;
    
    // Set default subtype_restriction when enabling subtype
    const defaultSubtypeRestriction = newSubtypeValue ? SubtypeRestriction.DISJOINT_TOTAL : undefined;
    
    // Change relationshipType when toggling subtype
    const newRelationshipType = newSubtypeValue ? RelationshipType.SUBTYPE : RelationshipType.ONE_TO_ONE;
    
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { 
          subtype: data.subtype,
          subtype_restriction: data.subtype_restriction,
          relationshipType: data.relationshipType
        },
        redo: { 
          subtype: newSubtypeValue,
          subtype_restriction: defaultSubtypeRestriction,
          relationshipType: newRelationshipType
        },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[subtype]",
        }),
      },
    ]);

    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { 
          ...e, 
          subtype: newSubtypeValue,
          subtype_restriction: defaultSubtypeRestriction,
          relationshipType: newRelationshipType
        } : e,
      ),
    );
  };

  const changeConstraint = (key, value) => {
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
    setRelationships((prev) =>
      prev.map((e, idx) => (idx === data.id ? { ...e, [undoKey]: value } : e)),
    );
  };

  const toggleParentCardinality = () => {
    // Use effective end table for subtype relationships
    const endTableId = effectiveEndTable.tableId;
    if (endTableId === null) return;
    
    const startTable = tables.find((t) => t.id === endTableId);
    if (!startTable) return;

    const fkFieldIds = Array.isArray(data.endFieldId)
      ? data.endFieldId
      : effectiveEndTable.fieldId !== null 
      ? [effectiveEndTable.fieldId]
      : [];

    const fkFields = startTable.fields.filter((f) => fkFieldIds.includes(f.id));
    if (fkFields.length === 0) return;

    const isCurrentlyNullable = fkFields.every((field) => !field.notNull);
    const newNotNullValue = isCurrentlyNullable;

    const undoFields = fkFields.map(field => ({ id: field.id, notNull: field.notNull }));
    const redoFields = fkFields.map(field => ({ id: field.id, notNull: newNotNullValue }));

    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.TABLE,
        tid: startTable.id,
        undo: { fields: undoFields },
        redo: { fields: redoFields },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[parent cardinality]",
        }),
      },
    ]);
    setRedoStack([]);

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === startTable.id) {
          return {
            ...table,
            fields: table.fields.map((field) => {
              if (fkFieldIds.includes(field.id)) {
                return { ...field, notNull: newNotNullValue };
              }
              return field;
            }),
          };
        }
        return table;
      }),
    );
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
          {effectiveEndTable.tableId !== null ? tables[effectiveEndTable.tableId]?.name : 'N/A'}
        </div>
        <div className="mx-1">
          <span className="font-semibold">{t("foreign")}: </span>
          {tables[data.startTableId]?.name}
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
                      foreign: `${tables[data.startTableId]?.name}(${
                        tables[data.startTableId]?.fields[data.startFieldId]
                          ?.name
                      })`,
                      primary: `${effectiveEndTable.tableId !== null ? tables[effectiveEndTable.tableId]?.name : 'N/A'}(${
                        effectiveEndTable.tableId !== null && effectiveEndTable.fieldId !== null ? 
                        tables[effectiveEndTable.tableId]?.fields[effectiveEndTable.fieldId]?.name : 'N/A'
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
                    disabled={data.subtype && data.endTableIds && data.endTableIds.length > 1}
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
      <div className="font-semibold my-1">{t("relationship_type")}:</div>
      <Select
        optionList={Object.values(RelationshipType).map((v) => ({
          label: t(v),
          value: v,
        }))}
        value={data.relationshipType}
        className="w-full"
        onChange={changeRelationshipType}
      />
      {/* Subtype functionality - only available for non-DEFAULT notations */}
      {settings.notation !== Notation.DEFAULT && (
        <Row gutter={6} className="my-3">
          <Col span={12}>
            <div className="font-semibold my-1">{t("subtype")}:</div>
          </Col>
          <Col span={12}>
            <Checkbox checked={data.subtype} onChange={toggleSubtype} />
          </Col>
        </Row>
      )}

      {data.subtype && settings.notation !== Notation.DEFAULT && (
        <Row gutter={6} className="my-3">
          <div className="font-semibold my-1">
            {t("subtype_restriction")}:
          </div>
          <Select
            optionList={Object.values(SubtypeRestriction).map((v) => ({
              label: t(v),
              value: v,
            }))}
            value={data.subtype_restriction}
            className="w-full"
            onChange={changeSubtypeRestriction}
          />
        </Row>
      )}
      {settings.notation !== "default" && !data.subtype && (
        <>
          <div className="font-semibold my-1">{t("cardinality")}:</div>
          <div className="flex items-center w-full gap-2">
            <Select
              optionList={
                RelationshipCardinalities[data.relationshipType] &&
                RelationshipCardinalities[data.relationshipType].map((c) => ({
                  label: c.label,
                  value: c.label,
                }))
              }
              value={data.cardinality}
              className="w-full"
              onChange={changeCardinality}
              disabled={!data.relationshipType}
              placeholder={t("select_cardinality")}
            />
            {(settings.notation === Notation.CROWS_FOOT || settings.notation === Notation.IDEF1X) && (
              <Button
                icon={<IconLoopTextStroked />}
                type="tertiary"
                onClick={toggleParentCardinality}
                aria-label="Toggle Parent Cardinality"
              />
            )}
          </div>
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
      <div className="my-2"></div>
      <Button
        icon={<IconDeleteStroked />}
        block
        type="danger"
        onClick={() => deleteRelationship(data.id)}
      >
        {t("delete")}
      </Button>
    </>
  );
}
