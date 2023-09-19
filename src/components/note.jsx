import React, { useContext, useState } from "react";
import { NoteContext, UndoRedoContext } from "../pages/editor";
import { Action, ObjectType } from "../data/data";

export default function Note(props) {
  const { setNotes } = useContext(NoteContext);
  const w = 180;
  const r = 3;
  const fold = 24;
  const { setUndoStack, setRedoStack } = useContext(UndoRedoContext);
  const [editField, setEditField] = useState({});
  const handleChange = (e) => {
    const textarea = document.getElementById(`note_${props.data.id}`);
    textarea.style.height = "0";
    textarea.style.height = textarea.scrollHeight + "px";
    const newHeight = textarea.scrollHeight + 41;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === props.data.id) {
          return { ...n, content: e.target.value, height: newHeight };
        }
        return n;
      })
    );
  };

  return (
    <g>
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
        stroke="#665b25"
        strokeLinejoin="round"
        strokeWidth="0.6"
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
        stroke="#665b25"
        strokeLinejoin="round"
        strokeWidth="0.6"
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
              if (e.target.value === editField.name) return;
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
                },
              ]);
              setRedoStack([]);
              setEditField({});
            }}
            className="w-full resize-none outline-none overflow-y-hidden border-none select-none"
            style={{ backgroundColor: props.data.color }}
          ></textarea>
        </div>
      </foreignObject>
    </g>
  );
}
