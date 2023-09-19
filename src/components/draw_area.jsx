import React, { useRef, useState } from "react";
import { useDrop } from "react-dnd";
import Rect from "./rect";
import Node from "./node";

export default function Canvas(props) {
  const [dragging, setDragging] = useState(-1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [links, setLinks] = useState([]);
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
    if (dragging < 0 && panning) {
      const dx = e.clientX - panOffset.x;
      const dy = e.clientY - panOffset.y;
      setPanOffset({ x: e.clientX, y: e.clientY });

      const updatedRectangles = props.rectangles.map((rect) => ({
        ...rect,
        x: rect.x + dx,
        y: rect.y + dy,
      }));
      props.setRectangles(updatedRectangles);

      const updatedLinks = links.map((link) => ({
        ...link,
        x: link.x + dx,
        y: link.y + dy,
      }));
      setLinks(updatedLinks);
    } else if (dragging >= 0) {
      const { clientX, clientY } = e;
      const updatedRectangles = props.rectangles.map((rect) => {
        if (rect.id === dragging) {
          const updatedRect = {
            ...rect,
            x: clientX - offset.x,
            y: clientY - offset.y,
          };
          const updatedLinks = links.map((link) => {
            let updatedLink = link;
            if (link.rect === updatedRect.id) {
              switch (link.node) {
                case Node.TOP:
                  updatedLink = {
                    ...link,
                    x: updatedRect.x + updatedRect.width / 2,
                    y: updatedRect.y,
                  };
                  break;
                case Node.BOTTOM:
                  updatedLink = {
                    ...link,
                    x: updatedRect.x + updatedRect.width / 2,
                    y: updatedRect.y + updatedRect.height,
                  };
                  break;
                case Node.LEFT:
                  updatedLink = {
                    ...link,
                    x: updatedRect.x,
                    y: updatedRect.y + updatedRect.height / 2,
                  };
                  break;
                case Node.RIGHT:
                  updatedLink = {
                    ...link,
                    x: updatedRect.x + updatedRect.width,
                    y: updatedRect.y + updatedRect.height / 2,
                  };
                  break;
                default:
                  break;
              }
            }
            return updatedLink;
          });

          setLinks(updatedLinks);
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
  };

  const [, drop] = useDrop(
    () => ({
      accept: "CARD",
      drop: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const canvasRect = canvas.current.getBoundingClientRect();
        const x = offset.x - canvasRect.left - 100 * 0.5;
        const y = offset.y - canvasRect.top - 100 * 0.5;
        const d = {
          id: props.rectangles.length + 1,
          x,
          y,
          width: 240,
          height: 100,
          label: `rect ${props.rectangles.length + 1}`,
        };
        props.setRectangles([...props.rectangles, d]);
        props.setCode((prev) =>
          prev === ""
            ? `CREATE TABLE \`${d.label}\`;`
            : `${prev}\n\nCREATE TABLE \`${d.label}\`;`
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
          {props.rectangles.map((rectangle) => (
            <Rect
              key={rectangle.id}
              id={rectangle.id}
              x={rectangle.x}
              y={rectangle.y}
              label={rectangle.label}
              width={rectangle.width}
              height={rectangle.height}
              setOnRect={setOnRect}
              links={links}
              setLinks={setLinks}
              onMouseDown={(e) => handleMouseDownRect(e, rectangle.id)}
            />
          ))}
          {links.map(
            (link, index) =>
              links.length >= 2 &&
              index % 2 === 0 &&
              index + 1 < links.length && (
                <line
                  key={index}
                  x1={links[index].x}
                  y1={links[index].y}
                  x2={links[index + 1].x}
                  y2={links[index + 1].y}
                  stroke="red"
                  strokeDasharray="5,5"
                />
              )
          )}
        </svg>
      </div>
    </div>
  );
}
