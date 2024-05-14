import { useState } from "react";
import { Button, Popover, Input, Toast } from "@douyinfe/semi-ui";
import { IconEdit, IconDeleteStroked } from "@douyinfe/semi-icons";
import {
  Tab,
  Action,
  ObjectType,
  defaultBlue,
  State,
} from "../../data/constants";
import {
  useLayout,
  useSettings,
  useUndoRedo,
  useSelect,
  useAreas,
  useSaveState,
  useTransform,
} from "../../hooks";
import ColorPalette from "../ColorPalette";

export default function Area({ data, onMouseDown, setResize, setInitCoords }) {
  const [hovered, setHovered] = useState(false);
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { transform } = useTransform();
  const { setSaveState } = useSaveState();
  const { selectedElement, setSelectedElement } = useSelect();

  const handleResize = (e, dir) => {
    setResize({ id: data.id, dir: dir });
    setInitCoords({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      mouseX: e.clientX / transform.zoom,
      mouseY: e.clientY / transform.zoom,
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
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <foreignObject
        key={data.id}
        x={data.x}
        y={data.y}
        width={data.width > 0 ? data.width : 0}
        height={data.height > 0 ? data.height : 0}
        onMouseDown={onMouseDown}
      >
        <div
          className={`border-2 ${
            hovered
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
              {(hovered || (areaIsSelected() && !layout.sidebar)) && (
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
      {hovered && (
        <>
          <circle
            cx={data.x}
            cy={data.y}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nwse-resize"
            onMouseDown={(e) => handleResize(e, "tl")}
          />
          <circle
            cx={data.x + data.width}
            cy={data.y}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nesw-resize"
            onMouseDown={(e) => handleResize(e, "tr")}
          />
          <circle
            cx={data.x}
            cy={data.y + data.height}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nesw-resize"
            onMouseDown={(e) => handleResize(e, "bl")}
          />
          <circle
            cx={data.x + data.width}
            cy={data.y + data.height}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            cursor="nwse-resize"
            onMouseDown={(e) => handleResize(e, "br")}
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

  return (
    <div className="popover-theme">
      <div className="font-semibold mb-2 ms-1">Edit subject area</div>
      <div className="w-[280px] flex items-center mb-2">
        <Input
          value={data.name}
          placeholder="Name"
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
                message: `Edit area name to ${e.target.value}`,
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
                      message: `Edit area color to ${c}`,
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
          onClick={() => {
            Toast.success(`Area deleted!`);
            deleteArea(data.id);
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
