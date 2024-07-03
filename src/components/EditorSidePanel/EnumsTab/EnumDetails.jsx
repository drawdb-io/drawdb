import { useState } from "react";
import { Button, Input, TagInput } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useEnums, useUndoRedo } from "../../../hooks";
import { Action, ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function EnumDetails({ data, i }) {
  const { t } = useTranslation();
  const { deleteEnum, updateEnum } = useEnums();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <>
      <div className="flex justify-center items-center gap-2">
        <div className="font-semibold">{t("Name")}: </div>
        <Input
          value={data.name}
          placeholder={t("name")}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          onChange={(value) => updateEnum(i, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.ENUM,
                id: i,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_enum", {
                  enumName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>
      <TagInput
        separator={[",", ", ", " ,"]}
        value={data.values}
        addOnBlur
        className="my-2"
        placeholder={t("values")}
        validateStatus={data.values.length === 0 ? "error" : "default"}
        onChange={(v) => updateEnum(i, { values: v })}
        onFocus={() => setEditField({ values: data.values })}
        onBlur={() => {
          if (JSON.stringify(editField.values) === JSON.stringify(data.values))
            return;
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.ENUM,
              id: i,
              undo: editField,
              redo: { values: data.values },
              message: t("edit_enum", {
                enumName: data.name,
                extra: "[values]",
              }),
            },
          ]);
          setRedoStack([]);
        }}
      />
      <Button
        block
        icon={<IconDeleteStroked />}
        type="danger"
        onClick={() => deleteEnum(i, true)}
      >
        {t("delete")}
      </Button>
    </>
  );
}
