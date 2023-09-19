import React, { useRef, useState } from "react";
import { useDrop } from "react-dnd";
import Rect from "./rect";
import Node from "./node";

export default function Canvas(props) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [links, setLinks] = useState([]);

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
              links={links}
              setLinks={setLinks}
              onMouseDown={(event) => handleMouseDown(event, rectangle.id)}
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
