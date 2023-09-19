import { React, useState } from "react";

export default function Area(props) {
  const [size, setSize] = useState({
    width: props.areaData.width,
    height: props.areaData.height,
  });

  return (
    <g>
      <foreignObject
        key={props.areaData.id}
        x={props.areaData.x}
        y={props.areaData.y}
        width={size.width}
        height={size.height}
        style={{ cursor: "move" }}
        onMouseDown={props.onMouseDown}
      >
        <div className="border-2 border-dashed border-blue-600 opacity-70 bg-slate-400 w-fill h-full">
          {props.areaData.name}
        </div>
      </foreignObject>
      <circle cx={props.areaData.x} cy={props.areaData.y} r={5} fill="blue" />
      <circle
        cx={props.areaData.x + props.areaData.width}
        cy={props.areaData.y}
        r={5}
        fill="blue"
      />
      <circle
        cx={props.areaData.x}
        cy={props.areaData.y + props.areaData.height}
        r={5}
        fill="blue"
      />
      <circle
        cx={props.areaData.x + size.width}
        cy={props.areaData.y + size.height}
        r={5}
        fill="blue"
        cursor="pointer"
        onMouseDown={(e) => {}}
      />
    </g>
  );
}
