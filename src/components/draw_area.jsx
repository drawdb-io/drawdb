import React, { useRef, useState } from "react";
import { useDrop } from "react-dnd";
import Rect from "./rect";

export default function Canvas(props) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const canvas = useRef(null);

  const handleMouseDown = (event, id) => {
    const { clientX, clientY } = event;
    const rectangle = props.rectangles.find((rect) => rect.id === id);
    setOffset({
      x: clientX - rectangle.x,
      y: clientY - rectangle.y,
    });
    setDragging(id);
  };

  const handleMouseMove = (event) => {
    if (dragging === false) return;
    const { clientX, clientY } = event;
    const updatedRectangles = props.rectangles.map((rect) => {
      if (rect.id === dragging) {
        return {
          ...rect,
          x: clientX - offset.x,
          y: clientY - offset.y,
        };
      }
      return rect;
    });
    props.setRectangles(updatedRectangles);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const [, drop] = useDrop(
    () => ({
      accept: "CARD",
      drop: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const canvasRect = canvas.current.getBoundingClientRect();
        const x = offset.x - canvasRect.left - 100 * 0.5;
        const y = offset.y - canvasRect.top - 100 * 0.5;
        const newRectangle = {
          id: props.rectangles.length + 1,
          x,
          y,
          width: 100,
          height: 100,
          label: `rect ${props.rectangles.length + 1}`,
        };
        props.setRectangles([...props.rectangles, newRectangle]);
        props.setCode((prev) =>
          prev === ""
            ? `CREATE TABLE \`${newRectangle.label}\`;`
            : `${prev}\n\nCREATE TABLE \`${newRectangle.label}\`;`
        );
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [props.rectangles]
  );

  return (
    <div ref={drop} className="flex-grow" id="canvas">
      <div ref={canvas} className="w-full h-screen">
        <svg
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ width: "100%", height: "100%" }}
        >
          {props.rectangles.map((rectangle) => (
            <Rect
              key={rectangle.id}
              x={rectangle.x}
              y={rectangle.y}
              label={rectangle.label}
              width={rectangle.width}
              height={rectangle.height}
              onMouseDown={(event) => handleMouseDown(event, rectangle.id)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
