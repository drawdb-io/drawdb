import { useRef, useState } from "react";
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
  useCanvas,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useSelect,
  useAreas,
  useNotes,
  useLayout,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { diagram } from "../../data/heroDiagram";
import { useEventListener } from "usehooks-ts";

export default function Canvas() {
  const { t } = useTranslation();

  const canvasRef = useRef(null);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;

  const { tables, updateTable, relationships, addRelationship } = useDiagram();
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
  const [grabOffset, setGrabOffset] = useState({ x: 0, y: 0 });
  const [hoveredTable, setHoveredTable] = useState({
    tableId: -1,
    field: -2,
  });
  const [panning, setPanning] = useState({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cursorStart: { x: 0, y: 0 },
  });
  const [areaResize, setAreaResize] = useState({ id: -1, dir: "none" });
  const [initCoords, setInitCoords] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    pointerX: 0,
    pointerY: 0,
  });

  /**
   * @param {PointerEvent} e
   * @param {*} id
   * @param {ObjectType[keyof ObjectType]} type
   */
  const handlePointerDownOnElement = (e, id, type) => {
    if (!e.isPrimary) return;

    if (type === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === id);
      setGrabOffset({
        x: table.x - pointer.spaces.diagram.x,
        y: table.y - pointer.spaces.diagram.y,
      });
      setDragging({
        element: type,
        id: id,
        prevX: table.x,
        prevY: table.y,
      });
    } else if (type === ObjectType.AREA) {
      const area = areas.find((t) => t.id === id);
      setGrabOffset({
        x: area.x - pointer.spaces.diagram.x,
        y: area.y - pointer.spaces.diagram.y,
      });
      setDragging({
        element: type,
        id: id,
        prevX: area.x,
        prevY: area.y,
      });
    } else if (type === ObjectType.NOTE) {
      const note = notes.find((t) => t.id === id);
      setGrabOffset({
        x: note.x - pointer.spaces.diagram.x,
        y: note.y - pointer.spaces.diagram.y,
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

  /**
   * @param {PointerEvent} e
   */
  const handlePointerMove = (e) => {
    if (!e.isPrimary) return;

    if (linking) {
      setLinkingLine({
        ...linkingLine,
        endX: pointer.spaces.diagram.x,
        endY: pointer.spaces.diagram.y,
      });
    } else if (
      panning.isPanning &&
      dragging.element === ObjectType.NONE &&
      areaResize.id === -1
    ) {
      if (!settings.panning) {
        return;
      }
      setTransform((prev) => ({
        ...prev,
        pan: {
          x:
            panning.panStart.x +
            (panning.cursorStart.x - pointer.spaces.screen.x) / transform.zoom,
          y:
            panning.panStart.y +
            (panning.cursorStart.y - pointer.spaces.screen.y) / transform.zoom,
        },
      }));
    } else if (dragging.element === ObjectType.TABLE && dragging.id >= 0) {
      updateTable(dragging.id, {
        x: pointer.spaces.diagram.x + grabOffset.x,
        y: pointer.spaces.diagram.y + grabOffset.y,
      });
    } else if (
      dragging.element === ObjectType.AREA &&
      dragging.id >= 0 &&
      areaResize.id === -1
    ) {
      updateArea(dragging.id, {
        x: pointer.spaces.diagram.x + grabOffset.x,
        y: pointer.spaces.diagram.y + grabOffset.y,
      });
    } else if (dragging.element === ObjectType.NOTE && dragging.id >= 0) {
      updateNote(dragging.id, {
        x: pointer.spaces.diagram.x + grabOffset.x,
        y: pointer.spaces.diagram.y + grabOffset.y,
      });
    } else if (areaResize.id !== -1) {
      if (areaResize.dir === "none") return;
      let newDims = { ...initCoords };
      delete newDims.pointerX;
      delete newDims.pointerY;
      setPanning((old) => ({ ...old, isPanning: false }));

      switch (areaResize.dir) {
        case "br":
          newDims.width = pointer.spaces.diagram.x - initCoords.x;
          newDims.height = pointer.spaces.diagram.y - initCoords.y;
          break;
        case "tl":
          newDims.x = pointer.spaces.diagram.x;
          newDims.y = pointer.spaces.diagram.y;
          newDims.width =
            initCoords.x + initCoords.width - pointer.spaces.diagram.x;
          newDims.height =
            initCoords.y + initCoords.height - pointer.spaces.diagram.y;
          break;
        case "tr":
          newDims.y = pointer.spaces.diagram.y;
          newDims.width = pointer.spaces.diagram.x - initCoords.x;
          newDims.height =
            initCoords.y + initCoords.height - pointer.spaces.diagram.y;
          break;
        case "bl":
          newDims.x = pointer.spaces.diagram.x;
          newDims.width =
            initCoords.x + initCoords.width - pointer.spaces.diagram.x;
          newDims.height = pointer.spaces.diagram.y - initCoords.y;
          break;
      }

      updateArea(areaResize.id, { ...newDims });
    }
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerDown = (e) => {
    if (!e.isPrimary) return;

    // don't pan if the sidesheet for editing a table is open
    if (
      selectedElement.element === ObjectType.TABLE &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    setPanning({
      isPanning: true,
      panStart: transform.pan,
      // Diagram space depends on the current panning.
      // Use screen space to avoid circular dependencies and undefined behavior.
      cursorStart: pointer.spaces.screen,
    });
    pointer.setStyle("grabbing");
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
    !(transform.pan.x === panning.x && transform.pan.y === panning.y);

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

  /**
   * @param {PointerEvent} e
   */
  const handlePointerUp = (e) => {
    if (!e.isPrimary) return;

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
          message: t("move_element", {
            coords: `(${info.x}, ${info.y})`,
            name: info.name,
          }),
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
          message: t("move_element", {
            coords: `(${transform?.pan.x}, ${transform?.pan.y})`,
            name: diagram,
          }),
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
    setPanning((old) => ({ ...old, isPanning: false }));
    pointer.setStyle("default");
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
          message: t("edit_area", {
            areaName: areas[areaResize.id].name,
            extra: "[resize]",
          }),
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
      pointerX: 0,
      pointerY: 0,
    });
  };

  const handleGripField = () => {
    setPanning((old) => ({ ...old, isPanning: false }));
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
      Toast.info(t("cannot_connect"));
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

  // Handle mouse wheel scrolling
  useEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // How "eager" the viewport is to
        // center the cursor's coordinates
        const eagernessFactor = 0.05;
        setTransform((prev) => ({
          pan: {
            x:
              prev.pan.x -
              (pointer.spaces.diagram.x - prev.pan.x) *
                eagernessFactor *
                Math.sign(e.deltaY),
            y:
              prev.pan.y -
              (pointer.spaces.diagram.y - prev.pan.y) *
                eagernessFactor *
                Math.sign(e.deltaY),
          },
          zoom: e.deltaY <= 0 ? prev.zoom * 1.05 : prev.zoom / 1.05,
        }));
      } else if (e.shiftKey) {
        setTransform((prev) => ({
          ...prev,
          pan: {
            ...prev.pan,
            x: prev.pan.x + e.deltaY / prev.zoom,
          },
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x + e.deltaX / prev.zoom,
            y: prev.pan.y + e.deltaY / prev.zoom,
          },
        }));
      }
    },
    canvasRef,
    { passive: false },
  );

  const theme = localStorage.getItem("theme");

  return (
    <div className="flex-grow h-full touch-none" id="canvas">
      <div
        className="w-full h-full"
        style={{
          cursor: pointer.style,
          backgroundColor: theme === "dark" ? "rgba(22, 22, 26, 1)" : "white",
        }}
      >
        {settings.showGrid && (
          <svg className="absolute w-full h-full">
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
          </svg>
        )}
        <svg
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="absolute w-full h-full touch-none"
          viewBox={`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`}
        >
          {areas.map((a) => (
            <Area
              key={a.id}
              data={a}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, a.id, ObjectType.AREA)
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
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, table.id, ObjectType.TABLE)
              }
            />
          ))}
          {linking && (
            <path
              d={`M ${linkingLine.startX} ${linkingLine.startY} L ${linkingLine.endX} ${linkingLine.endY}`}
              stroke="red"
              strokeDasharray="8,8"
              className="pointer-events-none touch-none"
            />
          )}
          {notes.map((n) => (
            <Note
              key={n.id}
              data={n}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, n.id, ObjectType.NOTE)
              }
            />
          ))}
        </svg>
      </div>
      {settings.showDebugCoordinates && (
        <div className="fixed flex flex-col flex-wrap gap-6 bg-[rgba(var(--semi-grey-1),var(--tw-bg-opacity))]/40 border border-color bottom-4 right-4 p-4 rounded-xl backdrop-blur-sm pointer-events-none select-none">
          <table className="table-auto grow">
            <thead>
              <tr>
                <th className="text-left" colSpan={3}>
                  {t("transform")}
                </th>
              </tr>
              <tr className="italic [&_th]:font-normal [&_th]:text-right">
                <th>pan x</th>
                <th>pan y</th>
                <th>scale</th>
              </tr>
            </thead>
            <tbody className="[&_td]:text-right [&_td]:min-w-[8ch]">
              <tr>
                <td>{transform.pan.x.toFixed(2)}</td>
                <td>{transform.pan.y.toFixed(2)}</td>
                <td>{transform.zoom.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={4}>{t("viewbox")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>left</th>
                <th>top</th>
                <th>width</th>
                <th>height</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{viewBox.left.toFixed(2)}</td>
                <td>{viewBox.top.toFixed(2)}</td>
                <td>{viewBox.width.toFixed(2)}</td>
                <td>{viewBox.height.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={3}>{t("cursor_coordinates")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>{t("coordinate_space")}</th>
                <th>x</th>
                <th>y</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("coordinate_space_screen")}</td>
                <td>{pointer.spaces.screen.x.toFixed(2)}</td>
                <td>{pointer.spaces.screen.y.toFixed(2)}</td>
              </tr>
              <tr>
                <td>{t("coordinate_space_diagram")}</td>
                <td>{pointer.spaces.diagram.x.toFixed(2)}</td>
                <td>{pointer.spaces.diagram.y.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
