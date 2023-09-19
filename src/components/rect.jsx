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
      <foreignObject x={props.x + 10} y={props.y + 25} width={80} height={50}>
        <body xmlns="http://www.w3.org/1999/xhtml">
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="text" className="w-full" />
          </form>
        </body>
      </foreignObject>
    </g>
  );
};

export default Rect;
