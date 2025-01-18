import { useState } from "react";
import { Action, ObjectType } from "../../../data/constants";
import {
  Collapse,
  Row,
  Col,
  Input,
  TextArea,
  Button,
  Card,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked, IconPlus } from "@douyinfe/semi-icons";
import { useUndoRedo, useTypes, useDiagram } from "../../../hooks";
import TypeField from "./TypeField";
import { useTranslation } from "react-i18next";

export default function TypeInfo({ index, data }) {
  const { deleteType, updateType } = useTypes();
  const { tables, updateField } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const { t } = useTranslation();

  return (
    <div id={`scroll_type_${index}`}>
      <Collapse.Panel
        header={
          <div className="overflow-hidden text-ellipsis whitespace-nowrap">
            {data.name}
          </div>
        }
        itemKey={`${index}`}
      >
        <div className="flex items-center mb-2.5">
          <div className="text-md font-semibold break-keep">{t("name")}: </div>
          <Input
            value={data.name}
            validateStatus={data.name === "" ? "error" : "default"}
            placeholder={t("name")}
            className="ms-2"
            onChange={(value) => {
              updateType(index, { name: value });
              tables.forEach((table, i) => {
                table.fields.forEach((field, j) => {
                  if (field.type.toLowerCase() === data.name.toLowerCase()) {
                    updateField(i, j, { type: value.toUpperCase() });
                  }
                });
              });
            }}
            onFocus={(e) => setEditField({ name: e.target.value })}
            onBlur={(e) => {
              if (e.target.value === editField.name) return;

              const updatedFields = tables.reduce((acc, table) => {
                table.fields.forEach((field, i) => {
                  if (field.type.toLowerCase() === data.name.toLowerCase()) {
                    acc.push({ tid: table.id, fid: i });
                  }
                });
                return acc;
              }, []);

              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TYPE,
                  component: "self",
                  tid: index,
                  undo: editField,
                  redo: { name: e.target.value },
                  updatedFields,
                  message: t("edit_type", {
                    typeName: data.name,
                    extra: "[name]",
                  }),
                },
              ]);
              setRedoStack([]);
            }}
          />
        </div>
        {data.fields.map((f, j) => (
          <TypeField key={j} data={f} fid={j} tid={index} />
        ))}
        <Card
          bodyStyle={{ padding: "4px" }}
          style={{ marginTop: "12px", marginBottom: "12px" }}
          headerLine={false}
        >
          <Collapse lazyRender keepDOM={false}>
            <Collapse.Panel header={t("comment")} itemKey="1">
              <TextArea
                field="comment"
                value={data.comment}
                autosize
                placeholder={t("comment")}
                rows={1}
                onChange={(value) =>
                  updateType(index, { comment: value }, false)
                }
                onFocus={(e) => setEditField({ comment: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value === editField.comment) return;
                  setUndoStack((prev) => [
                    ...prev,
                    {
                      action: Action.EDIT,
                      element: ObjectType.TYPE,
                      component: "self",
                      tid: index,
                      undo: editField,
                      redo: { comment: e.target.value },
                      message: t("edit_type", {
                        typeName: data.name,
                        extra: "[comment]",
                      }),
                    },
                  ]);
                  setRedoStack([]);
                }}
              />
            </Collapse.Panel>
          </Collapse>
        </Card>
        <Row gutter={6} className="mt-2">
          <Col span={12}>
            <Button
              icon={<IconPlus />}
              onClick={() => {
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TYPE,
                    component: "field_add",
                    tid: index,
                    message: t("edit_type", {
                      typeName: data.name,
                      extra: "[add field]",
                    }),
                  },
                ]);
                setRedoStack([]);
                updateType(index, {
                  fields: [
                    ...data.fields,
                    {
                      name: "",
                      type: "",
                    },
                  ],
                });
              }}
              block
            >
              {t("add_field")}
            </Button>
          </Col>
          <Col span={12}>
            <Button
              icon={<IconDeleteStroked />}
              type="danger"
              onClick={() => deleteType(index)}
              block
            >
              {t("delete")}
            </Button>
          </Col>
        </Row>
      </Collapse.Panel>
    </div>
  );
}
