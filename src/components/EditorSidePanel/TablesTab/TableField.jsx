import { Action, ObjectType } from "../../../data/constants";
import { Row, Col, Input, Button, Popover, Select } from "@douyinfe/semi-ui";
import { IconMore, IconKeyStroked } from "@douyinfe/semi-icons";
import { useEnums, useDiagram, useTypes, useUndoRedo } from "../../../hooks";
import { useState } from "react";
import FieldDetails from "./FieldDetails";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";

export default function TableField({ data, tid, index }) {
  const { updateField } = useDiagram();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { tables, database } = useDiagram();
  const { t } = useTranslation();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <Row gutter={6} className="hover-1 my-2">
      <Col span={7}>
        <Input
          id={`scroll_table_${tid}_input_${index}`}
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder="Name"
          onChange={(value) => updateField(tid, index, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </Col>
      <Col span={8}>
        <Select
          className="w-full"
          optionList={[
            ...Object.keys(dbToTypes[database]).map((value) => ({
              label: value,
              value: value,
            })),
            ...types.map((type) => ({
              label: type.name.toUpperCase(),
              value: type.name.toUpperCase(),
            })),
            ...enums.map((type) => ({
              label: type.name.toUpperCase(),
              value: type.name.toUpperCase(),
            })),
          ]}
          filter
          value={data.type}
          validateStatus={data.type === "" ? "error" : "default"}
          placeholder="Type"
          onChange={(value) => {
            if (value === data.type) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: { type: data.type },
                redo: { type: value },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            const incr =
              data.increment && !!dbToTypes[database][value].canIncrement;

            if (value === "ENUM" || value === "SET") {
              updateField(tid, index, {
                type: value,
                default: "",
                values: data.values ? [...data.values] : [],
                increment: incr,
              });
            } else if (
              dbToTypes[database][value].isSized ||
              dbToTypes[database][value].hasPrecision
            ) {
              updateField(tid, index, {
                type: value,
                size: dbToTypes[database][value].defaultSize,
                increment: incr,
              });
            } else if (!dbToTypes[database][value].hasDefault || incr) {
              updateField(tid, index, {
                type: value,
                increment: incr,
                default: "",
                size: "",
                values: [],
              });
            } else if (dbToTypes[database][value].hasCheck) {
              updateField(tid, index, {
                type: value,
                check: "",
                increment: incr,
              });
            } else {
              updateField(tid, index, {
                type: value,
                increment: incr,
                size: "",
                values: [],
              });
            }
          }}
        />
      </Col>
      <Col span={3}>
        <Button
          type={data.notNull ? "primary" : "tertiary"}
          title={t("not_null")}
          theme={data.notNull ? "solid" : "light"}
          onClick={() => {
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: { notNull: data.notNull },
                redo: { notNull: !data.notNull },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            updateField(tid, index, { notNull: !data.notNull });
          }}
        >
          ?
        </Button>
      </Col>
      <Col span={3}>
        <Button
          type={data.primary ? "primary" : "tertiary"}
          title={t("primary")}
          theme={data.primary ? "solid" : "light"}
          onClick={() => {
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: { primary: data.primary },
                redo: { primary: !data.primary },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              },
            ]);
            setRedoStack([]);
            updateField(tid, index, { primary: !data.primary });
          }}
          icon={<IconKeyStroked />}
        />
      </Col>
      <Col span={3}>
        <Popover
          content={
            <div className="px-1 w-[240px] popover-theme">
              <FieldDetails data={data} index={index} tid={tid} />
            </div>
          }
          trigger="click"
          position="right"
          showArrow
        >
          <Button type="tertiary" icon={<IconMore />} />
        </Popover>
      </Col>
    </Row>
  );
}
