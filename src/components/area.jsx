import { React, useState } from "react";

export default function Area(props) {
  const [resize, setResize] = useState("none");
  const [initCoords, setInitCoords] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const handleMouseDown = (e, dir) => {
    setResize(dir);
    props.setPanning(false);
    setInitCoords({
      x: props.areaData.x,
      y: props.areaData.y,
      width: props.areaData.width,
      height: props.areaData.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  const handleMouseMove = (e) => {
    if (resize === "none") return;

    let newX = initCoords.x;
    let newY = initCoords.y;
    let newWidth = initCoords.width;
    let newHeight = initCoords.height;
    props.setPanning(false);
    if (resize === "br") {
      newWidth = initCoords.width + (e.clientX - initCoords.mouseX);
      newHeight = initCoords.height + (e.clientY - initCoords.mouseY);
    } else if (resize === "tl") {
      newX = initCoords.x + (e.clientX - initCoords.mouseX);
      newY = initCoords.y + (e.clientY - initCoords.mouseY);
      newWidth = initCoords.width - (e.clientX - initCoords.mouseX);
      newHeight = initCoords.height - (e.clientY - initCoords.mouseY);
    } else if (resize === "tr") {
      newY = initCoords.y + (e.clientY - initCoords.mouseY);
      newWidth = initCoords.width + (e.clientX - initCoords.mouseX);
      newHeight = initCoords.height - (e.clientY - initCoords.mouseY);
    } else if (resize === "bl") {
      newX = initCoords.x + (e.clientX - initCoords.mouseX);
      newWidth = initCoords.width - (e.clientX - initCoords.mouseX);
      newHeight = initCoords.height + (e.clientY - initCoords.mouseY);
    }

    props.setAreas((prev) => {
      return prev.map((a) => {
        if (a.id === props.areaData.id) {
          return {
            ...a,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          };
        }
        return a;
      });
    });
  };

  const handleMouseUp = () => {
    setResize("none");
  };

  return (
    <g>
      <foreignObject
        key={props.areaData.id}
        x={props.areaData.x}
        y={props.areaData.y}
        width={props.areaData.width}
        height={props.areaData.height}
        style={{ cursor: "move" }}
        onMouseDown={props.onMouseDown}
      >
        <div className="border-2 border-dashed border-blue-600 opacity-70 bg-slate-400 w-fill h-full select-none">
          {props.areaData.name}
        </div>
      </foreignObject>
      <rect
        x={props.areaData.x - 6}
        y={props.areaData.y - 6}
        width={32}
        height={32}
        fill="lightblue"
        stroke="blue"
        strokeWidth={1}
        cursor="nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "tl")}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          setResize("none");
        }}
      />
      <rect
        x={props.areaData.x + props.areaData.width - 6}
        y={props.areaData.y - 6}
        width={32}
        height={32}
        fill="lightblue"
        stroke="blue"
        strokeWidth={1}
        cursor="nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "tr")}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          setResize("none");
        }}
      />
      <rect
        x={props.areaData.x - 6}
        y={props.areaData.y + props.areaData.height - 6}
        width={32}
        height={32}
        fill="lightblue"
        stroke="blue"
        strokeWidth={1}
        cursor="nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "bl")}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          setResize("none");
        }}
      />
      <rect
        x={props.areaData.x + props.areaData.width - 6}
        y={props.areaData.y + props.areaData.height - 6}
        width={32}
        height={32}
        fill="lightblue"
        stroke="blue"
        strokeWidth={1}
        cursor="nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "br")}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          setResize("none");
        }}
      />
    </g>
  );
}
