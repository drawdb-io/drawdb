import { useContext, useState } from "react";
import { TabContext, StateContext } from "../pages/Editor";
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

export default function Note(props) {
  const [editField, setEditField] = useState({});
  const [hovered, setHovered] = useState(false);
  const w = 180;
  const r = 3;
  const fold = 24;
  const { updateNote, deleteNote } = useNotes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { setState } = useContext(StateContext);
  const { layout } = useLayout();
  const { tab, setTab } = useContext(TabContext);
  const { selectedElement, setSelectedElement } = useSelect();

  const handleChange = (e) => {
    const textarea = document.getElementById(`note_${props.data.id}`);
    textarea.style.height = "0";
    textarea.style.height = textarea.scrollHeight + "px";
    const newHeight = textarea.scrollHeight + 41;
    updateNote(props.data.id, { content: e.target.value, height: newHeight });
  };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <path
        d={`M${props.data.x + fold} ${props.data.y} L${props.data.x + w - r} ${
          props.data.y
        } A${r} ${r} 0 0 1 ${props.data.x + w} ${props.data.y + r} L${
          props.data.x + w
        } ${props.data.y + props.data.height - r} A${r} ${r} 0 0 1 ${
          props.data.x + w - r
        } ${props.data.y + props.data.height} L${props.data.x + r} ${
          props.data.y + props.data.height
        } A${r} ${r} 0 0 1 ${props.data.x} ${
          props.data.y + props.data.height - r
        } L${props.data.x} ${props.data.y + fold}`}
        fill={props.data.color}
        stroke={
          hovered
            ? "rgb(59 130 246)"
            : selectedElement.element === ObjectType.NOTE &&
              selectedElement.id === props.data.id
            ? "rgb(59 130 246)"
            : "rgb(168 162 158)"
        }
        strokeDasharray={hovered ? 4 : 0}
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d={`M${props.data.x} ${props.data.y + fold} L${
          props.data.x + fold - r
        } ${props.data.y + fold} A${r} ${r} 0 0 0 ${props.data.x + fold} ${
          props.data.y + fold - r
        } L${props.data.x + fold} ${props.data.y} L${props.data.x} ${
          props.data.y + fold
        } Z`}
        fill={props.data.color}
        stroke={
          hovered
            ? "rgb(59 130 246)"
            : selectedElement.element === ObjectType.NOTE &&
              selectedElement.id === props.data.id
            ? "rgb(59 130 246)"
            : "rgb(168 162 158)"
        }
        strokeDasharray={hovered ? 4 : 0}
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <foreignObject
        x={props.data.x}
        y={props.data.y}
        width={w}
        height={props.data.height}
        onMouseDown={props.onMouseDown}
      >
        <div className="text-gray-900 select-none w-full h-full cursor-move px-3 py-2">
          <label htmlFor={`note_${props.data.id}`} className="ms-5">
            {props.data.title}
          </label>
          <textarea
            id={`note_${props.data.id}`}
            value={props.data.content}
            onChange={handleChange}
            onFocus={(e) =>
              setEditField({
                content: e.target.value,
                height: props.data.height,
              })
            }
            onBlur={(e) => {
              if (e.target.value === editField.content) return;
              const textarea = document.getElementById(`note_${props.data.id}`);
              textarea.style.height = "0";
              textarea.style.height = textarea.scrollHeight + "px";
              const newHeight = textarea.scrollHeight + 16 + 20 + 4;
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.NOTE,
                  nid: props.data.id,
                  undo: editField,
                  redo: { content: e.target.value, height: newHeight },
                  message: `Edit note content to "${e.target.value}"`,
                },
              ]);
              setRedoStack([]);
            }}
            className="w-full resize-none outline-none overflow-y-hidden border-none select-none"
            style={{ backgroundColor: props.data.color }}
          ></textarea>
          {(hovered ||
            (selectedElement.element === ObjectType.NOTE &&
              selectedElement.id === props.data.id &&
              selectedElement.openDialogue &&
              !layout.sidebar)) && (
            <div className="absolute top-2 right-3">
              <Popover
                visible={
                  selectedElement.element === ObjectType.NOTE &&
                  selectedElement.id === props.data.id &&
                  selectedElement.openDialogue &&
                  !layout.sidebar
                }
                onClickOutSide={() => {
                  setSelectedElement((prev) => ({
                    ...prev,
                    openDialogue: false,
                  }));
                  setState(State.SAVING);
                }}
                stopPropagation
                content={
                  <div className="popover-theme">
                    <div className="font-semibold mb-2 ms-1">Edit note</div>
                    <div className="w-[280px] flex items-center mb-2">
                      <Input
                        value={props.data.title}
                        placeholder="Title"
                        className="me-2"
                        onChange={(value) =>
                          updateNote(props.data.id, { title: value })
                        }
                        onFocus={(e) => setEditField({ title: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value === editField.title) return;
                          setUndoStack((prev) => [
                            ...prev,
                            {
                              action: Action.EDIT,
                              element: ObjectType.NOTE,
                              nid: props.data.id,
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
                                        nid: props.data.id,
                                        undo: { color: props.data.color },
                                        redo: { color: c },
                                        message: `Edit note color to ${c}`,
                                      },
                                    ]);
                                    setRedoStack([]);
                                    updateNote(props.data.id, { color: c });
                                  }}
                                >
                                  {props.data.color === c ? (
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
                          style={{ backgroundColor: props.data.color }}
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
                          deleteNote(props.data.id, true);
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
                      setTab(Tab.notes);
                      if (tab !== Tab.notes) return;
                      document
                        .getElementById(`scroll_note_${props.data.id}`)
                        .scrollIntoView({ behavior: "smooth" });
                    } else {
                      setSelectedElement({
                        element: ObjectType.NOTE,
                        id: props.data.id,
                        openDialogue: true,
                        openCollapse: false,
                      });
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
