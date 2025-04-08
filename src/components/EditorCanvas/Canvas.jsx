import { useRef, useState } from "react";
import {
  Action,
  Cardinality,
  Constraint,
  darkBgTheme,
  ObjectType,
  tableFieldHeight,
  tableHeaderHeight,
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
import { useEventListener } from "usehooks-ts";
import { areFieldsCompatible } from "../../utils/utils";
import { getRectFromEndpoints, isInsideRect } from "../../utils/rect";

export default function Canvas() {
  const { t } = useTranslation();

  const canvasRef = useRef(null);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;

  const { tables, updateTable, relationships, addRelationship, database } =
    useDiagram();
  const { areas, updateArea } = useAreas();
  const { notes, updateNote } = useNotes();
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { transform, setTransform } = useTransform();
  const {
    selectedElement,
    setSelectedElement,
    bulkSelectedElements,
    setBulkSelectedElements,
  } = useSelect();
  const [dragging, setDragging] = useState({
    element: ObjectType.NONE,
    id: -1,
    prevX: 0,
    prevY: 0,
    initialPositions: [],
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
  const [bulkSelectRectPts, setBulkSelectRectPts] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    show: false,
  });

  const collectSelectedElements = () => {
    const rect = getRectFromEndpoints(bulkSelectRectPts);

    const elements = [];

    tables.forEach((table) => {
      if (
        isInsideRect(
          {
            x: table.x,
            y: table.y,
            width: settings.tableWidth,
            height:
              table.fields.length * tableFieldHeight + tableHeaderHeight + 7,
          },
          rect,
        )
      ) {
        elements.push({
          id: table.id,
          type: ObjectType.TABLE,
        });
      }
    });

    areas.forEach((area) => {
      if (
        isInsideRect(
          {
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
          },
          rect,
        )
      ) {
        elements.push({
          id: area.id,
          type: ObjectType.AREA,
        });
      }
    });

    notes.forEach((note) => {
      if (
        isInsideRect(
          {
            x: note.x,
            y: note.y,
            width: 180,
            height: note.height,
          },
          rect,
        )
      ) {
        elements.push({
          id: note.id,
          type: ObjectType.NOTE,
        });
      }
    });

    setBulkSelectedElements(elements);
  };

  const getElement = (element) => {
    switch (element.type) {
      case ObjectType.TABLE:
        return tables[element.id];
      case ObjectType.AREA:
        return areas[element.id];
      case ObjectType.NOTE:
        return notes[element.id];
      default:
        return { x: 0, y: 0 };
    }
  };

  /**
   * @param {PointerEvent} e
   * @param {number} id
   * @param {ObjectType[keyof ObjectType]} type
   */
  const handlePointerDownOnElement = (e, id, type) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (type === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === id);
      setGrabOffset({
        x: table.x - pointer.spaces.diagram.x,
        y: table.y - pointer.spaces.diagram.y,
      });
      setDragging((prev) => ({
        ...prev,
        id,
        element: type,
        prevX: table.x,
        prevY: table.y,
      }));
    } else if (type === ObjectType.AREA) {
      const area = areas.find((t) => t.id === id);
      setGrabOffset({
        x: area.x - pointer.spaces.diagram.x,
        y: area.y - pointer.spaces.diagram.y,
      });
      setDragging((prev) => ({
        ...prev,
        id,
        element: type,
        prevX: area.x,
        prevY: area.y,
      }));
    } else if (type === ObjectType.NOTE) {
      const note = notes.find((t) => t.id === id);
      setGrabOffset({
        x: note.x - pointer.spaces.diagram.x,
        y: note.y - pointer.spaces.diagram.y,
      });
      setDragging((prev) => ({
        ...prev,
        id,
        element: type,
        prevX: note.x,
        prevY: note.y,
      }));
    }

    if (bulkSelectedElements.length) {
      setDragging((prev) => ({
        ...prev,
        initialPositions: bulkSelectedElements.map((element) => ({
          ...element,
          undo: {
            x: getElement(element).x,
            y: getElement(element).y,
          },
        })),
      }));
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
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (linking) {
      setLinkingLine({
        ...linkingLine,
        endX: pointer.spaces.diagram.x,
        endY: pointer.spaces.diagram.y,
      });
    } else if (
      dragging.element !== ObjectType.NONE &&
      dragging.id >= 0 &&
      bulkSelectedElements.length
    ) {
      const currentX = pointer.spaces.diagram.x + grabOffset.x;
      const currentY = pointer.spaces.diagram.y + grabOffset.y;
      const deltaX = currentX - dragging.prevX;
      const deltaY = currentY - dragging.prevY;

      for (const element of bulkSelectedElements) {
        if (element.type === ObjectType.TABLE) {
          updateTable(element.id, {
            x: tables[element.id].x + deltaX,
            y: tables[element.id].y + deltaY,
          });
        }
        if (element.type === ObjectType.AREA) {
          updateArea(element.id, {
            x: areas[element.id].x + deltaX,
            y: areas[element.id].y + deltaY,
          });
        }
        if (element.type === ObjectType.NOTE) {
          updateNote(element.id, {
            x: notes[element.id].x + deltaX,
            y: notes[element.id].y + deltaY,
          });
        }
      }

      setDragging((prev) => ({
        ...prev,
        prevX: currentX,
        prevY: currentY,
      }));
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
    } else if (bulkSelectRectPts.show) {
      setBulkSelectRectPts((prev) => ({
        ...prev,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
      }));
    }
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerDown = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    // don't pan if the sidesheet for editing a table is open
    if (
      selectedElement.element === ObjectType.TABLE &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    if (!settings.panning) {
      setBulkSelectRectPts({
        x1: pointer.spaces.diagram.x,
        y1: pointer.spaces.diagram.y,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
        show: true,
      });
      pointer.setStyle("crosshair");
    } else {
      setPanning({
        isPanning: true,
        panStart: transform.pan,
        // Diagram space depends on the current panning.
        // Use screen space to avoid circular dependencies and undefined behavior.
        cursorStart: pointer.spaces.screen,
      });
      pointer.setStyle("grabbing");
    }
  };

  const coordsDidUpdate = (element) => {
    const elementData = getElement(element);
    const updated = !(
      dragging.prevX === elementData.x && dragging.prevY === elementData.y
    );

    return (
      updated ||
      dragging.initialPositions.some(
        (el) => !(el.undo.x === elementData.x && el.undo.y === elementData.y),
      )
    );
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

  /**
   * @param {PointerEvent} e
   */
  const handlePointerUp = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (coordsDidUpdate({ id: dragging.id, type: dragging.element })) {
      if (bulkSelectedElements.length) {
        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.MOVE,
            bulk: true,
            message: t("bulk_update"),
            elements: dragging.initialPositions.map((element) => ({
              ...element,
              redo: {
                x: getElement(element).x,
                y: getElement(element).y,
              },
            })),
          },
        ]);
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.NONE,
          id: -1,
          open: false,
        }));
      } else {
        const element = getElement({
          id: dragging.id,
          type: dragging.element,
        });
        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.MOVE,
            element: dragging.element,
            x: dragging.prevX,
            y: dragging.prevY,
            toX: element.x,
            toY: element.y,
            id: dragging.id,
            message: t("move_element", {
              coords: `(${element.x}, ${element.y})`,
              name: getElement({
                id: dragging.id,
                type: dragging.element,
              }).name,
            }),
          },
        ]);
      }
      setRedoStack([]);
    }
    setDragging({
      element: ObjectType.NONE,
      id: -1,
      prevX: 0,
      prevY: 0,
      initialPositions: [],
    });

    if (bulkSelectRectPts.show) {
      setBulkSelectRectPts((prev) => ({
        ...prev,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
        show: false,
      }));
      collectSelectedElements();
    }

    if (panning.isPanning && didPan()) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.PAN,
          undo: { x: panning.x, y: panning.y },
          redo: transform.pan,
          message: t("move_element", {
            coords: `(${transform?.pan.x}, ${transform?.pan.y})`,
            name: "diagram",
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
      setBulkSelectedElements([]);
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
    setDragging({
      element: ObjectType.NONE,
      id: -1,
      prevX: 0,
      prevY: 0,
      initialPositions: [],
    });
    setLinking(true);
  };

  const handleLinking = () => {
    if (hoveredTable.tableId < 0) return;
    if (hoveredTable.field < 0) return;
    if (
      !areFieldsCompatible(
        database,
        tables[linkingLine.startTableId].fields[linkingLine.startFieldId],
        tables[hoveredTable.tableId].fields[hoveredTable.field],
      )
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
      name: `fk_${tables[linkingLine.startTableId].name}_${
        tables[linkingLine.startTableId].fields[linkingLine.startFieldId].name
      }_${tables[hoveredTable.tableId].name}`,
      id: relationships.length,
    };
    delete newRelationship.startX;
    delete newRelationship.startY;
    delete newRelationship.endX;
    delete newRelationship.endY;
    addRelationship(newRelationship);
  };

  useEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
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
    <div className="grow h-full touch-none" id="canvas">
      <div
        className="w-full h-full"
        style={{
          cursor: pointer.style,
          backgroundColor: theme === "dark" ? darkBgTheme : "white",
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
                />
              </pattern>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#pattern-circles)"
            />
          </svg>
        )}
        <svg
          id="diagram"
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
          {bulkSelectRectPts.show && (
            <rect
              {...getRectFromEndpoints(bulkSelectRectPts)}
              stroke="grey"
              fill="grey"
              fillOpacity={0.15}
              strokeDasharray={10}
            />
          )}
        </svg>
      </div>
      {settings.showDebugCoordinates && (
        <div className="fixed flex flex-col flex-wrap gap-6 bg-[rgba(var(--semi-grey-1),var(--tw-bg-opacity))]/40 border border-color bottom-4 right-4 p-4 rounded-xl backdrop-blur-xs pointer-events-none select-none">
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
