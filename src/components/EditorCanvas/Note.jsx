import { useMemo, useState, useRef, useEffect } from "react";
import { Action, ObjectType, Tab, State } from "../../data/constants";
import { Input, Button, Popover } from "@douyinfe/semi-ui";
import ColorPicker from "../EditorSidePanel/ColorPicker";
import {
  IconEdit,
  IconDeleteStroked,
  IconLock,
  IconUnlock,
} from "@douyinfe/semi-icons";
import {
  useLayout,
  useUndoRedo,
  useSelect,
  useNotes,
  useSaveState,
  useTransform,
  useSettings,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { noteWidth, noteRadius, noteFold } from "../../data/constants";

export default function Note({ data, onPointerDown }) {
  const [editField, setEditField] = useState({});
  const [hovered, setHovered] = useState(false);
  const [resizing, setResizing] = useState(false);
  const initialWidthRef = useRef(data.width ?? noteWidth);
  const initialXRef = useRef(data.x);
  const { layout } = useLayout();
  const { t } = useTranslation();
  const { setSaveState } = useSaveState();
  const { updateNote, deleteNote } = useNotes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { transform } = useTransform();
  const { settings } = useSettings();
  const {
    selectedElement,
    setSelectedElement,
    bulkSelectedElements,
    setBulkSelectedElements,
  } = useSelect();
  const initialColorRef = useRef(data.color);

  const handleColorPick = (color) => {
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.NOTE &&
          e.nid === data.id &&
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
          element: ObjectType.NOTE,
          nid: data.id,
          undo: { color: undoColor },
          redo: { color: color },
          message: t("edit_note", {
            noteTitle: data.title,
            extra: "[color]",
          }),
        },
      ];
      return newStack;
    });
    setRedoStack([]);
  };

  const handleChange = (e) => {
    const textarea = document.getElementById(`note_${data.id}`);
    textarea.style.height = "0";
    textarea.style.height = textarea.scrollHeight + "px";
    const newHeight = textarea.scrollHeight + 42;
    updateNote(data.id, { content: e.target.value, height: newHeight });
  };

  const handleBlur = (e) => {
    if (e.target.value === editField.content) return;
    const textarea = document.getElementById(`note_${data.id}`);
    textarea.style.height = "0";
    textarea.style.height = textarea.scrollHeight + "px";
    const newHeight = textarea.scrollHeight + 16 + 20 + 4;
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.NOTE,
        nid: data.id,
        undo: editField,
        redo: { content: e.target.value, height: newHeight },
        message: t("edit_note", {
          noteTitle: e.target.value,
          extra: "[content]",
        }),
      },
    ]);
    setRedoStack([]);
  };

  const lockUnlockNote = (e) => {
    const locking = !data.locked;
    updateNote(data.id, { locked: locking });

    const lockNote = () => {
      setSelectedElement({
        ...selectedElement,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      });
      setBulkSelectedElements((prev) =>
        prev.filter((el) => el.id !== data.id || el.type !== ObjectType.NOTE),
      );
    };

    const unlockNote = () => {
      const elementInBulk = {
        id: data.id,
        type: ObjectType.NOTE,
        initialCoords: { x: data.x, y: data.y },
        currentCoords: { x: data.x, y: data.y },
      };
      if (e.ctrlKey || e.metaKey) {
        setBulkSelectedElements((prev) => [...prev, elementInBulk]);
      } else {
        setBulkSelectedElements([elementInBulk]);
      }
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NOTE,
        id: data.id,
        open: false,
      }));
    };

    if (locking) {
      lockNote();
    } else {
      unlockNote();
    }
  };

  const edit = () => {
    setSelectedElement((prev) => ({
      ...prev,
      ...(layout.sidebar && { currentTab: Tab.NOTES }),
      ...(!layout.sidebar && { element: ObjectType.NOTE }),
      id: data.id,
      open: true,
    }));

    if (layout.sidebar && selectedElement.currentTab === Tab.NOTES) {
      document
        .getElementById(`scroll_note_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  const isSelected = useMemo(() => {
    return (
      (selectedElement.id === data.id &&
        selectedElement.element === ObjectType.NOTE) ||
      bulkSelectedElements.some(
        (e) => e.type === ObjectType.NOTE && e.id === data.id,
      )
    );
  }, [selectedElement, data, bulkSelectedElements]);

  const width = data.width ?? noteWidth;
  const MIN_NOTE_WIDTH = 120;

  useEffect(() => {
    const textarea = document.getElementById(`note_${data.id}`);
    textarea.style.height = "0";
    textarea.style.height = textarea.scrollHeight + "px";
    const newHeight = textarea.scrollHeight + 42;
    updateNote(data.id, { height: newHeight });
  }, [data.id, updateNote]);

  return (
    <g
      onPointerEnter={(e) => e.isPrimary && setHovered(true)}
      onPointerLeave={(e) => e.isPrimary && setHovered(false)}
      onPointerDown={(e) => {
        // Required for onPointerLeave to trigger when a touch pointer leaves
        // https://stackoverflow.com/a/70976017/1137077
        e.target.releasePointerCapture(e.pointerId);
      }}
      onDoubleClick={edit}
    >
      <path
        d={`M${data.x + noteFold} ${data.y} L${data.x + width - noteRadius} ${
          data.y
        } A${noteRadius} ${noteRadius} 0 0 1 ${data.x + width} ${data.y + noteRadius} L${data.x + width} ${
          data.y + data.height - noteRadius
        } A${noteRadius} ${noteRadius} 0 0 1 ${data.x + width - noteRadius} ${data.y + data.height} L${
          data.x + noteRadius
        } ${data.y + data.height} A${noteRadius} ${noteRadius} 0 0 1 ${data.x} ${
          data.y + data.height - noteRadius
        } L${data.x} ${data.y + noteFold}`}
        fill={data.color}
        stroke={
          hovered
            ? "rgb(59 130 246)"
            : isSelected
              ? "rgb(59 130 246)"
              : "rgb(168 162 158)"
        }
        strokeDasharray={hovered ? 5 : 0}
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d={`M${data.x} ${data.y + noteFold} L${data.x + noteFold - noteRadius} ${
          data.y + noteFold
        } A${noteRadius} ${noteRadius} 0 0 0 ${data.x + noteFold} ${data.y + noteFold - noteRadius} L${
          data.x + noteFold
        } ${data.y} L${data.x} ${data.y + noteFold} Z`}
        fill={data.color}
        stroke={
          hovered
            ? "rgb(59 130 246)"
            : isSelected
              ? "rgb(59 130 246)"
              : "rgb(168 162 158)"
        }
        strokeDasharray={hovered ? 5 : 0}
        strokeLinejoin="round"
        strokeWidth="2"
      />

      {!layout.readOnly && !data.locked && hovered && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={data.x}
            cy={data.y + data.height / 2}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            opacity={1}
          />
          <circle
            cx={data.x + width}
            cy={data.y + data.height / 2}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            opacity={1}
          />
        </g>
      )}
      {!layout.readOnly && !data.locked && (
        <rect
          x={data.x - 4}
          y={data.y + 8}
          width={8}
          height={Math.max(0, data.height - 16)}
          fill="transparent"
          stroke="transparent"
          style={{ cursor: "ew-resize" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            initialWidthRef.current = data.width ?? noteWidth;
            initialXRef.current = data.x;
            setResizing(true);
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!resizing) return;
            const delta = e.movementX / (transform?.zoom || 1);
            const currentWidth = data.width ?? noteWidth;
            let proposedWidth = currentWidth - delta;
            let proposedX = data.x + delta;
            if (proposedWidth < MIN_NOTE_WIDTH) {
              const clampDelta = currentWidth - MIN_NOTE_WIDTH;
              proposedWidth = MIN_NOTE_WIDTH;
              proposedX = data.x + clampDelta;
            }
            if (proposedWidth !== data.width || proposedX !== data.x) {
              updateNote(data.id, { width: proposedWidth, x: proposedX });
            }
          }}
          onPointerUp={(e) => {
            if (!resizing) return;
            setResizing(false);
            e.stopPropagation();
            const finalWidth = data.width ?? noteWidth;
            const finalX = data.x;
            const startWidth = initialWidthRef.current;
            const startX = initialXRef.current;
            if (finalWidth !== startWidth || finalX !== startX) {
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.NOTE,
                  nid: data.id,
                  undo: { width: startWidth, x: startX },
                  redo: { width: finalWidth, x: finalX },
                  message: t("edit_note", {
                    noteTitle: data.title,
                    extra: "[width/x]",
                  }),
                },
              ]);
              setRedoStack([]);
            }
          }}
        />
      )}

      {!layout.readOnly && !data.locked && (
        <rect
          x={data.x + width - 4}
          y={data.y + 8}
          width={8}
          height={Math.max(0, data.height - 16)}
          fill="transparent"
          stroke="transparent"
          style={{ cursor: "ew-resize" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            initialWidthRef.current = data.width ?? noteWidth;
            setResizing(true);
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!resizing) return;
            const delta = e.movementX / (transform?.zoom || 1);
            const next = Math.max(MIN_NOTE_WIDTH, (data.width ?? noteWidth) + delta);
            if (next !== data.width) {
              updateNote(data.id, { width: next });
            }
          }}
          onPointerUp={(e) => {
            if (!resizing) return;
            setResizing(false);
            e.stopPropagation();
            const finalWidth = data.width ?? noteWidth;
            const startWidth = initialWidthRef.current;
            if (finalWidth !== startWidth) {
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.NOTE,
                  nid: data.id,
                  undo: { width: startWidth },
                  redo: { width: finalWidth },
                  message: t("edit_note", {
                    noteTitle: data.title,
                    extra: "[width]",
                  }),
                },
              ]);
              setRedoStack([]);
            }
          }}
        />
      )}
      <foreignObject
        x={data.x}
        y={data.y}
        width={width}
        height={data.height}
        onPointerDown={onPointerDown}
      >
        <div className="text-gray-900 select-none w-full h-full cursor-move px-3 py-2">
          <div className="flex justify-between gap-1 w-full">
            <label
              htmlFor={`note_${data.id}`}
              className="ms-5 overflow-hidden text-ellipsis"
            >
              {data.title}
            </label>
            {(hovered ||
              (selectedElement.element === ObjectType.NOTE &&
                selectedElement.id === data.id &&
                selectedElement.open &&
                !layout.sidebar)) && (
              <div className="flex items-center gap-1.5">
                <Button
                  icon={data.locked ? <IconLock /> : <IconUnlock />}
                  size="small"
                  theme="solid"
                  style={{
                    backgroundColor: "#2F68ADB3",
                  }}
                  onClick={lockUnlockNote}
                  disabled={layout.readOnly}
                />
                <Popover
                  visible={
                    selectedElement.element === ObjectType.NOTE &&
                    selectedElement.id === data.id &&
                    selectedElement.open &&
                    !layout.sidebar
                  }
                  onClickOutSide={() => {
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
                  }}
                  stopPropagation
                  content={
                    <div className="popover-theme">
                      <div className="font-semibold mb-2 ms-1">{t("edit")}</div>
                      <div className="w-[280px] flex items-center mb-2">
                        <Input
                          value={data.title}
                          placeholder={t("title")}
                          className="me-2"
                          readonly={layout.readOnly}
                          onChange={(value) =>
                            updateNote(data.id, { title: value })
                          }
                          onFocus={(e) =>
                            setEditField({ title: e.target.value })
                          }
                          onBlur={(e) => {
                            if (e.target.value === editField.title) return;
                            setUndoStack((prev) => [
                              ...prev,
                              {
                                action: Action.EDIT,
                                element: ObjectType.NOTE,
                                nid: data.id,
                                undo: editField,
                                redo: { title: e.target.value },
                                message: t("edit_note", {
                                  noteTitle: e.target.value,
                                  extra: "[title]",
                                }),
                              },
                            ]);
                            setRedoStack([]);
                          }}
                        />
                        <ColorPicker
                          usePopover={true}
                          readOnly={layout.readOnly}
                          value={data.color}
                          onChange={(color) => updateNote(data.id, { color })}
                          onColorPick={(color) => handleColorPick(color)}
                        />
                      </div>
                      <div className="flex">
                        <Button
                          block
                          type="danger"
                          disabled={layout.readOnly}
                          icon={<IconDeleteStroked />}
                          onClick={() => deleteNote(data.id, true)}
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    </div>
                  }
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
          <textarea
            id={`note_${data.id}`}
            readOnly={layout.readOnly}
            value={data.content}
            onChange={handleChange}
            onFocus={(e) =>
              setEditField({
                content: e.target.value,
                height: data.height,
              })
            }
            onBlur={handleBlur}
            className="w-full resize-none outline-hidden overflow-y-hidden border-none select-none"
            style={{ backgroundColor: data.color }}
          />
        </div>
      </foreignObject>
    </g>
  );
}