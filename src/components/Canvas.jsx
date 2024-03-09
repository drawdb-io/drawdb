import { useContext, useRef, useState, useEffect } from "react";
import Table from "./Table";
import { Action, Cardinality, Constraint, ObjectType } from "../data/data";
import Area from "./Area";
import Relationship from "./Relationship";
import {
  AreaContext,
  NoteContext,
  TableContext,
  UndoRedoContext,
  SelectContext,
  TransformContext,
} from "../pages/Editor";
import Note from "./Note";
import { Toast } from "@douyinfe/semi-ui";
import useSettings from "../hooks/useSettings";

export default function Canvas() {
  const { tables, updateTable, relationships, addRelationship } =
    useContext(TableContext);
  const { areas, updateArea } = useContext(AreaContext);
  const { notes, updateNote } = useContext(NoteContext);
  const { settings } = useSettings();
  const { setUndoStack, setRedoStack } = useContext(UndoRedoContext);
  const { transform, setTransform } = useContext(TransformContext);
  const { selectedElement, setSelectedElement } = useContext(SelectContext);
  const [dragging, setDragging] = useState({
    element: ObjectType.NONE,
    id: -1,
    prevX: 0,
    prevY: 0,
  });
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
  const [panning, setPanning] = useState({ state: false, x: 0, y: 0 });
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

  const canvas = useRef(null);

  const handleMouseDownRect = (e, id, type) => {
    const { clientX, clientY } = e;
    if (type === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === id);
      setOffset({
        x: clientX / transform.zoom - table.x,
        y: clientY / transform.zoom - table.y,
      });
      setDragging({
        element: ObjectType.TABLE,
        id: id,
        prevX: table.x,
        prevY: table.y,
      });
    } else if (type === ObjectType.AREA) {
      const area = areas.find((t) => t.id === id);
      setOffset({
        x: clientX / transform.zoom - area.x,
        y: clientY / transform.zoom - area.y,
      });
      setDragging({
        element: ObjectType.AREA,
        id: id,
        prevX: area.x,
        prevY: area.y,
      });
    } else if (type === ObjectType.NOTE) {
      const note = notes.find((t) => t.id === id);
      setOffset({
        x: clientX / transform.zoom - note.x,
        y: clientY / transform.zoom - note.y,
      });
      setDragging({
        element: ObjectType.NOTE,
        id: id,
        prevX: note.x,
        prevY: note.y,
      });
    }
    setSelectedElement({
      element: type,
      id: id,
      openDialogue: false,
      openCollapse: false,
    });
  };

  const handleMouseMove = (e) => {
    if (linking) {
      const rect = canvas.current.getBoundingClientRect();
      const offsetX = rect.left;
      const offsetY = rect.top;

      setLine({
        ...line,
        endX: (e.clientX - offsetX - transform.pan?.x) / transform.zoom,
        endY: (e.clientY - offsetY - transform.pan?.y) / transform.zoom,
      });
    } else if (
      panning.state &&
      dragging.element === ObjectType.NONE &&
      areaResize.id === -1
    ) {
      if (!settings.panning) {
        return;
      }
      const dx = e.clientX - panOffset.x;
      const dy = e.clientY - panOffset.y;
      setTransform((prev) => ({
        ...prev,
        pan: { x: prev.pan?.x + dx, y: prev.pan?.y + dy },
      }));
      setPanOffset({ x: e.clientX, y: e.clientY });
    } else if (dragging.element === ObjectType.TABLE && dragging.id >= 0) {
      const dx = e.clientX / transform.zoom - offset.x;
      const dy = e.clientY / transform.zoom - offset.y;
      updateTable(dragging.id, { x: dx, y: dy }, true);
    } else if (
      dragging.element === ObjectType.AREA &&
      dragging.id >= 0 &&
      areaResize.id === -1
    ) {
      const dx = e.clientX / transform.zoom - offset.x;
      const dy = e.clientY / transform.zoom - offset.y;
      updateArea(dragging.id, { x: dx, y: dy });
    } else if (dragging.element === ObjectType.NOTE && dragging.id >= 0) {
      const dx = e.clientX / transform.zoom - offset.x;
      const dy = e.clientY / transform.zoom - offset.y;
      updateNote(dragging.id, { x: dx, y: dy });
    } else if (areaResize.id !== -1) {
      if (areaResize.dir === "none") return;

      let newX = initCoords.x;
      let newY = initCoords.y;
      let newWidth = initCoords.width;
      let newHeight = initCoords.height;
      const mouseX = e.clientX / transform.zoom;
      const mouseY = e.clientY / transform.zoom;
      setPanning({ state: false, x: 0, y: 0 });
      if (areaResize.dir === "br") {
        newWidth = initCoords.width + (mouseX - initCoords.mouseX);
        newHeight = initCoords.height + (mouseY - initCoords.mouseY);
      } else if (areaResize.dir === "tl") {
        newX = initCoords.x + (mouseX - initCoords.mouseX);
        newY = initCoords.y + (mouseY - initCoords.mouseY);
        newWidth = initCoords.width - (mouseX - initCoords.mouseX);
        newHeight = initCoords.height - (mouseY - initCoords.mouseY);
      } else if (areaResize.dir === "tr") {
        newY = initCoords.y + (mouseY - initCoords.mouseY);
        newWidth = initCoords.width + (mouseX - initCoords.mouseX);
        newHeight = initCoords.height - (mouseY - initCoords.mouseY);
      } else if (areaResize.dir === "bl") {
        newX = initCoords.x + (mouseX - initCoords.mouseX);
        newWidth = initCoords.width - (mouseX - initCoords.mouseX);
        newHeight = initCoords.height + (mouseY - initCoords.mouseY);
      }

      updateArea(areaResize.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleMouseDown = (e) => {
    setPanning({ state: true, ...transform.pan });
    setPanOffset({ x: e.clientX, y: e.clientY });
    setCursor("grabbing");
  };

  const coordsDidUpdate = (element) => {
    switch (element) {
      case ObjectType.TABLE:
        return !(
          dragging.prevX === tables[dragging.id].x &&
          dragging.prevY === tables[dragging.id].y
        );
      case ObjectType.AREA:
        return !(
          dragging.prevX === areas[dragging.id].x &&
          dragging.prevY === areas[dragging.id].y
        );
      case ObjectType.NOTE:
        return !(
          dragging.prevX === notes[dragging.id].x &&
          dragging.prevY === notes[dragging.id].y
        );
      default:
        return false;
    }
  };

  const didResize = (id) => {
    return !(
      areas[id].x === initCoords.x &&
      areas[id].y === initCoords.y &&
      areas[id].width === initCoords.width &&
      areas[id].height === initCoords.height
    );
  };

  const didPan = () =>
    !(transform.pan?.x === panning.x && transform.pan?.y === panning.y);

  const getMoveInfo = () => {
    switch (dragging.element) {
      case ObjectType.TABLE:
        return {
          name: "table",
          x: tables[dragging.id].x,
          y: tables[dragging.id].y,
        };
      case ObjectType.AREA:
        return {
          name: "area",
          x: areas[dragging.id].x,
          y: areas[dragging.id].y,
        };
      case ObjectType.NOTE:
        return {
          name: "note",
          x: notes[dragging.id].x,
          y: notes[dragging.id].y,
        };
      default:
        return false;
    }
  };

  const handleMouseUp = () => {
    if (coordsDidUpdate(dragging.element)) {
      const info = getMoveInfo();
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.MOVE,
          element: dragging.element,
          x: dragging.prevX,
          y: dragging.prevY,
          toX: info.x,
          toY: info.y,
          id: dragging.id,
          message: `Move ${info.name} to (${info.x}, ${info.y})`,
        },
      ]);
      setRedoStack([]);
    }
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    if (panning.state && didPan()) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.PAN,
          undo: { x: panning.x, y: panning.y },
          redo: transform.pan,
          message: `Move diagram to (${transform.pan?.x}, ${transform.pan?.y})`,
        },
      ]);
      setRedoStack([]);
      setSelectedElement({ element: ObjectType.NONE, id: -1 });
    }
    setPanning({ state: false, x: 0, y: 0 });
    setCursor("default");
    if (linking) handleLinking();
    setLinking(false);
    if (areaResize.id !== -1 && didResize(areaResize.id)) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.AREA,
          aid: areaResize.id,
          undo: {
            ...areas[areaResize.id],
            x: initCoords.x,
            y: initCoords.y,
            width: initCoords.width,
            height: initCoords.height,
          },
          redo: areas[areaResize.id],
          message: `Resize area`,
        },
      ]);
      setRedoStack([]);
    }
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

  const handleGripField = () => {
    setPanning(false);
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    setLinking(true);
  };

  const handleLinking = () => {
    if (onRect.tableId < 0) return;
    if (onRect.field < 0) return;
    if (
      tables[line.startTableId].fields[line.startFieldId].type !==
      tables[onRect.tableId].fields[onRect.field].type
    ) {
      Toast.info("Cannot connect");
      return;
    }
    if (
      line.startTableId === onRect.tableId &&
      line.startFieldId === onRect.field
    )
      return;

    addRelationship(true, {
      ...line,
      endTableId: onRect.tableId,
      endFieldId: onRect.field,
      endX: tables[onRect.tableId].x + 15,
      endY: tables[onRect.tableId].y + onRect.field * 36 + 69,
      name: `${tables[line.startTableId].name}_${
        tables[line.startTableId].fields[line.startFieldId].name
      }_fk`,
      id: relationships.length,
    });
  };

  const handleMouseWheel = (e) => {
    e.preventDefault();
    setTransform((prev) => ({
      ...prev,
      zoom: e.deltaY <= 0 ? prev.zoom * 1.05 : prev.zoom / 1.05,
    }));
  };

  useEffect(() => {
    const canvasElement = canvas.current;
    canvasElement.addEventListener("wheel", handleMouseWheel, {
      passive: false,
    });
    return () => {
      canvasElement.removeEventListener("wheel", handleMouseWheel);
    };
  });

  const theme = localStorage.getItem("theme");

  return (
    <div className="flex-grow h-full" id="canvas">
      <div ref={canvas} className="w-full h-full">
        <svg
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full h-full"
          style={{
            cursor: cursor,
            backgroundColor: theme === "dark" ? "rgba(22, 22, 26, 1)" : "white",
          }}
        >
          {settings.showGrid && (
            <>
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
            </>
          )}
          <g
            style={{
              transform: `translate(${transform.pan?.x}px, ${transform.pan?.y}px) scale(${transform.zoom})`,
              transformOrigin: "top left",
            }}
            id="diagram"
          >
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
                zoom={transform.zoom}
              ></Area>
            ))}
            {relationships.map((e, i) => (
              <Relationship key={i} data={e} />
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
                active={
                  selectedElement.element === ObjectType.TABLE &&
                  selectedElement.id === table.id
                }
                moving={
                  dragging.element === ObjectType.TABLE &&
                  dragging.id === table.id
                }
              />
            ))}
            {linking && (
              <path
                d={`M ${line.startX} ${line.startY} L ${line.endX} ${line.endY}`}
                stroke="red"
                strokeDasharray="8,8"
              />
            )}
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
