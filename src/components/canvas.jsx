import React, { useRef, useState } from "react";
import { useDrop } from "react-dnd";
import Table from "./table";
import { defaultTableTheme, Cardinality, Constraint } from "../data/data";
import Area from "./area";

export default function Canvas(props) {
  const ObjectType = {
    NONE: 0,
    TABLE: 1,
    AREA: 2,
  };
  const [dragging, setDragging] = useState([ObjectType.NONE, -1]);
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
    name: "",
    cardinality: Cardinality.ONE_TO_MANY,
    updateConstraint: Constraint.none,
    deleteConstraint: Constraint.none,
    mandatory: false,
  });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [onRect, setOnRect] = useState({
    tableId: -1,
    field: -2,
  });
  const [panning, setPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState("default");

  const canvas = useRef(null);

  const handleMouseDownRect = (e, id, type) => {
    const { clientX, clientY } = e;
    if (type === ObjectType.TABLE) {
      const table = props.tables.find((t) => t.id === id);
      setOffset({
        x: clientX - table.x,
        y: clientY - table.y,
      });
      setDragging([ObjectType.TABLE, id]);
    } else if (type === ObjectType.AREA) {
      const area = props.areas.find((t) => t.id === id);
      setOffset({
        x: clientX - area.x,
        y: clientY - area.y,
      });
      setDragging([ObjectType.AREA, id]);
    }
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
    } else if (dragging[0] === ObjectType.NONE && panning) {
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

      props.setRelationships(
        props.relationships.map((r) => ({
          ...r,
          startX: r.startX + dx,
          startY: r.startY + dy,
          endX: r.endX + dx,
          endY: r.endY + dy,
        }))
      );

      props.setAreas(
        props.areas.map((t) => ({
          ...t,
          x: t.x + dx,
          y: t.y + dy,
        }))
      );
    } else if (dragging[0] === ObjectType.TABLE && dragging[1] >= 0) {
      const updatedTables = props.tables.map((t) => {
        if (t.id === dragging[1]) {
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
      const updatedRelationShips = props.relationships.map((r) => {
        if (r.startTableId === dragging[1]) {
          return {
            ...r,
            startX: props.tables[r.startTableId].x + 15,
            startY:
              props.tables[r.startTableId].y + r.startFieldId * 36 + 40 + 19,
          };
        } else if (r.endTableId === dragging[1]) {
          return {
            ...r,
            endX: props.tables[r.endTableId].x + 15,
            endY: props.tables[r.endTableId].y + r.endFieldId * 36 + 40 + 19,
          };
        }
        return r;
      });
      props.setRelationships(updatedRelationShips);
    } else if (dragging[0] === ObjectType.AREA && dragging[1] >= 0) {
      const updatedAreas = props.areas.map((t) => {
        if (t.id === dragging[1]) {
          const updatedArea = {
            ...t,
            x: e.clientX - offset.x,
            y: e.clientY - offset.y,
          };
          return updatedArea;
        }
        return t;
      });
      props.setAreas(updatedAreas);
    }
  };

  const handleMouseDown = (e) => {
    setPanning(true);
    setPanOffset({ x: e.clientX, y: e.clientY });
    setCursor("grabbing");
  };

  const handleMouseUp = () => {
    setDragging([ObjectType.NONE, -1]);
    setPanning(false);
    setCursor("default");
    if (linking) handleLinking();
    setLinking(false);
  };

  const handleGripField = (id) => {
    setPanning(false);
    setDragging([ObjectType.NONE, -1]);
    setLinking(true);
  };

  const handleLinking = () => {
    if (onRect.tableId < 0) return;
    if (onRect.field < 0) return;
    if (
      line.startTableId === onRect.tableId &&
      line.startFieldId === onRect.field
    )
      return;
    props.setRelationships((prev) => [
      ...prev,
      {
        ...line,
        endTableId: onRect.tableId,
        endFieldId: onRect.field,
        endX: props.tables[onRect.tableId].x + 15,
        endY: props.tables[onRect.tableId].y + onRect.field * 36 + 40 + 19,
        name: `${props.tables[line.startTableId].name}_to_${
          props.tables[onRect.tableId].name
        }`,
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
          name: `table_${props.tables.length}`,
          x: x,
          y: y,
          fields: [
            {
              name: "id",
              type: "UUID",
              check: "",
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
          {props.areas.map((a) => (
            <Area
              key={a.id}
              areaData={a}
              onMouseDown={(e) => handleMouseDownRect(e, a.id, ObjectType.AREA)}
              setPanning={setPanning}
              setAreas={props.setAreas}
            ></Area>
          ))}
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
              onMouseDown={(e) =>
                handleMouseDownRect(e, table.id, ObjectType.TABLE)
              }
              handleDelete={props.handleDelete}
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
          {props.relationships.map((e, i) => (
            <line
              key={i}
              x1={e.startX}
              y1={e.startY}
              x2={e.endX}
              y2={e.endY}
              stroke="gray"
              strokeWidth={2.5}
              onClick={() => {}}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
