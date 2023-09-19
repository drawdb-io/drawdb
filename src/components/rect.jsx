import { React, useState } from "react";
import Node from "./node";
import { Button } from "@arco-design/web-react";

const Rect = (props) => {
  const [isHovered, setIsHovered] = useState(false);
  const [node, setNode] = useState(Node.NONE);

  return (
    <g>
      <foreignObject
        key={props.id}
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        style={{ cursor: "move" }}
        onMouseDown={props.onMouseDown}
        onMouseEnter={() => {
          setIsHovered(true);
          props.setOnRect(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          props.setOnRect(false);
        }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className={`${isHovered ? "bg-red-500" : "bg-blue"} p-3`}
        >
          <div className="text-white">{props.label}</div>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="text" className="w-full" />
          </form>
          <Button type="secondary" onClick={(e) => console.log("sup")}>
            sup
          </Button>
        </div>
      </foreignObject>
      <circle
        id="TOP"
        cx={props.x + props.width / 2}
        cy={props.y}
        r={5}
        onClick={(e) => {
          setNode(Node.TOP);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.TOP,
              x: props.x + props.width / 2,
              y: props.y,
            },
          ]);
        }}
        style={{ fill: node === Node.TOP ? "green" : "black" }}
      />
      <circle
        id="LEFT"
        cx={props.x}
        cy={props.y + props.height / 2}
        r={5}
        onClick={(e) => {
          setNode(Node.LEFT);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.LEFT,
              x: props.x,
              y: props.y + props.height / 2,
            },
          ]);
        }}
        style={{ fill: node === Node.LEFT ? "green" : "black" }}
      />
      <circle
        id="RIGHT"
        cx={props.x + props.width}
        cy={props.y + props.height / 2}
        r={5}
        onClick={(e) => {
          setNode(Node.RIGHT);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.RIGHT,
              x: props.x + props.width,
              y: props.y + props.height / 2,
            },
          ]);
        }}
        style={{ fill: node === Node.RIGHT ? "green" : "black" }}
      />
      <circle
        id="BOTTOM"
        cx={props.x + props.width / 2}
        cy={props.y + props.height}
        r={5}
        onClick={(e) => {
          setNode(Node.BOTTOM);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.BOTTOM,
              x: props.x + props.width / 2,
              y: props.y + props.height,
            },
          ]);
        }}
        style={{ fill: node === Node.BOTTOM ? "green" : "black" }}
      />
    </g>
  );
};

export default Rect;
