import React, { useRef, useState } from "react";
import { useDrop } from "react-dnd";
import Table from "./table";
import { defaultTableTheme } from "../data/data";

export default function Canvas(props) {
  const [dragging, setDragging] = useState(-1);
  const [linking, setLinking] = useState(false);
  const [line, setLine] = useState({
    startTableId: -1,
    startFieldId: -1,
    endTableId: -1,
    endFieldId: -1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const [relationships, setRelationships] = useState([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [onRect, setOnRect] = useState({
    tableId: -1,
    field: -2,
  });
  const [panning, setPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState("default");

  const canvas = useRef(null);

  const handleMouseDownRect = (e, id) => {
    const { clientX, clientY } = e;
    const table = props.tables.find((t) => t.id === id);
    setOffset({
      x: clientX - table.x,
      y: clientY - table.y,
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

      props.setTables(
        props.tables.map((t) => ({
          ...t,
          x: t.x + dx,
          y: t.y + dy,
        }))
      );

      setRelationships(
        relationships.map((r) => ({
          ...r,
          startX: r.startX + dx,
          startY: r.startY + dy,
          endX: r.endX + dx,
          endY: r.endY + dy,
        }))
      );
    } else if (dragging >= 0) {
      const updatedTables = props.tables.map((t) => {
        if (t.id === dragging) {
          const updatedTable = {
            ...t,
            x: e.clientX - offset.x,
            y: e.clientY - offset.y,
          };
          return updatedTable;
        }
        return t;
      });
      props.setTables(updatedTables);
      const updatedRelationShips = relationships.map((r) => {
        if (r.startTableId === dragging) {
          return {
            ...r,
            startX: props.tables[r.startTableId].x + 15,
            startY:
              props.tables[r.startTableId].y + r.startFieldId * 36 + 40 + 19,
          };
        } else if (r.endTableId === dragging) {
          return {
            ...r,
            endX: props.tables[r.endTableId].x + 15,
            endY: props.tables[r.endTableId].y + r.endFieldId * 36 + 40 + 19,
          };
        }
        return r;
      });
      setRelationships(updatedRelationShips);
    }
  };

  const handleMouseDown = (e) => {
    if (dragging < 0) {
      if (onRect.tableId < 0) {
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
    if (linking) handleLinking();
    setLinking(false);
  };

  const deleteTable = (id) => {
    const updatedTables = [...props.tables];
    updatedTables.splice(id, 1);
    props.setTables(updatedTables);
  };

  const handleGripField = (id) => {
    setPanning(false);
    setDragging(-1);
    setLinking(true);
  };

  const handleLinking = () => {
    if (onRect.tableId < 0) return;
    if (onRect.field < 0) return;
    setRelationships((prev) => [
      ...prev,
      {
        ...line,
        endX: props.tables[onRect.tableId].x + 15,
        endY: props.tables[onRect.tableId].y + onRect.field * 36 + 40 + 19,
        endTableId: onRect.tableId,
        endFieldId: onRect.field,
      },
    ]);
  };

  const [, drop] = useDrop(
    () => ({
      accept: "CARD",
      drop: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const canvasRect = canvas.current.getBoundingClientRect();
        const x = offset.x - canvasRect.left - 100 * 0.5;
        const y = offset.y - canvasRect.top - 100 * 0.5;
        const newTable = {
          id: props.tables.length,
          name: `Table ${props.tables.length}`,
          x: x,
          y: y,
          fields: [
            {
              name: "id",
              type: "UUID",
              default: "",
              primary: true,
              unique: true,
              notNull: true,
              increment: true,
              comment: "",
            },
          ],
          comment: "",
          indices: [],
          color: defaultTableTheme,
        };
        props.setTables((prev) => [...prev, newTable]);
        props.setCode((prev) =>
          prev === ""
            ? `CREATE TABLE \`${newTable.name}\`;`
            : `${prev}\n\nCREATE TABLE \`${newTable.name}\`;`
        );
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [props.tables]
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
          {props.tables.map((table, i) => (
            <Table
              key={table.id}
              id={table.id}
              tableData={table}
              tables={props.tables}
              setTables={props.setTables}
              setOnRect={setOnRect}
              handleGripField={handleGripField}
              setLine={setLine}
              onMouseDown={(e) => handleMouseDownRect(e, table.id)}
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
          {relationships.map((e, i) => (
            <line
              key={i}
              x1={e.startX}
              y1={e.startY}
              x2={e.endX}
              y2={e.endY}
              stroke="gray"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
