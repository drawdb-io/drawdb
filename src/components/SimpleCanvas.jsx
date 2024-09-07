import { useEffect, useState, useRef } from "react";
import {
  Cardinality,
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
  tableWidth,
} from "../data/constants";
import { calcPath } from "../utils/calcPath";

function Table({ table, grab }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  const height =
    table.fields.length * tableFieldHeight +
    tableHeaderHeight +
    tableColorStripHeight;

  return (
    <foreignObject
      key={table.name}
      x={table.x}
      y={table.y}
      width={tableWidth}
      height={height}
      className="drop-shadow-lg rounded-md cursor-move"
      onPointerDown={(e) => {
        // Required for onPointerLeave to trigger when a touch pointer leaves
        // https://stackoverflow.com/a/70976017/1137077
        e.target.releasePointerCapture(e.pointerId);

        if (!e.isPrimary) return;

        grab(e);
      }}
      onPointerEnter={(e) => e.isPrimary && setIsHovered(true)}
      onPointerLeave={(e) => e.isPrimary && setIsHovered(false)}
    >
      <div
        className={`border-2 ${
          isHovered ? "border-dashed border-blue-500" : "border-zinc-300"
        } select-none rounded-lg w-full bg-zinc-100 text-zinc-800`}
      >
        <div
          className={`h-[10px] w-full rounded-t-md`}
          style={{ backgroundColor: table.color }}
        />
        <div className="font-bold h-[40px] flex justify-between items-center border-b border-zinc-400 bg-zinc-200 px-3">
          {table.name}
        </div>
        {table.fields.map((e, i) => (
          <div
            key={i}
            className={`${
              i === table.fields.length - 1 ? "" : "border-b border-gray-400"
            } h-[36px] px-2 py-1 flex justify-between`}
            onPointerEnter={(e) => e.isPrimary && setHoveredField(i)}
            onPointerLeave={(e) => e.isPrimary && setHoveredField(-1)}
            onPointerDown={(e) => {
              // Required for onPointerLeave to trigger when a touch pointer leaves
              // https://stackoverflow.com/a/70976017/1137077
              e.target.releasePointerCapture(e.pointerId);
            }}
          >
            <div className={hoveredField === i ? "text-zinc-500" : ""}>
              <button
                className={`w-[9px] h-[9px] bg-[#2f68adcc] rounded-full me-2`}
              />
              {e.name}
            </div>
            <div className="text-zinc-400">{e.type}</div>
          </div>
        ))}
      </div>
    </foreignObject>
  );
}

function Relationship({ relationship, tables }) {
  const pathRef = useRef();
  let start = { x: 0, y: 0 };
  let end = { x: 0, y: 0 };

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (relationship.cardinality) {
    case Cardinality.MANY_TO_ONE:
      cardinalityStart = "n";
      cardinalityEnd = "1";
      break;
    case Cardinality.ONE_TO_MANY:
      cardinalityStart = "1";
      cardinalityEnd = "n";
      break;
    case Cardinality.ONE_TO_ONE:
      cardinalityStart = "1";
      cardinalityEnd = "1";
      break;
    default:
      break;
  }

  const length = 32;

  const [refAquired, setRefAquired] = useState(false);
  useEffect(() => {
    setRefAquired(true);
  }, []);

  if (refAquired) {
    const pathLength = pathRef.current.getTotalLength();
    const point1 = pathRef.current.getPointAtLength(length);
    start = { x: point1.x, y: point1.y };
    const point2 = pathRef.current.getPointAtLength(pathLength - length);
    end = { x: point2.x, y: point2.y };
  }

  return (
    <g className="select-none">
      <path
        ref={pathRef}
        d={calcPath({
          ...relationship,
          startTable: {
            x: tables[relationship.startTableId].x,
            y: tables[relationship.startTableId].y,
          },
          endTable: {
            x: tables[relationship.endTableId].x,
            y: tables[relationship.endTableId].y,
          },
        })}
        stroke="gray"
        fill="none"
        strokeWidth={2}
      />
      {pathRef.current && (
        <>
          <circle cx={start.x} cy={start.y} r="12" fill="grey" />
          <text
            x={start.x}
            y={start.y}
            fill="white"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityStart}
          </text>
          <circle cx={end.x} cy={end.y} r="12" fill="grey" />
          <text
            x={end.x}
            y={end.y}
            fill="white"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityEnd}
          </text>
        </>
      )}
    </g>
  );
}

export default function SimpleCanvas({ diagram, zoom }) {
  const [tables, setTables] = useState(diagram.tables);
  const [dragging, setDragging] = useState(-1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const grabTable = (e, id) => {
    setDragging(id);
    setOffset({
      x: e.clientX - tables[id].x,
      y: e.clientY - tables[id].y,
    });
  };

  const moveTable = (e) => {
    if (dragging !== -1) {
      const dx = e.clientX - offset.x;
      const dy = e.clientY - offset.y;
      setTables((prev) =>
        prev.map((table, i) =>
          i === dragging ? { ...table, x: dx, y: dy } : table,
        ),
      );
    }
  };

  const releaseTable = () => {
    setDragging(-1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <svg
      className="w-full h-full cursor-grab rounded-3xl"
      onPointerUp={(e) => e.isPrimary && releaseTable()}
      onPointerMove={(e) => e.isPrimary && moveTable(e)}
      onPointerLeave={(e) => e.isPrimary && releaseTable()}
    >
      <defs>
        <pattern
          id="pattern-circles"
          x="0"
          y="0"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle
            id="pattern-circle"
            cx="4"
            cy="4"
            r="0.85"
            fill="rgb(99, 152, 191)"
          ></circle>
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#pattern-circles)"
      ></rect>
      <g
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        {diagram.relationships.map((r, i) => (
          <Relationship key={i} relationship={r} tables={tables} />
        ))}
        {tables.map((t, i) => (
          <Table key={i} table={t} grab={(e) => grabTable(e, i)} />
        ))}
      </g>
    </svg>
  );
}
