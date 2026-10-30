import { useState, useRef } from "react";
import { Button, Input } from "@douyinfe/semi-ui";
import ColorPicker from "../ColorPicker";
import {
  IconDeleteStroked,
  IconEyeClosed,
  IconEyeOpened,
} from "@douyinfe/semi-icons";
import {
  useAreaMembership,
  useAreas,
  useLayout,
  useUndoRedo,
} from "../../../hooks";
import { Action, ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";
import { DragHandle } from "../../SortableList/DragHandle";

export default function AreaInfo({ data }) {
  const { t } = useTranslation();
  const { layout } = useLayout();
  const { deleteArea, updateArea } = useAreas();
  const { toggleAreaHidden } = useAreaMembership();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const initialColorRef = useRef(data.color);

  const handleColorPick = (color) => {
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.AREA &&
          e.aid === data.id &&
          e.action === Action.EDIT &&
          e.redo?.color,
      );
      if (lastColorChange) {
        undoColor = lastColorChange.redo.color;
      }

      if (color === undoColor) return prev;

      const newStack = [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.AREA,
          aid: data.id,
          undo: { color: undoColor },
          redo: { color: color },
          message: t("edit_area", {
            areaName: data.name,
            extra: "[color]",
          }),
        },
      ];
      return newStack;
    });
    setRedoStack([]);
  };

  return (
    <div id={`scroll_area_${data.id}`} className="my-3 flex gap-2 items-center">
      <DragHandle readOnly={layout.readOnly} id={data.id} />
      <Input
        value={data.name}
        placeholder={t("name")}
        readonly={layout.readOnly}
        onChange={(value) => updateArea(data.id, { name: value })}
        onFocus={(e) => setEditField({ name: e.target.value })}
        onBlur={(e) => {
          if (e.target.value === editField.name) return;
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.AREA,
              aid: data.id,
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
        usePopover={true}
        value={data.color}
        readOnly={layout.readOnly}
        onChange={(color) => updateArea(data.id, { color })}
        onColorPick={(color) => handleColorPick(color)}
      />
      <Button
        theme="borderless"
        type="tertiary"
        disabled={layout.readOnly}
        icon={data.hidden ? <IconEyeClosed /> : <IconEyeOpened />}
        onClick={() => toggleAreaHidden(data)}
      />
      <Button
        type="danger"
        disabled={layout.readOnly}
        icon={<IconDeleteStroked />}
        onClick={() => deleteArea(data.id, true)}
      />
    </div>
  );
}
