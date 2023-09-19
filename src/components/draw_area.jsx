import React, { useEffect, useRef } from "react";
import { dia, shapes } from "jointjs";
import { useDrop } from "react-dnd";

export default function DrawArea(props) {
  const canvas = useRef(null);

  const [, drop] = useDrop(() => ({
    accept: "CARD",
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvas.current.getBoundingClientRect();
      const x = offset.x - canvasRect.left - item.size.width * 0.5;
      const y = offset.y - canvasRect.top - item.size.height * 0.5;
      if (item.type === "rect") {
        const rect = new shapes.standard.Rectangle();
        rect.position(x, y);
        rect.resize(item.size.width, item.size.height);
        rect.attr(item.attrs);
        rect.addTo(props.graph);
        props.setCode((prevCode) => `create table hi\n\n${prevCode}`);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  useEffect(() => {
    new dia.Paper({
      el: document.getElementById("canvas"),
      background: {
        color: "#aec3b0",
      },
      model: props.graph,
      width: "100%",
      gridSize: 1,
      interactive: true,
    });
  }, [props.graph]);

  return (
    <div ref={drop} className="flex-grow">
      <div id="canvas" ref={canvas}></div>
    </div>
  );
}
