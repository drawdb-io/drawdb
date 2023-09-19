import React from "react";

const Rect = (props) => {
  return (
    <g>
      <rect
        key={props.id}
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        style={{ fill: "blue", cursor: "move" }}
        onMouseDown={props.onMouseDown}
      />
      <text
        x={props.x + 50}
        y={props.y + 50}
        textAnchor="middle"
        style={{ fill: "white" }}
      >
        {props.label}
      </text>
    </g>
  );
};

export default Rect;
