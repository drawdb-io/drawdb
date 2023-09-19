import React, { useRef, useState } from "react";
import { useDrop } from "react-dnd";
import Rect from "./rect";

export default function Canvas(props) {
  const [dragging, setDragging] = useState(-1);
  const [linking, setLinking] = useState(false);
  const [line, setLine] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [onRect, setOnRect] = useState(false);
  const [panning, setPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState("default");

  const canvas = useRef(null);

  const handleMouseDownRect = (e, id) => {
    const { clientX, clientY } = e;
    const rectangle = props.rectangles.find((rect) => rect.id === id);
    setOffset({
      x: clientX - rectangle.x,
      y: clientY - rectangle.y,
    });
    setDragging(id);
  };

  const handleMouseMove = (e) => {
    if (linking) {
      const rect = canvas.current.getBoundingClientRect();
      const offsetX = rect.left;
      const offsetY = rect.top;

      setLine({
        ...line,
        endX: e.clientX - offsetX,
        endY: e.clientY - offsetY,
      });
      return;
    }
    if (panning) {
      const dx = e.clientX - panOffset.x;
      const dy = e.clientY - panOffset.y;
      setPanOffset({ x: e.clientX, y: e.clientY });

      const updatedRectangles = props.rectangles.map((rect) => ({
        ...rect,
        x: rect.x + dx,
        y: rect.y + dy,
      }));
      props.setRectangles(updatedRectangles);
    } else if (dragging >= 0) {
      const { clientX, clientY } = e;
      const updatedRectangles = props.rectangles.map((rect) => {
        if (rect.id === dragging) {
          const updatedRect = {
            ...rect,
            x: clientX - offset.x,
            y: clientY - offset.y,
          };
          return updatedRect;
        }
        return rect;
      });
      props.setRectangles(updatedRectangles);
    }
  };

  const handleMouseDown = (e) => {
    if (dragging < 0) {
      if (!onRect) {
        setPanning(true);
        setPanOffset({ x: e.clientX, y: e.clientY });
        setCursor("grabbing");
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(-1);
    setPanning(false);
    setCursor("default");
    setLinking(false);
  };

  const deleteTable = (id) => {
    const updatedTables = [...props.rectangles];
    updatedTables.splice(id, 1);
    props.setRectangles(updatedTables);
  };

  const handleGripField = (id) => {
    setPanning(false);
    setDragging(-1);
    setLinking(true);
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
          width: 240,
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
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{ width: "100%", height: "100%", cursor: cursor }}
        >
          <defs>
            <pattern
              id="smallGrid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="lightblue"
                strokeWidth="0.5"
              />
            </pattern>
            <pattern
              id="grid"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <rect width="100" height="100" fill="url(#smallGrid)" />
              <path
                d="M 100 0 L 0 0 0 100"
                fill="none"
                stroke="lightblue"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />
          {props.rectangles.map((rectangle, i) => (
            <Rect
              key={rectangle.id}
              id={i}
              x={rectangle.x}
              y={rectangle.y}
              label={rectangle.label}
              width={rectangle.width}
              height={rectangle.height}
              setOnRect={setOnRect}
              handleGripField={handleGripField}
              // links={links}
              setLine={setLine}
              onMouseDown={(e) => handleMouseDownRect(e, rectangle.id)}
              onDelete={deleteTable}
            />
          ))}
          {linking && (
            <line
              x1={line.startX}
              y1={line.startY}
              x2={line.endX}
              y2={line.endY}
              stroke="red"
              strokeDasharray="5,5"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
