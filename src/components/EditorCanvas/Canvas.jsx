import { useRef, useState } from "react";
import {
  Action,
  Cardinality,
  Constraint,
  darkBgTheme,
  ObjectType,
  gridSize,
  gridCircleRadius,
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
  useSaveState,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { useEventListener } from "usehooks-ts";
import { areFieldsCompatible, getTableHeight } from "../../utils/utils";
import { getRectFromEndpoints, isInsideRect } from "../../utils/rect";
import { noteWidth, State } from "../../data/constants";

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
  const { setSaveState } = useSaveState();
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
  const notDragging = {
    id: -1,
    type: ObjectType.NONE,
    grabOffset: { x: 0, y: 0 },
  };
  const [dragging, setDragging] = useState(notDragging);
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
  const [hoveredTable, setHoveredTable] = useState({
    tableId: null,
    fieldId: null,
  });
  const [panning, setPanning] = useState({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cursorStart: { x: 0, y: 0 },
  });
  const [areaResize, setAreaResize] = useState({ id: -1, dir: "none" });
  const [areaInitDimensions, setAreaInitDimensions] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
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
      if (table.locked) return;

      if (
        isInsideRect(
          {
            x: table.x,
            y: table.y,
            width: settings.tableWidth,
            height: getTableHeight(table),
          },
          rect,
        )
      ) {
        elements.push({
          id: table.id,
          type: ObjectType.TABLE,
          currentCoords: { x: table.x, y: table.y },
          initialCoords: { x: table.x, y: table.y },
        });
      }
    });

    areas.forEach((area) => {
      if (area.locked) return;

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
          currentCoords: { x: area.x, y: area.y },
          initialCoords: { x: area.x, y: area.y },
        });
      }
    });

    notes.forEach((note) => {
      if (note.locked) return;

      if (
        isInsideRect(
          {
            x: note.x,
            y: note.y,
            width: noteWidth,
            height: note.height,
          },
          rect,
        )
      ) {
        elements.push({
          id: note.id,
          type: ObjectType.NOTE,
          currentCoords: { x: note.x, y: note.y },
          initialCoords: { x: note.x, y: note.y },
        });
      }
    });

    setBulkSelectedElements(elements);
  };

  const getElement = (element) => {
    switch (element.type) {
      case ObjectType.TABLE:
        return tables.find((t) => t.id === element.id);
      case ObjectType.AREA:
        return areas[element.id];
      case ObjectType.NOTE:
        return notes[element.id];
      default:
        return { x: 0, y: 0, locked: false };
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

    const element = getElement({ id, type });

    setSelectedElement((prev) => ({
      ...prev,
      element: type,
      id: id,
      open: false,
    }));

    if (element.locked) {
      setBulkSelectedElements([]);
      return;
    }

    let newBulkSelectedElements;
    if (bulkSelectedElements.some((el) => el.id === id && el.type === type)) {
      newBulkSelectedElements = bulkSelectedElements;
    } else {
      newBulkSelectedElements = [
        {
          id,
          type,
          currentCoords: { x: element.x, y: element.y },
          initialCoords: { x: element.x, y: element.y },
        },
      ];
      setBulkSelectedElements(newBulkSelectedElements);
    }

    setDragging({
      id,
      type,
      grabOffset: {
        x: pointer.spaces.diagram.x - element.x,
        y: pointer.spaces.diagram.y - element.y,
      },
    });
  };

  const coordinatesAfterSnappingToGrid = ({ x, y }) => {
    if (settings.snapToGrid) {
      return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
      };
    }
    return { x, y };
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerMove = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (panning.isPanning) {
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
      return;
    }

    if (linking) {
      setLinkingLine({
        ...linkingLine,
        endX: pointer.spaces.diagram.x,
        endY: pointer.spaces.diagram.y,
      });
      return;
    }

    if (isDragging()) {
      const { x: mainElementFinalX, y: mainElementFinalY } =
        coordinatesAfterSnappingToGrid({
          x: pointer.spaces.diagram.x - dragging.grabOffset.x,
          y: pointer.spaces.diagram.y - dragging.grabOffset.y,
        });

      const { currentCoords } = bulkSelectedElements.find(
        (el) => el.id === dragging.id && el.type === dragging.type,
      );

      const deltaX = mainElementFinalX - currentCoords.x;
      const deltaY = mainElementFinalY - currentCoords.y;

      const newBulkSelectedElements = [];
      bulkSelectedElements.forEach((el) => {
        const elementFinalCoords = {
          x: el.currentCoords.x + deltaX,
          y: el.currentCoords.y + deltaY,
        };
        if (el.type === ObjectType.TABLE) {
          updateTable(el.id, { ...elementFinalCoords });
        }
        if (el.type === ObjectType.AREA) {
          updateArea(el.id, { ...elementFinalCoords });
        }
        if (el.type === ObjectType.NOTE) {
          updateNote(el.id, { ...elementFinalCoords });
        }
        newBulkSelectedElements.push({
          ...el,
          currentCoords: elementFinalCoords,
        });
      });

      setBulkSelectedElements(newBulkSelectedElements);
      return;
    }

    if (areaResize.id !== -1) {
      if (areaResize.dir === "none") return;
      let newDims = { ...areaInitDimensions };
      setPanning((old) => ({ ...old, isPanning: false }));
      const { x, y } = coordinatesAfterSnappingToGrid(pointer.spaces.diagram);

      switch (areaResize.dir) {
        case "br":
          newDims.width = x - areaInitDimensions.x;
          newDims.height = y - areaInitDimensions.y;
          break;
        case "tl":
          newDims.x = x;
          newDims.y = y;
          newDims.width = areaInitDimensions.width - (x - areaInitDimensions.x);
          newDims.height =
            areaInitDimensions.height - (y - areaInitDimensions.y);
          break;
        case "tr":
          newDims.y = y;
          newDims.width = x - areaInitDimensions.x;
          newDims.height =
            areaInitDimensions.height - (y - areaInitDimensions.y);
          break;
        case "bl":
          newDims.x = x;
          newDims.width = areaInitDimensions.width - (x - areaInitDimensions.x);
          newDims.height = y - areaInitDimensions.y;
          break;
      }

      updateArea(areaResize.id, { ...newDims });
      return;
    }

    if (bulkSelectRectPts.show) {
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
    if (!e.isPrimary) return;

    // don't pan if the sidesheet for editing a table is open
    if (
      selectedElement.element === ObjectType.TABLE &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    const isMouseLeftButton = e.button === 0;
    const isMouseMiddleButton = e.button === 1;

    if (isMouseLeftButton) {
      setBulkSelectRectPts({
        x1: pointer.spaces.diagram.x,
        y1: pointer.spaces.diagram.y,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
        show: true,
      });
      pointer.setStyle("crosshair");
    } else if (isMouseMiddleButton) {
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

  const isDragging = () => {
    return dragging.type !== ObjectType.NONE && dragging.id !== -1;
  };

  const didDrag = () => {
    if (!isDragging()) return false;
    // checking any element is sufficient
    const { currentCoords, initialCoords } = bulkSelectedElements[0];
    return (
      currentCoords.x !== initialCoords.x || currentCoords.y !== initialCoords.y
    );
  };

  const didResize = (id) => {
    return !(
      areas[id].x === areaInitDimensions.x &&
      areas[id].y === areaInitDimensions.y &&
      areas[id].width === areaInitDimensions.width &&
      areas[id].height === areaInitDimensions.height
    );
  };

  const didPan = () =>
    !(
      transform.pan.x === panning.panStart.x &&
      transform.pan.y === panning.panStart.y
    );

  /**
   * @param {PointerEvent} e
   */
  const handlePointerUp = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (didDrag()) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.MOVE,
          bulk: true,
          message: t("bulk_update"),
          elements: bulkSelectedElements.map((el) => ({
            id: el.id,
            type: el.type,
            undo: el.initialCoords,
            redo: el.currentCoords,
          })),
        },
      ]);
      setRedoStack([]);
      setBulkSelectedElements((prev) =>
        prev.map((el) => ({
          ...el,
          initialCoords: { ...el.currentCoords },
        })),
      );
    }

    if (bulkSelectRectPts.show) {
      setBulkSelectRectPts((prev) => ({
        ...prev,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
        show: false,
      }));
      if (!isDragging()) {
        collectSelectedElements();
      }
    }
    setDragging(notDragging);

    if (panning.isPanning && didPan()) {
      setSaveState(State.SAVING);
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
            x: areaInitDimensions.x,
            y: areaInitDimensions.y,
            width: areaInitDimensions.width,
            height: areaInitDimensions.height,
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
    setAreaInitDimensions({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  };

  const handleGripField = () => {
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging(notDragging);
    setLinking(true);
  };

  const handleLinking = () => {
    if (hoveredTable.tableId === null) return;
    if (hoveredTable.fieldId === null) return;

    const { fields: startTableFields, name: startTableName } = tables.find(
      (t) => t.id === linkingLine.startTableId,
    );
    const { type: startType, name: startFieldName } = startTableFields.find(
      (f) => f.id === linkingLine.startFieldId,
    );
    const { fields: endTableFields, name: endTableName } = tables.find(
      (t) => t.id === hoveredTable.tableId,
    );
    const { type: endType } = endTableFields.find(
      (f) => f.id === hoveredTable.fieldId,
    );

    if (!areFieldsCompatible(database, startType, endType)) {
      Toast.info(t("cannot_connect"));
      return;
    }
    if (
      linkingLine.startTableId === hoveredTable.tableId &&
      linkingLine.startFieldId === hoveredTable.fieldId
    )
      return;

    const newRelationship = {
      ...linkingLine,
      endTableId: hoveredTable.tableId,
      endFieldId: hoveredTable.fieldId,
      cardinality: Cardinality.ONE_TO_ONE,
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: `fk_${startTableName}_${startFieldName}_${endTableName}`,
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

  return (
    <div className="grow h-full touch-none" id="canvas">
      <div
        className="w-full h-full"
        style={{
          cursor: pointer.style,
          backgroundColor: settings.mode === "dark" ? darkBgTheme : "white",
        }}
      >
        <svg
          id="diagram"
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="absolute w-full h-full touch-none"
          viewBox={`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`}
        >
          {settings.showGrid && (
            <>
              <defs>
                <pattern
                  id="pattern-grid"
                  x={-gridCircleRadius}
                  y={-gridCircleRadius}
                  width={gridSize}
                  height={gridSize}
                  patternUnits="userSpaceOnUse"
                  patternContentUnits="userSpaceOnUse"
                >
                  <circle
                    cx={gridCircleRadius}
                    cy={gridCircleRadius}
                    r={gridCircleRadius}
                    fill="rgb(99, 152, 191)"
                    opacity="1"
                  />
                </pattern>
              </defs>
              <rect
                x={viewBox.left}
                y={viewBox.top}
                width={viewBox.width}
                height={viewBox.height}
                fill="url(#pattern-grid)"
              />
            </>
          )}
          {areas.map((a) => (
            <Area
              key={a.id}
              data={a}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, a.id, ObjectType.AREA)
              }
              setResize={setAreaResize}
              setInitDimensions={setAreaInitDimensions}
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
