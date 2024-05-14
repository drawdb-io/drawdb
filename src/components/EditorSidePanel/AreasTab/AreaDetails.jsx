import { useState } from "react";
import { Row, Col, Button, Input, Popover, Toast } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useAreas, useSaveState, useUndoRedo } from "../../../hooks";
import {
  Action,
  ObjectType,
  State,
  defaultBlue,
} from "../../../data/constants";
import ColorPalette from "../../ColorPalette";
import {useTranslation} from "react-i18next";

export default function AreaInfo({ data, i }) {
  const { t } = useTranslation();
  const { setSaveState } = useSaveState();
  const { deleteArea, updateArea } = useAreas();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <Row
      gutter={6}
      type="flex"
      justify="start"
      align="middle"
      id={`scroll_area_${data.id}`}
      className="my-3"
    >
      <Col span={18}>
        <Input
          value={data.name}
          placeholder={t("Global.Name")}
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
                message: t("Page.editor.SidePanel.Subject Areas.Edit area name to", {name: e.target.value}),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </Col>
      <Col span={3}>
        <Popover
          content={
            <div className="popover-theme">
              <ColorPalette
                currentColor={data.color}
                onClearColor={() => {
                  updateArea(i, { color: defaultBlue });
                  setSaveState(State.SAVING);
                }}
                onPickColor={(c) => {
                  setUndoStack((prev) => [
                    ...prev,
                    {
                      action: Action.EDIT,
                      element: ObjectType.AREA,
                      aid: i,
                      undo: { color: data.color },
                      redo: { color: c },
                      message: t("Page.editor.SidePanel.Subject Areas.Edit area color to", {val: c}),
                    },
                  ]);
                  setRedoStack([]);
                  updateArea(i, { color: c });
                }}
              />
            </div>
          }
          trigger="click"
          position="bottomLeft"
          showArrow
        >
          <div
            className="h-[32px] w-[32px] rounded"
            style={{ backgroundColor: data.color }}
          />
        </Popover>
      </Col>
      <Col span={3}>
        <Button
          icon={<IconDeleteStroked />}
          type="danger"
          onClick={() => {
            Toast.success(t("Page.editor.SidePanel.Subject Areas.Area deleted"));
            deleteArea(i, true);
          }}
        />
      </Col>
    </Row>
  );
}
