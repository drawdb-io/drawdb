import { useRef, useState, useEffect } from "react";
import {
  Action,
  Cardinality,
  Constraint,
  ObjectType,
} from "../../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import Table from "./Table";
import Area from "./Area";
import Relationship from "./Relationship";
import Note from "./Note";
import {
  useSettings,
  useTransform,
  useTables,
  useUndoRedo,
  useSelect,
  useAreas,
  useNotes,
  useLayout,
} from "../../hooks";

export default function Canvas() {
  const { tables, updateTable, relationships, addRelationship } = useTables();
  const { areas, updateArea } = useAreas();
  const { notes, updateNote } = useNotes();
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { transform, setTransform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const [dragging, setDragging] = useState({
    element: ObjectType.NONE,
    id: -1,
    prevX: 0,
    prevY: 0,
  });
  const [linking, setLinking] = useState(false);
  const [linkingLine, setLinkingLine] = useState({
    startTableId: -1,
    startFieldId: -1,
    endTableId: -1,
    endFieldId: -1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredTable, setHoveredTable] = useState({
    tableId: -1,
    field: -2,
  });
  const [panning, setPanning] = useState({
    isPanning: false,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
  });
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

  const handleMouseDownOnElement = (e, id, type) => {
    const { clientX, clientY } = e;
    if (type === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === id);
      setOffset({
        x: clientX / transform.zoom - table.x,
        y: clientY / transform.zoom - table.y,
      });
      setDragging({
        element: type,
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
        element: type,
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
        element: type,
        id: id,
        prevX: note.x,
        prevY: note.y,
      });
    }
    setSelectedElement((prev) => ({
      ...prev,
      element: type,
      id: id,
      open: false,
    }));
  };

  const handleMouseMove = (e) => {
    if (linking) {
      const rect = canvas.current.getBoundingClientRect();
      setLinkingLine({
        ...linkingLine,
        endX: (e.clientX - rect.left - transform.pan?.x) / transform.zoom,
        endY: (e.clientY - rect.top - transform.pan?.y) / transform.zoom,
      });
    } else if (
      panning.isPanning &&
      dragging.element === ObjectType.NONE &&
      areaResize.id === -1
    ) {
      if (!settings.panning) {
        return;
      }
      const dx = e.clientX - panning.dx;
      const dy = e.clientY - panning.dy;
      setTransform((prev) => ({
        ...prev,
        pan: { x: prev.pan?.x + dx, y: prev.pan?.y + dy },
      }));
      setPanning((prev) => ({ ...prev, dx: e.clientX, dy: e.clientY }));
    } else if (dragging.element === ObjectType.TABLE && dragging.id >= 0) {
      const dx = e.clientX / transform.zoom - offset.x;
      const dy = e.clientY / transform.zoom - offset.y;
      updateTable(dragging.id, { x: dx, y: dy });
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
      let newDims = { ...initCoords };
      delete newDims.mouseX;
      delete newDims.mouseY;
      const mouseX = e.clientX / transform.zoom;
      const mouseY = e.clientY / transform.zoom;
      setPanning({ isPanning: false, x: 0, y: 0 });
      if (areaResize.dir === "br") {
        newDims.width = initCoords.width + (mouseX - initCoords.mouseX);
        newDims.height = initCoords.height + (mouseY - initCoords.mouseY);
      } else if (areaResize.dir === "tl") {
        newDims.x = initCoords.x + (mouseX - initCoords.mouseX);
        newDims.y = initCoords.y + (mouseY - initCoords.mouseY);
        newDims.width = initCoords.width - (mouseX - initCoords.mouseX);
        newDims.height = initCoords.height - (mouseY - initCoords.mouseY);
      } else if (areaResize.dir === "tr") {
        newDims.y = initCoords.y + (mouseY - initCoords.mouseY);
        newDims.width = initCoords.width + (mouseX - initCoords.mouseX);
        newDims.height = initCoords.height - (mouseY - initCoords.mouseY);
      } else if (areaResize.dir === "bl") {
        newDims.x = initCoords.x + (mouseX - initCoords.mouseX);
        newDims.width = initCoords.width - (mouseX - initCoords.mouseX);
        newDims.height = initCoords.height + (mouseY - initCoords.mouseY);
      }

      updateArea(areaResize.id, { ...newDims });
    }
  };

  const handleMouseDown = (e) => {
    // don't pan if the sidesheet for editing a table is open
    if (
      selectedElement.element === ObjectType.TABLE &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    setPanning({
      isPanning: true,
      ...transform.pan,
      dx: e.clientX,
      dy: e.clientY,
    });
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

  const getMovedElementDetails = () => {
    switch (dragging.element) {
      case ObjectType.TABLE:
        return {
          name: tables[dragging.id].name,
          x: Math.round(tables[dragging.id].x),
          y: Math.round(tables[dragging.id].y),
        };
      case ObjectType.AREA:
        return {
          name: areas[dragging.id].name,
          x: Math.round(areas[dragging.id].x),
          y: Math.round(areas[dragging.id].y),
        };
      case ObjectType.NOTE:
        return {
          name: notes[dragging.id].title,
          x: Math.round(notes[dragging.id].x),
          y: Math.round(notes[dragging.id].y),
        };
      default:
        return false;
    }
  };

  const handleMouseUp = () => {
    if (coordsDidUpdate(dragging.element)) {
      const info = getMovedElementDetails();
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
    if (panning.isPanning && didPan()) {
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
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
    setPanning({ isPanning: false, x: 0, y: 0 });
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
    if (hoveredTable.tableId < 0) return;
    if (hoveredTable.field < 0) return;
    if (
      tables[linkingLine.startTableId].fields[linkingLine.startFieldId].type !==
      tables[hoveredTable.tableId].fields[hoveredTable.field].type
    ) {
      Toast.info("Cannot connect");
      return;
    }
    if (
      linkingLine.startTableId === hoveredTable.tableId &&
      linkingLine.startFieldId === hoveredTable.field
    )
      return;

    const newRelationship = {
      ...linkingLine,
      endTableId: hoveredTable.tableId,
      endFieldId: hoveredTable.field,
      cardinality: Cardinality.ONE_TO_ONE,
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: `${tables[linkingLine.startTableId].name}_${
        tables[linkingLine.startTableId].fields[linkingLine.startFieldId].name
      }_fk`,
      id: relationships.length,
    };
    delete newRelationship.startX;
    delete newRelationship.startY;
    delete newRelationship.endX;
    delete newRelationship.endY;
    addRelationship(newRelationship);
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
                data={a}
                onMouseDown={(e) =>
                  handleMouseDownOnElement(e, a.id, ObjectType.AREA)
                }
                setResize={setAreaResize}
                setInitCoords={setInitCoords}
              />
            ))}
            {relationships.map((e, i) => (
              <Relationship key={i} data={e} />
            ))}
            {tables.map((table) => (
              <Table
                key={table.id}
                tableData={table}
                setHoveredTable={setHoveredTable}
                handleGripField={handleGripField}
                setLinkingLine={setLinkingLine}
                onMouseDown={(e) =>
                  handleMouseDownOnElement(e, table.id, ObjectType.TABLE)
                }
              />
            ))}
            {linking && (
              <path
                d={`M ${linkingLine.startX} ${linkingLine.startY} L ${linkingLine.endX} ${linkingLine.endY}`}
                stroke="red"
                strokeDasharray="8,8"
              />
            )}
            {notes.map((n) => (
              <Note
                key={n.id}
                data={n}
                onMouseDown={(e) =>
                  handleMouseDownOnElement(e, n.id, ObjectType.NOTE)
                }
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
