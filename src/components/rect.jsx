import React from "react";
import { Button } from "@arco-design/web-react";

const Rect = (props) => {
  return (
    <g>
      <foreignObject
        key={props.id}
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        style={{ fill: "blue", cursor: "move" }}
        onMouseDown={props.onMouseDown}
      >
        <div xmlns="http://www.w3.org/1999/xhtml" className="bg-blue p-3">
          <div className="text-white">{props.label}</div>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="text" className="w-full" />
          </form>
          <Button type="secondary" onClick={(e) => console.log("sup")}>
            sup
          </Button>
        </div>
      </foreignObject>
    </g>
  );
};

export default Rect;
