import { React, useState } from "react";
import Node from "./node";
import {
  IconEdit,
  IconDelete,
  IconPlus,
  IconMinus,
} from "@arco-design/web-react/icon";

const Rect = (props) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  const [node, setNode] = useState(Node.NONE);
  const [fields, setFields] = useState([
    {
      name: "id",
      type: "uuid",
      default: "",
      primary: true,
      unique: true,
      notNull: true,
      increment: false,
    },
    {
      name: "name",
      type: "varchar(20)",
      default: "n/a",
      primary: false,
      unique: false,
      notNull: true,
      increment: false,
    },
  ]);

  const table = {
    name: "Students",
  };

  const height = fields.length * 36 + (fields.length - 1) * 2 + 40 + 2;

  return (
    <g>
      <foreignObject
        key={props.id}
        x={props.x}
        y={props.y}
        width={props.width}
        height={height}
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
          className={`border-2 ${
            isHovered ? "border-sky-500" : "border-gray-500"
          } bg-gray-300 select-none rounded-md`}
        >
          <div className="p-3 font-bold text-slate-800 h-[40px] bg-gray-400 rounded-t-md flex justify-between">
            {table.name}
            {isHovered && (
              <div className="flex justify-end items-center">
                <button className="btn bg-sky-800 text-white text-xs py-1 px-2 me-2 opacity-80">
                  <IconEdit />
                </button>
                <button
                  className="btn bg-green-600 text-white text-xs py-1 px-2 me-2 opacity-80"
                  onClick={(e) => {
                    setFields([
                      ...fields,
                      {
                        name: "age",
                        type: "numeric",
                        default: "n/a",
                        primary: false,
                        unique: false,
                        notNull: true,
                        increment: false,
                      },
                    ]);
                  }}
                >
                  <IconPlus />
                </button>
                <button className="btn bg-red-800 text-white text-xs py-1 px-2 opacity-80">
                  <IconDelete />
                </button>
              </div>
            )}
          </div>
          {fields.map((e, i) => {
            return (
              <div
                className={`${
                  i === fields.length - 1 ? "" : "border-b-2 border-gray-400"
                } h-[36px] p-2 flex justify-between`}
                onMouseEnter={() => {
                  setHoveredField(i);
                }}
                onMouseLeave={() => {
                  setHoveredField(-1);
                }}
              >
                <div>{e.name}</div>
                <div className="text-slate-600">
                  {hoveredField === i ? (
                    <div>
                      <button className="btn bg-sky-800 text-white text-xs py-1 px-2 me-2 opacity-80">
                        <IconEdit />
                      </button>
                      <button className="btn bg-red-800 text-white text-xs py-1 px-2 opacity-80">
                        <IconMinus />
                      </button>
                    </div>
                  ) : (
                    e.type
                  )}
                </div>
              </div>
            );
          })}
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
        cy={props.y + height / 2}
        r={5}
        onClick={(e) => {
          setNode(Node.LEFT);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.LEFT,
              x: props.x,
              y: props.y + height / 2,
            },
          ]);
        }}
        style={{ fill: node === Node.LEFT ? "green" : "black" }}
      />
      <circle
        id="RIGHT"
        cx={props.x + props.width}
        cy={props.y + height / 2}
        r={5}
        onClick={(e) => {
          setNode(Node.RIGHT);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.RIGHT,
              x: props.x + props.width,
              y: props.y + height / 2,
            },
          ]);
        }}
        style={{ fill: node === Node.RIGHT ? "green" : "black" }}
      />
      <circle
        id="BOTTOM"
        cx={props.x + props.width / 2}
        cy={props.y + height}
        r={5}
        onClick={(e) => {
          setNode(Node.BOTTOM);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.BOTTOM,
              x: props.x + props.width / 2,
              y: props.y + height,
            },
          ]);
        }}
        style={{ fill: node === Node.BOTTOM ? "green" : "black" }}
      />
    </g>
  );
};

export default Rect;
