import { React, useState } from "react";

export default function Area(props) {
  const [resize, setResize] = useState("none");
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [initialY, setInitialY] = useState(0);

  const handleMouseDown = (e, dir) => {
    setResize(dir);
    props.setPanning(false);
    setInitialMouseX(e.clientX);
    setInitialMouseY(e.clientY);
    setInitialWidth(props.areaData.width);
    setInitialHeight(props.areaData.height);
    setInitialX(props.areaData.x);
    setInitialY(props.areaData.y);
  };

  const handleMouseMove = (e) => {
    props.setPanning(false);
    if (resize === "br") {
      const newWidth = initialWidth + (e.clientX - initialMouseX);
      const newHeight = initialHeight + (e.clientY - initialMouseY);
      props.setAreas((prev) => {
        return prev.map((a) => {
          if (a.id === props.areaData.id) {
            return {
              ...a,
              width: newWidth,
              height: newHeight,
            };
          }
          return a;
        });
      });
    } else if (resize === "tl") {
      const newX = initialX + (e.clientX - initialMouseX);
      const newY = initialY + (e.clientY - initialMouseY);
      const newWidth = initialWidth - (e.clientX - initialMouseX);
      const newHeight = initialHeight - (e.clientY - initialMouseY);
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
    } else if (resize === "tr") {
      const newY = initialY + (e.clientY - initialMouseY);
      const newWidth = initialWidth + (e.clientX - initialMouseX);
      const newHeight = initialHeight - (e.clientY - initialMouseY);
      props.setAreas((prev) => {
        return prev.map((a) => {
          if (a.id === props.areaData.id) {
            return {
              ...a,
              y: newY,
              width: newWidth,
              height: newHeight,
            };
          }
          return a;
        });
      });
    } else if (resize === "bl") {
      const newX = initialX + (e.clientX - initialMouseX);
      const newWidth = initialWidth - (e.clientX - initialMouseX);
      const newHeight = initialHeight + (e.clientY - initialMouseY);
      props.setAreas((prev) => {
        return prev.map((a) => {
          if (a.id === props.areaData.id) {
            return {
              ...a,
              x: newX,
              width: newWidth,
              height: newHeight,
            };
          }
          return a;
        });
      });
    } else {
      return;
    }
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
