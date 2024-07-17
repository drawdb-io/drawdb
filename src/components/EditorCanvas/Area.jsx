import { useRef, useState } from "react";
import { Button, Popover, Input } from "@douyinfe/semi-ui";
import { IconEdit, IconDeleteStroked } from "@douyinfe/semi-icons";
import {
  Tab,
  Action,
  ObjectType,
  defaultBlue,
  State,
} from "../../data/constants";
import {
  useCanvas,
  useLayout,
  useSettings,
  useUndoRedo,
  useSelect,
  useAreas,
  useSaveState,
} from "../../hooks";
import ColorPalette from "../ColorPicker";
import { useTranslation } from "react-i18next";
import { useHover } from "usehooks-ts";

export default function Area({
  data,
  onPointerDown,
  setResize,
  setInitCoords,
}) {
  const ref = useRef(null);
  const isHovered = useHover(ref);
  const {
    pointer: {
      spaces: { diagram: pointer },
    },
  } = useCanvas();
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { setSaveState } = useSaveState();
  const { selectedElement, setSelectedElement } = useSelect();

  const handleResize = (e, dir) => {
    setResize({ id: data.id, dir: dir });
    setInitCoords({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      pointerX: pointer.x,
      pointerY: pointer.y,
    });
  };

  const edit = () => {
    if (layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.AREA,
        id: data.id,
        currentTab: Tab.AREAS,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.AREAS) return;
      document
        .getElementById(`scroll_area_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.AREA,
        id: data.id,
        open: true,
      }));
    }
  };

  const onClickOutSide = () => {
    if (selectedElement.editFromToolbar) {
      setSelectedElement((prev) => ({
        ...prev,
        editFromToolbar: false,
      }));
      return;
    }
    setSelectedElement((prev) => ({
      ...prev,
      open: false,
    }));
    setSaveState(State.SAVING);
  };

  const areaIsSelected = () =>
    selectedElement.element === ObjectType.AREA &&
    selectedElement.id === data.id &&
    selectedElement.open;

  return (
    <g ref={ref}>
      <foreignObject
        key={data.id}
        x={data.x}
        y={data.y}
        width={data.width > 0 ? data.width : 0}
        height={data.height > 0 ? data.height : 0}
        onPointerDown={onPointerDown}
      >
        <div
          className={`border-2 ${
            isHovered
              ? "border-dashed border-blue-500"
              : selectedElement.element === ObjectType.AREA &&
                  selectedElement.id === data.id
                ? "border-blue-500"
                : "border-slate-400"
          } w-full h-full cursor-move rounded`}
        >
          <div
            className="w-fill p-2 h-full"
            style={{ backgroundColor: `${data.color}66` }}
          >
            <div className="flex justify-between gap-1 w-full">
              <div className="text-color select-none overflow-hidden text-ellipsis">
                {data.name}
              </div>
              {(isHovered || (areaIsSelected() && !layout.sidebar)) && (
                <Popover
                  visible={areaIsSelected() && !layout.sidebar}
                  onClickOutSide={onClickOutSide}
                  stopPropagation
                  content={<EditPopoverContent data={data} />}
                  trigger="custom"
                  position="rightTop"
                  showArrow
                >
                  <Button
                    icon={<IconEdit />}
                    size="small"
                    theme="solid"
                    style={{
                      backgroundColor: "#2F68ADB3",
                    }}
                    onClick={edit}
                  />
                </Popover>
              )}
            </div>
          </div>
        </div>
      </foreignObject>
      {isHovered && (
        <>
          <circle
            cx={data.x}
            cy={data.y}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nwse-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "tl")}
          />
          <circle
            cx={data.x + data.width}
            cy={data.y}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nesw-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "tr")}
          />
          <circle
            cx={data.x}
            cy={data.y + data.height}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nesw-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "bl")}
          />
          <circle
            cx={data.x + data.width}
            cy={data.y + data.height}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nwse-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "br")}
          />
        </>
      )}
    </g>
  );
}

function EditPopoverContent({ data }) {
  const [editField, setEditField] = useState({});
  const { setSaveState } = useSaveState();
  const { updateArea, deleteArea } = useAreas();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { t } = useTranslation();

  return (
    <div className="popover-theme">
      <div className="font-semibold mb-2 ms-1">{t("edit")}</div>
      <div className="w-[280px] flex items-center mb-2">
        <Input
          value={data.name}
          placeholder={t("name")}
          className="me-2"
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
        <Popover
          content={
            <div className="popover-theme">
              <ColorPalette
                currentColor={data.color}
                onPickColor={(c) => {
                  setUndoStack((prev) => [
                    ...prev,
                    {
                      action: Action.EDIT,
                      element: ObjectType.AREA,
                      aid: data.id,
                      undo: { color: data.color },
                      redo: { color: c },
                      message: t("edit_area", {
                        areaName: data.name,
                        extra: "[color]",
                      }),
                    },
                  ]);
                  setRedoStack([]);
                  updateArea(data.id, {
                    color: c,
                  });
                }}
                onClearColor={() => {
                  updateArea(data.id, {
                    color: defaultBlue,
                  });
                  setSaveState(State.SAVING);
                }}
              />
            </div>
          }
          position="rightTop"
          showArrow
        >
          <div
            className="h-[32px] w-[32px] rounded"
            style={{ backgroundColor: data.color }}
          />
        </Popover>
      </div>
      <div className="flex">
        <Button
          icon={<IconDeleteStroked />}
          type="danger"
          block
          onClick={() => deleteArea(data.id, true)}
        >
          {t("delete")}
        </Button>
      </div>
    </div>
  );
}
