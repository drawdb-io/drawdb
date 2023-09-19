import React, { useContext, useRef, useState, useEffect } from "react";
import { useDrop } from "react-dnd";
import Table from "./table";
import {
  defaultTableTheme,
  Cardinality,
  Constraint,
  ObjectType,
} from "../data/data";
import Area from "./area";
import Relationship from "./relationship";
import { AreaContext, NoteContext, TableContext } from "../pages/editor";
import Note from "./note";

export default function Canvas(props) {
  const { tables, setTables, relationships, setRelationships } =
    useContext(TableContext);
  const { areas, setAreas } = useContext(AreaContext);
  const { notes, setNotes } = useContext(NoteContext);
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
    cardinality: Cardinality.ONE_TO_ONE,
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
  const [areaResize, setAreaResize] = useState({ id: -1, dir: "none" });
  const [initCoords, setInitCoords] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const [cursor, setCursor] = useState("default");
  const [zoom, setZoom] = useState(1);

  const canvas = useRef(null);

  const handleMouseDownRect = (e, id, type) => {
    const { clientX, clientY } = e;
    if (type === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === id);
      setOffset({
        x: clientX - table.x,
        y: clientY - table.y,
      });
      setDragging([ObjectType.TABLE, id]);
    } else if (type === ObjectType.AREA) {
      const area = areas.find((t) => t.id === id);
      setOffset({
        x: clientX - area.x,
        y: clientY - area.y,
      });
      setDragging([ObjectType.AREA, id]);
    } else if (type === ObjectType.NOTE) {
      const note = notes.find((t) => t.id === id);
      setOffset({
        x: clientX - note.x,
        y: clientY - note.y,
      });
      setDragging([ObjectType.NOTE, id]);
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
    } else if (
      panning &&
      dragging[0] === ObjectType.NONE &&
      areaResize.id === -1
    ) {
      const dx = e.clientX - panOffset.x;
      const dy = e.clientY - panOffset.y;
      setPanOffset({ x: e.clientX, y: e.clientY });

      setTables((prev) =>
        prev.map((t) => ({
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

      setAreas((prev) => prev.map((t) => ({ ...t, x: t.x + dx, y: t.y + dy })));

      setNotes((prev) => prev.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy })));
    } else if (dragging[0] === ObjectType.TABLE && dragging[1] >= 0) {
      const updatedTables = tables.map((t) => {
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
      setTables(updatedTables);
      const updatedRelationShips = relationships.map((r) => {
        if (r.startTableId === dragging[1]) {
          return {
            ...r,
            startX: tables[r.startTableId].x + 15,
            startY: tables[r.startTableId].y + r.startFieldId * 36 + 50 + 19,
          };
        } else if (r.endTableId === dragging[1]) {
          return {
            ...r,
            endX: tables[r.endTableId].x + 15,
            endY: tables[r.endTableId].y + r.endFieldId * 36 + 50 + 19,
          };
        }
        return r;
      });
      setRelationships(updatedRelationShips);
    } else if (
      dragging[0] === ObjectType.AREA &&
      dragging[1] >= 0 &&
      areaResize.id === -1
    ) {
      const updatedAreas = areas.map((t) => {
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
      setAreas(updatedAreas);
    } else if (dragging[0] === ObjectType.NOTE && dragging[1] >= 0) {
      setNotes((prev) =>
        prev.map((t) => {
          if (t.id === dragging[1]) {
            return {
              ...t,
              x: e.clientX - offset.x,
              y: e.clientY - offset.y,
            };
          }
          return t;
        })
      );
    } else if (areaResize.id !== -1) {
      if (areaResize.dir === "none") return;

      let newX = initCoords.x;
      let newY = initCoords.y;
      let newWidth = initCoords.width;
      let newHeight = initCoords.height;
      setPanning(false);
      if (areaResize.dir === "br") {
        newWidth = initCoords.width + (e.clientX - initCoords.mouseX);
        newHeight = initCoords.height + (e.clientY - initCoords.mouseY);
      } else if (areaResize.dir === "tl") {
        newX = initCoords.x + (e.clientX - initCoords.mouseX);
        newY = initCoords.y + (e.clientY - initCoords.mouseY);
        newWidth = initCoords.width - (e.clientX - initCoords.mouseX);
        newHeight = initCoords.height - (e.clientY - initCoords.mouseY);
      } else if (areaResize.dir === "tr") {
        newY = initCoords.y + (e.clientY - initCoords.mouseY);
        newWidth = initCoords.width + (e.clientX - initCoords.mouseX);
        newHeight = initCoords.height - (e.clientY - initCoords.mouseY);
      } else if (areaResize.dir === "bl") {
        newX = initCoords.x + (e.clientX - initCoords.mouseX);
        newWidth = initCoords.width - (e.clientX - initCoords.mouseX);
        newHeight = initCoords.height + (e.clientY - initCoords.mouseY);
      }

      setAreas((prev) =>
        prev.map((a) => {
          if (a.id === areaResize.id) {
            return {
              ...a,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
            };
          }
          return a;
        })
      );
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
    setAreaResize({ id: -1, dir: "none" });
    setInitCoords({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      mouseX: 0,
      mouseY: 0,
    });
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
    setRelationships((prev) => [
      ...prev,
      {
        ...line,
        endTableId: onRect.tableId,
        endFieldId: onRect.field,
        endX: tables[onRect.tableId].x + 15,
        endY: tables[onRect.tableId].y + onRect.field * 36 + 50 + 19,
        name: `${tables[line.startTableId].name}_to_${
          tables[onRect.tableId].name
        }`,
        id: prev.length,
      },
    ]);
  };

  const addTable = (x, y) => {
    const newTable = {
      id: tables.length,
      name: `table_${tables.length}`,
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
    setTables((prev) => [...prev, newTable]);
    props.setCode((prev) =>
      prev === ""
        ? `CREATE TABLE \`${newTable.name}\`;`
        : `${prev}\n\nCREATE TABLE \`${newTable.name}\`;`
    );
  };

  const addArea = (x, y) => {
    const newArea = {
      id: areas.length,
      name: `area_${areas.length}`,
      x: x,
      y: y,
      width: 200,
      height: 200,
      color: defaultTableTheme,
    };
    setAreas((prev) => [...prev, newArea]);
  };

  const [, drop] = useDrop(
    () => ({
      accept: "CARD",
      drop: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const canvasRect = canvas.current.getBoundingClientRect();
        const x = offset.x - canvasRect.left - 100 * 0.5;
        const y = offset.y - canvasRect.top - 100 * 0.5;
        switch (item.type) {
          case ObjectType.TABLE:
            addTable(x, y);
            break;
          case ObjectType.AREA:
            addArea(x, y);
            break;
          default:
            break;
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [tables, areas]
  );

  const handleMouseWheel = (e) => {
    // const zoomDirection = e.deltaY > 0 ? "out" : "in";
    e.preventDefault();
    if (e.deltaY <= 0 ) {
      setZoom((prev) => prev * 1.1);
    } else {
      setZoom((prev) => prev / 1.1);
    }
  };

  useEffect(() => {
    const canvasElement = canvas.current;
    canvasElement.addEventListener("wheel", handleMouseWheel, {
      passive: false,
    });
    return () => {
      canvasElement.removeEventListener("wheel", handleMouseWheel);
    };
  }, []);

  return (
    <div ref={drop} className="flex-grow h-full" id="canvas">
      <div ref={canvas} className="w-full h-full">
        <svg
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full h-full bg-white"
          style={{
            cursor: cursor,
          }}
        >
          <defs>
            <pattern
              id="pattern-circles"
              x="0"
              y="0"
              width="24"
              height="24"
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
          <g style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
            {areas.map((a) => (
              <Area
                key={a.id}
                areaData={a}
                onMouseDown={(e) =>
                  handleMouseDownRect(e, a.id, ObjectType.AREA)
                }
                setResize={setAreaResize}
                initCoords={initCoords}
                setInitCoords={setInitCoords}
              ></Area>
            ))}
            {tables.map((table) => (
              <Table
                key={table.id}
                tableData={table}
                setOnRect={setOnRect}
                handleGripField={handleGripField}
                setLine={setLine}
                onMouseDown={(e) =>
                  handleMouseDownRect(e, table.id, ObjectType.TABLE)
                }
                selectedTable={props.selectedTable}
                setSelectedTable={props.setSelectedTable}
              />
            ))}
            {linking && (
              <path
                d={`M ${line.startX} ${line.startY} L ${line.endX} ${line.endY}`}
                stroke="red"
                strokeDasharray="8,8"
              />
            )}
            {relationships.map((e, i) => (
              <Relationship key={i} data={e} />
            ))}
            {notes.map((n) => (
              <Note
                key={n.id}
                data={n}
                onMouseDown={(e) =>
                  handleMouseDownRect(e, n.id, ObjectType.NOTE)
                }
              ></Note>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
