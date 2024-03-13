import { useContext, useState } from "react";
import { StateContext } from "../pages/Editor";
import { Action, ObjectType, noteThemes, Tab, State } from "../data/data";
import { Input, Button, Popover, Toast } from "@douyinfe/semi-ui";
import {
  IconEdit,
  IconDeleteStroked,
  IconCheckboxTick,
} from "@douyinfe/semi-icons";
import useLayout from "../hooks/useLayout";
import useUndoRedo from "../hooks/useUndoRedo";
import useSelect from "../hooks/useSelect";
import useNotes from "../hooks/useNotes";

export default function Note({ data, onMouseDown }) {
  const w = 180;
  const r = 3;
  const fold = 24;
  const [editField, setEditField] = useState({});
  const [hovered, setHovered] = useState(false);
  const { layout } = useLayout();
  const { setState } = useContext(StateContext);
  const { updateNote, deleteNote } = useNotes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  const handleChange = (e) => {
    const textarea = document.getElementById(`note_${data.id}`);
    textarea.style.height = "0";
    textarea.style.height = textarea.scrollHeight + "px";
    const newHeight = textarea.scrollHeight + 41;
    updateNote(data.id, { content: e.target.value, height: newHeight });
  };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <path
        d={`M${data.x + fold} ${data.y} L${data.x + w - r} ${
          data.y
        } A${r} ${r} 0 0 1 ${data.x + w} ${data.y + r} L${data.x + w} ${
          data.y + data.height - r
        } A${r} ${r} 0 0 1 ${data.x + w - r} ${data.y + data.height} L${
          data.x + r
        } ${data.y + data.height} A${r} ${r} 0 0 1 ${data.x} ${
          data.y + data.height - r
        } L${data.x} ${data.y + fold}`}
        fill={data.color}
        stroke={
          hovered
            ? "rgb(59 130 246)"
            : selectedElement.element === ObjectType.NOTE &&
              selectedElement.id === data.id
            ? "rgb(59 130 246)"
            : "rgb(168 162 158)"
        }
        strokeDasharray={hovered ? 4 : 0}
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d={`M${data.x} ${data.y + fold} L${data.x + fold - r} ${
          data.y + fold
        } A${r} ${r} 0 0 0 ${data.x + fold} ${data.y + fold - r} L${
          data.x + fold
        } ${data.y} L${data.x} ${data.y + fold} Z`}
        fill={data.color}
        stroke={
          hovered
            ? "rgb(59 130 246)"
            : selectedElement.element === ObjectType.NOTE &&
              selectedElement.id === data.id
            ? "rgb(59 130 246)"
            : "rgb(168 162 158)"
        }
        strokeDasharray={hovered ? 4 : 0}
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <foreignObject
        x={data.x}
        y={data.y}
        width={w}
        height={data.height}
        onMouseDown={onMouseDown}
      >
        <div className="text-gray-900 select-none w-full h-full cursor-move px-3 py-2">
          <label htmlFor={`note_${data.id}`} className="ms-5">
            {data.title}
          </label>
          <textarea
            id={`note_${data.id}`}
            value={data.content}
            onChange={handleChange}
            onFocus={(e) =>
              setEditField({
                content: e.target.value,
                height: data.height,
              })
            }
            onBlur={(e) => {
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
                  message: `Edit note content to "${e.target.value}"`,
                },
              ]);
              setRedoStack([]);
            }}
            className="w-full resize-none outline-none overflow-y-hidden border-none select-none"
            style={{ backgroundColor: data.color }}
          ></textarea>
          {(hovered ||
            (selectedElement.element === ObjectType.NOTE &&
              selectedElement.id === data.id &&
              selectedElement.open &&
              !layout.sidebar)) && (
            <div className="absolute top-2 right-3">
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
                  setState(State.SAVING);
                }}
                stopPropagation
                content={
                  <div className="popover-theme">
                    <div className="font-semibold mb-2 ms-1">Edit note</div>
                    <div className="w-[280px] flex items-center mb-2">
                      <Input
                        value={data.title}
                        placeholder="Title"
                        className="me-2"
                        onChange={(value) =>
                          updateNote(data.id, { title: value })
                        }
                        onFocus={(e) => setEditField({ title: e.target.value })}
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
                              message: `Edit note title to "${e.target.value}"`,
                            },
                          ]);
                          setRedoStack([]);
                        }}
                      />
                      <Popover
                        content={
                          <div className="popover-theme">
                            <div className="font-medium mb-1">Theme</div>
                            <hr />
                            <div className="py-3">
                              {noteThemes.map((c) => (
                                <button
                                  key={c}
                                  style={{ backgroundColor: c }}
                                  className="p-3 rounded-full mx-1"
                                  onClick={() => {
                                    setUndoStack((prev) => [
                                      ...prev,
                                      {
                                        action: Action.EDIT,
                                        element: ObjectType.NOTE,
                                        nid: data.id,
                                        undo: { color: data.color },
                                        redo: { color: c },
                                        message: `Edit note color to ${c}`,
                                      },
                                    ]);
                                    setRedoStack([]);
                                    updateNote(data.id, { color: c });
                                  }}
                                >
                                  {data.color === c ? (
                                    <IconCheckboxTick
                                      style={{ color: "white" }}
                                    />
                                  ) : (
                                    <IconCheckboxTick style={{ color: c }} />
                                  )}
                                </button>
                              ))}
                            </div>
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
                          Toast.success(`Note deleted!`);
                          deleteNote(data.id, true);
                        }}
                      >
                        Delete
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
                    backgroundColor: "#2f68ad",
                    opacity: "0.7",
                  }}
                  onClick={() => {
                    if (layout.sidebar) {
                      setSelectedElement((prev) => ({
                        ...prev,
                        currentTab: Tab.notes,
                      }));
                      if (selectedElement.currentTab !== Tab.notes) return;
                      document
                        .getElementById(`scroll_note_${data.id}`)
                        .scrollIntoView({ behavior: "smooth" });
                    } else {
                      setSelectedElement((prev) => ({
                        ...prev,
                        element: ObjectType.NOTE,
                        id: data.id,
                        open: true,
                      }));
                    }
                  }}
                ></Button>
              </Popover>
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
