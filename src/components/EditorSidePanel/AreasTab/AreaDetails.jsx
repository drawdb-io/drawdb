import { useState } from "react";
import { Button, Input, ColorPicker } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useAreas, useUndoRedo } from "../../../hooks";
import { Action, ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function AreaInfo({ data, i }) {
  const { t } = useTranslation();
  const { deleteArea, updateArea } = useAreas();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <div id={`scroll_area_${data.id}`} className="my-3 flex gap-2 items-center">
      <Input
        value={data.name}
        placeholder={t("name")}
        onChange={(value) => updateArea(data.id, { name: value })}
        onFocus={(e) => setEditField({ name: e.target.value })}
        onBlur={(e) => {
          if (e.target.value === editField.name) return;
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.AREA,
              aid: i,
              undo: editField,
              redo: { name: e.target.value },
              message: t("edit_area", {
                areaName: e.target.value,
                extra: "[name]",
              }),
            },
          ]);
          setRedoStack([]);
        }}
      />
      <ColorPicker
        onChange={({ hex: color }) => {
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.AREA,
              aid: i,
              undo: { color: data.color },
              redo: { color },
              message: t("edit_area", {
                areaName: data.name,
                extra: "[color]",
              }),
            },
          ]);
          setRedoStack([]);
          updateArea(i, { color });
        }}
        usePopover={true}
        value={ColorPicker.colorStringToValue(data.color)}
      >
        <div
          className="h-[32px] w-[32px] rounded-sm shrink-0"
          style={{ backgroundColor: data.color }}
        />
      </ColorPicker>
      <Button
        icon={<IconDeleteStroked />}
        type="danger"
        onClick={() => deleteArea(i, true)}
      />
    </div>
  );
}
