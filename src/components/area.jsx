import { React, useState } from "react";

export default function Area(props) {
  const [hovered, setHovered] = useState(false);

  const handleMouseDown = (e, dir) => {
    props.setResize({id: props.areaData.id, dir: dir});
    props.setInitCoords({
      x: props.areaData.x,
      y: props.areaData.y,
      width: props.areaData.width,
      height: props.areaData.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <foreignObject
        key={props.areaData.id}
        x={props.areaData.x}
        y={props.areaData.y}
        width={props.areaData.width > 0 ? props.areaData.width : 0}
        height={props.areaData.height > 0 ? props.areaData.height : 0}
        onMouseDown={props.onMouseDown}
      >
        <div className="border-2 border-dashed border-blue-600 opacity-70 bg-slate-400 w-fill h-full select-none cursor-move">
          {props.areaData.name}
        </div>
      </foreignObject>
      {hovered && (
        <>
          <rect
            x={props.areaData.x - 5}
            y={props.areaData.y - 5}
            width={10}
            height={10}
            fill="lightblue"
            stroke="blue"
            strokeWidth={1}
            cursor="nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "tl")}
          />
          <rect
            x={props.areaData.x + props.areaData.width - 5}
            y={props.areaData.y - 5}
            width={10}
            height={10}
            fill="lightblue"
            stroke="blue"
            strokeWidth={1}
            cursor="nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "tr")}
          />
          <rect
            x={props.areaData.x - 5}
            y={props.areaData.y + props.areaData.height - 5}
            width={10}
            height={10}
            fill="lightblue"
            stroke="blue"
            strokeWidth={1}
            cursor="nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "bl")}
          />
          <rect
            x={props.areaData.x + props.areaData.width - 5}
            y={props.areaData.y + props.areaData.height - 5}
            width={10}
            height={10}
            fill="lightblue"
            stroke="blue"
            strokeWidth={1}
            cursor="nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "br")}
          />
        </>
      )}
    </g>
  );
}
