import React, { useContext, useState } from "react";
import { NoteContext } from "../pages/editor";

export default function Note(props) {
  const { setNotes } = useContext(NoteContext);
  const [size, setSize] = useState({ w: 180, h: 88 });
  const r = 3;
  const fold = 24;

  const handleChange = (e) => {
    const textarea = document.getElementById(`note_${props.data.id}`);
    const newHeight = textarea.scrollHeight + 16 + 20 + 4;
    setSize((prevSize) => ({ ...prevSize, h: newHeight }));
    textarea.style.height = "0";
    textarea.style.height = textarea.scrollHeight + "px";

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === props.data.id) {
          return { ...n, content: e.target.value };
        }
        return n;
      })
    );
  };

  return (
    <g>
      <path
        d={`M${props.data.x + fold} ${props.data.y} L${
          props.data.x + size.w - r
        } ${props.data.y} A${r} ${r} 0 0 1 ${props.data.x + size.w} ${
          props.data.y + r
        } L${props.data.x + size.w} ${
          props.data.y + size.h - r
        } A${r} ${r} 0 0 1 ${props.data.x + size.w - r} ${
          props.data.y + size.h
        } L${props.data.x + r} ${props.data.y + size.h} A${r} ${r} 0 0 1 ${
          props.data.x
        } ${props.data.y + size.h - r} L${props.data.x} ${props.data.y + fold}`}
        fill="#fcf7ac"
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
        fill="#fcf7ac"
        stroke="#665b25"
        strokeLinejoin="round"
        strokeWidth="0.6"
      />
      <foreignObject
        x={props.data.x}
        y={props.data.y}
        width={size.w}
        height={size.h}
        onMouseDown={props.onMouseDown}
      >
        <div className="text-gray-900 select-none w-full h-full cursor-move px-3 py-2">
          <label htmlFor={`note_${props.data.id}`} className="ms-5">{props.data.title}</label>
          <textarea
            id={`note_${props.data.id}`}
            value={props.data.content}
            onInput={handleChange}
            className="mt-1 w-full resize-none outline-none overflow-y-hidden border-none select-none bg-[#fcf7ac]"
          ></textarea>
        </div>
      </foreignObject>
    </g>
  );
}
