import { useMemo, useRef, useState } from "react";
import { Button, Popover, Input } from "@douyinfe/semi-ui";
import ColorPicker from "../EditorSidePanel/ColorPicker";
import {
  IconEdit,
  IconDeleteStroked,
  IconLock,
  IconUnlock,
} from "@douyinfe/semi-icons";
import { Tab, Action, ObjectType, State } from "../../data/constants";
import {
  useLayout,
  useSettings,
  useUndoRedo,
  useSelect,
  useAreas,
  useSaveState,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { useHover } from "usehooks-ts";

export default function Area({
  data,
  onPointerDown,
  setResize,
  setInitDimensions,
}) {
  const ref = useRef(null);
  const isHovered = useHover(ref);
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { setSaveState } = useSaveState();
  const { updateArea } = useAreas();
  const {
    selectedElement,
    setSelectedElement,
    bulkSelectedElements,
    setBulkSelectedElements,
  } = useSelect();

  const handleResize = (e, dir) => {
    setResize({ id: data.id, dir: dir });
    setInitDimensions({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
    });
  };

  const lockUnlockArea = () => {
    setBulkSelectedElements((prev) =>
      prev.filter((el) => el.id !== data.id || el.type !== ObjectType.AREA),
    );
    updateArea(data.id, { locked: !data.locked });
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

  const areaIsOpen = () =>
    selectedElement.element === ObjectType.AREA &&
    selectedElement.id === data.id &&
    selectedElement.open;

  const isSelected = useMemo(() => {
    return (
      (selectedElement.id === data.id &&
        selectedElement.element === ObjectType.AREA) ||
      bulkSelectedElements.some(
        (e) => e.type === ObjectType.AREA && e.id === data.id,
      )
    );
  }, [selectedElement, data, bulkSelectedElements]);

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
          className={`w-full h-full p-2 rounded cursor-move border-2 ${
            isHovered
              ? "border-dashed border-blue-500"
              : isSelected
                ? "border-blue-500 opacity-100"
                : "border-slate-400 opacity-100"
          }`}
          style={{ backgroundColor: `${data.color}66` }}
          onDoubleClick={edit}
        >
          <div className="flex justify-between gap-1 w-full">
            <div className="text-color select-none overflow-hidden text-ellipsis">
              {data.name}
            </div>
            {(isHovered || (areaIsOpen() && !layout.sidebar)) && (
              <div className="flex items-center gap-1.5">
                <Button
                  icon={data.locked ? <IconLock /> : <IconUnlock />}
                  size="small"
                  theme="solid"
                  style={{
                    backgroundColor: "#2F68ADB3",
                  }}
                  onClick={lockUnlockArea}
                />
                <Popover
                  visible={areaIsOpen() && !layout.sidebar}
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
              </div>
            )}
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
  const { updateArea, deleteArea } = useAreas();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { t } = useTranslation();
  const initialColorRef = useRef(data.color);

  const handleColorPick = (color) => {
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.AREA &&
          e.aid === data.id &&
          e.action === Action.EDIT &&
          e.redo.color,
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
        <ColorPicker
          usePopover={true}
          value={data.color}
          onChange={(color) => updateArea(data.id, { color })}
          onColorPick={(color) => handleColorPick(color)}
        />
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
