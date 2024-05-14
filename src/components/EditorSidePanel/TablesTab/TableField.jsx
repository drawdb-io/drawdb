import { Action, ObjectType, sqlDataTypes } from "../../../data/constants";
import { Row, Col, Input, Button, Popover, Select } from "@douyinfe/semi-ui";
import { IconMore, IconKeyStroked } from "@douyinfe/semi-icons";
import { getSize, hasCheck, hasPrecision, isSized } from "../../../utils/toSQL";
import { useTables, useTypes, useUndoRedo } from "../../../hooks";
import { useState } from "react";
import FieldDetails from "./FieldDetails";
import {useTranslation} from "react-i18next";

export default function TableField({ data, tid, index }) {
  const { t } = useTranslation();
  const { updateField } = useTables();
  const { types } = useTypes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <Row gutter={6} className="hover-1 my-2">
      <Col span={7}>
        <Input
          value={data.name}
          validateStatus={data.name === "" ? "error" : "default"}
          placeholder={t("Global.Name")}
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
                message: t("Page.editor.SidePanel.Tables.Edit table field name to", {val: e.target.value}),
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
            ...sqlDataTypes.map((value) => ({
              label: value,
              value: value,
            })),
            ...types.map((type) => ({
              label: type.name.toUpperCase(),
              value: type.name.toUpperCase(),
            })),
          ]}
          filter
          value={data.type}
          validateStatus={data.type === "" ? "error" : "default"}
          placeholder={t("Global.Type")}
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
                message: t("Page.editor.SidePanel.Tables.Edit table field type to",{type:value}),
              },
            ]);
            setRedoStack([]);
            const incr =
              data.increment &&
              (value === "INT" || value === "BIGINT" || value === "SMALLINT");
            if (value === "ENUM" || value === "SET") {
              updateField(tid, index, {
                type: value,
                default: "",
                values: data.values ? [...data.values] : [],
                increment: incr,
              });
            } else if (isSized(value) || hasPrecision(value)) {
              updateField(tid, index, {
                type: value,
                size: getSize(value),
                increment: incr,
              });
            } else if (
              value === "BLOB" ||
              value === "JSON" ||
              value === "UUID" ||
              value === "TEXT" ||
              incr
            ) {
              updateField(tid, index, {
                type: value,
                increment: incr,
                default: "",
                size: "",
                values: [],
              });
            } else if (hasCheck(value)) {
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
          title={t("Global.Not Null")}
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
                // message: `Edit table field to${
                //   data.notNull ? "" : " not"
                // } null`,
                message: t("Page.editor.SidePanel.Tables.Edit table field to null", {context: data.notNull ? "not" : ""})
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
          title={t("Global.Primary")}
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
                // message: `Edit table field to${
                //   data.primary ? " not" : ""
                // } primary`,
                message: t("Page.editor.SidePanel.Tables.Edit table field to primary", {context: data.primary ? "not" : ""})
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
