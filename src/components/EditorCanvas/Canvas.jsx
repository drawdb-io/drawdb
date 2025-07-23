import { useRef, useState } from "react";
import {
  Action,
  RelationshipType,
  RelationshipCardinalities,
  Constraint,
  darkBgTheme,
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
import { useEventListener } from "usehooks-ts";
import { areFieldsCompatible } from "../../utils/utils";

export default function Canvas() {
  const { t } = useTranslation();

  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectionArea, setSelectionArea] = useState({
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const canvasRef = useRef(null);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;

  const { tables, updateTable, relationships, addRelationship } =
    useDiagram();
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
    if (selectedElement.open && !layout.sidebar) return;
    if (!e.isPrimary) return;

    // Verify if already selected (for multiple selection)
    const alreadySelected =
      Array.isArray(selectedElement.id)
        ? selectedElement.id.includes(id)
        : selectedElement.id === id;

        let elementData;
    if (type === ObjectType.TABLE) {
      elementData = tables.find((t) => t.id === id);
    } else if (type === ObjectType.AREA) {
      elementData = areas.find((a) => a.id === id);
    } else if (type === ObjectType.NOTE) {
      elementData = notes.find((n) => n.id === id);
    }

    if (!elementData) return;

    // Calcular offset
    setGrabOffset({
      x: elementData.x - pointer.spaces.diagram.x,
      y: elementData.y - pointer.spaces.diagram.y,
    });

    // If the object is alredy selected and the selection is multiple,
    // strore the initial position of each one in the selection
    if (alreadySelected && Array.isArray(selectedElement.id)) {
      const initialPositions = {};
      selectedElement.id.forEach((tableId) => {
        const tData = tables.find((t) => t.id === tableId);
        if (tData) {
          initialPositions[tableId] = { x: tData.x, y: tData.y };
        }
      });
      setDragging({
        element: type,
        id: selectedElement.id,
        prevX: elementData.x,
        prevY: elementData.y,
        initialPositions,
      });
    } else {
      setDragging({
        element: type,
        id: id,
        prevX: elementData.x,
        prevY: elementData.y,
      });
      setSelectedElement((prev) => ({
        ...prev,
        element: type,
        id: id,
        open: false,
      }));
    }
    setDragStart({
      x: pointer.spaces.diagram.x,
      y: pointer.spaces.diagram.y,
    });
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerMove = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (isAreaSelecting) {
      const currentX = pointer.spaces.diagram.x;
      const currentY = pointer.spaces.diagram.y;
      setSelectionArea((prev) => ({
        ...prev,
        x: Math.min(prev.startX, currentX),
        y: Math.min(prev.startY, currentY),
        width: Math.abs(currentX - prev.startX),
        height: Math.abs(currentY - prev.startY),
      }));
      // Only update the area, without finalizing it yet.
      return;
    }

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
    } else if (dragging.element === ObjectType.TABLE) {
      if (Array.isArray(dragging.id)) {
        const deltaX = pointer.spaces.diagram.x - dragStart.x;
        const deltaY = pointer.spaces.diagram.y - dragStart.y;
        dragging.id.forEach((tableId) => {
          const initPos = dragging.initialPositions[tableId];
          updateTable(tableId, {
            x: initPos.x + deltaX,
            y: initPos.y + deltaY,
          });
        });
      } else {
        // Move table individually
        updateTable(dragging.id, {
          x: pointer.spaces.diagram.x + grabOffset.x,
          y: pointer.spaces.diagram.y + grabOffset.y,
        });
      }
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
    if (e.isPrimary && e.target.id === "diagram") {
      // if the user clicks on the background, reset the selected element
      // desactivate area selection and move mode
      setDragging({
        element: ObjectType.NONE,
        id: -1,
        prevX: 0,
        prevY: 0,
      });
      setSelectedElement({
        ...selectedElement,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      });
      setPanning((prev) => ({ ...prev, isPanning: false }));
    }

    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    // If pressing Alt + left click, start area selection
    if (e.altKey && e.button === 0) {
      setIsAreaSelecting(true);
      setSelectionArea({
          startX: pointer.spaces.diagram.x,
          startY: pointer.spaces.diagram.y,
          x: pointer.spaces.diagram.x,
          y: pointer.spaces.diagram.y,
          width: 0,
          height: 0,
      });
      return;
  }

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
    // multiple selection
    if (Array.isArray(dragging.id)) {
      return dragging.id.some((id) => {
        const table = tables.find((t) => t.id === id);
        const initPos = dragging.initialPositions?.[id];
        return table && initPos ? !(initPos.x === table.x && initPos.y === table.y) : false;
      });
    }

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
        if (Array.isArray(dragging.id)) {
          let sumX = 0,
            sumY = 0,
            count = 0;
          dragging.id.forEach((id) => {
            const table = tables.find((t) => t.id === id);
            if (table) {
              sumX += table.x;
              sumY += table.y;
              count++;
            }
          });
          return {
            name: `${count} tables`,
            x: count ? Math.round(sumX / count) : 0,
            y: count ? Math.round(sumY / count) : 0,
          };
        } else {
          const table = tables.find((t) => t.id === dragging.id);
          if (!table) return {};
          return {
            name: table.name,
            x: Math.round(table.x),
            y: Math.round(table.y),
          };
        }
      case ObjectType.AREA:
        if (Array.isArray(dragging.id)) {
          let sumX = 0,
            sumY = 0,
            count = 0;
          dragging.id.forEach((id) => {
            const area = areas.find((a) => a.id === id);
            if (area) {
              sumX += area.x;
              sumY += area.y;
              count++;
            }
          });
          return {
            name: `${count} areas`,
            x: count ? Math.round(sumX / count) : 0,
            y: count ? Math.round(sumY / count) : 0,
          };
        } else {
          const area = areas.find((a) => a.id === dragging.id);
          if (!area) return {};
          return {
            name: area.name,
            x: Math.round(area.x),
            y: Math.round(area.y),
          };
        }
      case ObjectType.NOTE:
        if (Array.isArray(dragging.id)) {
          let sumX = 0,
            sumY = 0,
            count = 0;
          dragging.id.forEach((id) => {
            const note = notes.find((n) => n.id === id);
            if (note) {
              sumX += note.x;
              sumY += note.y;
              count++;
            }
          });
          return {
            name: `${count} notes`,
            x: count ? Math.round(sumX / count) : 0,
            y: count ? Math.round(sumY / count) : 0,
          };
        } else {
          const note = notes.find((n) => n.id === dragging.id);
          if (!note) return {};
          return {
            name: note.title,
            x: Math.round(note.x),
            y: Math.round(note.y),
          };
        }
      default:
        return false;
    }
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerUp = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (isAreaSelecting) {
      const areaBBox = selectionArea;
      const selectedTables = tables.filter((table) => {
        return (
          table.x >= areaBBox.x &&
          table.x <= areaBBox.x + areaBBox.width &&
          table.y >= areaBBox.y &&
          table.y <= areaBBox.y + areaBBox.height
        );
      });

      if (selectedTables.length > 0) {
        setSelectedElement({
          ...selectedElement,
          element: ObjectType.TABLE,
          id: selectedTables.map((t) => t.id),
          open: false,
        });
        // set start point for dragging
        setDragStart({
          x: pointer.spaces.diagram.x,
          y: pointer.spaces.diagram.y,
        })
      }
      setIsAreaSelecting(false);
      return;
    }

    if (coordsDidUpdate(dragging.element)) {
        const info = getMovedElementDetails();
        setUndoStack((prev) => {
          if (Array.isArray(dragging.id)) {
              const existingIndex = prev.findIndex(
                  (action) =>
                      action.action === Action.MOVE &&
                      action.element === dragging.element &&
                      Array.isArray(action.id) &&
                      action.id.length === dragging.id.length
              );
              const newAction = {
                  action: Action.MOVE,
                  element: dragging.element,
                  // Start position of each object (captured when the drag starts)
                  initialPositions: dragging.initialPositions,
                  // Final positions of each object (captured when the drag ends)
                  finalPositions: dragging.id.reduce((acc, id) => {
                      const table = tables.find((t) => t.id === id);
                      if (table) {
                          acc[id] = { x: table.x, y: table.y };
                      }
                      return acc;
                  }, {}),
                  id: dragging.id,
                  message: t("move_element", {
                      coords: `(${info.x}, ${info.y})`,
                      name: info.name,
                  }),
              };
              if (existingIndex !== -1) {
                  return [
                      ...prev.slice(0, existingIndex),
                      newAction,
                      ...prev.slice(existingIndex + 1),
                  ];
              }
              return [...prev, newAction];
          }
          const existingIndex = prev.findIndex(
              (action) =>
                  action.action === Action.MOVE &&
                  action.element === dragging.element &&
                  action.id === dragging.id
          );
          const newAction = {
              action: Action.MOVE,
              element: dragging.element,
              from: { x: dragging.prevX, y: dragging.prevY },
              to: { x: info.x, y: info.y },
              id: dragging.id,
              message: t("move_element", {
                  coords: `(${info.x}, ${info.y})`,
                  name: info.name,
              }),
          };
          if (existingIndex !== -1) {
              return [
                  ...prev.slice(0, existingIndex),
                  newAction,
                  ...prev.slice(existingIndex + 1),
              ];
          }
          return [...prev, newAction];
      });
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

  const handleGripField = (field, fieldTableid) => {
      // A field can be a foreign key only if it's a primary key or both NOT NULL and UNIQUE.
      // If it can't be selected, show an error message and exit.
      if (!field.primary && !(field.notNull && field.unique)) {
        Toast.info(t("cannot_fk"));
        return;
      }
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    setLinkingLine({
      ...linkingLine,
      startTableId: fieldTableid,
      startFieldId: field.id,
      startX: pointer.spaces.diagram.x,
      startY: pointer.spaces.diagram.y,
      endX: pointer.spaces.diagram.x,
      endY: pointer.spaces.diagram.y,
      endTableId: -1,
      endFieldId: -1,
    });
    setLinking(true);
  };

  const handleLinking = () => {
    if (hoveredTable.tableId < 0) return;
    // Get the childTable and parentTable
    const childTable = tables.find((t) => t.id === hoveredTable.tableId);
    const parentTable = tables.find((t) => t.id === linkingLine.startTableId);

    if (!parentTable) {
      console.error("Parent table not found for linking.");
      setLinking(false);
      return;
    }
    if (!childTable) {
      console.error("Child table not found for linking.");
      setLinking(false);
      return;
    }
    const parentFields = parentTable.fields.filter((field) => field.primary);

    if (parentFields.length === 0) {
      Toast.info(t("no_primary_key"));
      setLinking(false);
      return;
    }
    // If the relationship is recursive
    const recursiveRelation = parentTable === childTable;
    if (!recursiveRelation) {
      if (!areFieldsCompatible(parentFields, childTable)) {
        Toast.info(t("duplicate_field_name"));
        setLinking(false);
        return;
      }
    }
    // Check if the relationship already exists
    const alreadyLinked = relationships.some(
      (rel) =>
        rel.startTableId === linkingLine.startTableId &&
        rel.endTableId === hoveredTable.tableId &&
        rel.startFieldId === linkingLine.startFieldId &&
        rel.endFieldId === (parentFields.map(
          (field, index) =>
            childTable.fields.reduce(
              (maxId, f) =>
                Math.max(maxId, typeof f.id === 'number' ? f.id : -1), -1) + 1 + index)[0])
    );
    if (alreadyLinked) {
      Toast.info(t("duplicate_relationship"));
      setLinking(false);
      return;
    }
    // Save the ID of the child table before modifying its fields
    const childTableIdForFks = childTable.id;
    // Generate new fields for the childTable
    const newFields = parentFields.map((field, index) => ({
      name: recursiveRelation ? "" : field.name,
      type: field.type,
      size: field.size,
      notNull: true,
      unique: false,
      default: "",
      check: "",
      primary: false,
      increment: false,
      comment: "",
      foreignK: true,
      foreignKey: {
        tableId: parentTable.id,
        fieldId: field.id,
      },
      id: childTable.fields.reduce((maxId, f) => Math.max(maxId, typeof f.id === 'number' ? f.id : -1), -1) + 1 + index,
    }));
    // Concatenate the existing fields with the new fields
    const updatedChildFields = [...childTable.fields, ...newFields];
    // Update the childTable with the new fields
    updateTable(childTableIdForFks, {
      fields: updatedChildFields,
    });
    const actualStartFieldId = parentTable.fields.find(
      (f) => f.id === linkingLine.startFieldId);
    const relationshipName = `${parentTable.name}_${actualStartFieldId ? actualStartFieldId.name : 'table'}`;
    // Use the updated childTable fields to create the new relationship
    const newRelationship = {
      startTableId: linkingLine.startTableId,
      startFieldId: linkingLine.startFieldId,
      endTableId: hoveredTable.tableId,
      endFieldId: newFields.length > 0 ? newFields[0].id : undefined,
      relationshipType: RelationshipType.ONE_TO_ONE, // Default, can be changed by editing the relationship
      cardinality: RelationshipCardinalities[RelationshipType.ONE_TO_ONE][0].label,
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: relationshipName,
    };

    delete newRelationship.startX;
    delete newRelationship.startY;
    delete newRelationship.endX;
    delete newRelationship.endY;
    // Add the new relationship to the relationships array
    addRelationship(newRelationship, newFields, childTableIdForFks, true);
    setLinking(false);
  };

  // Handle mouse wheel scrolling
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

  useEventListener("keyup", (e) => {
    if (e.key === "Alt") {
      // deactivate area selection
      setIsAreaSelecting(false);
    }
  });
  const theme = localStorage.getItem("theme");

  return (
    <div className="flex-grow h-full touch-none" id="canvas">
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
          {tables.map((table) => {
            const isMoving =
              dragging.element === ObjectType.TABLE &&
              (Array.isArray(dragging.id)
                ? dragging.id.includes(table.id)
                : dragging.id === table.id);
            return (
              <Table
                key={table.id}
                tableData={table}
                moving={isMoving}
                setHoveredTable={setHoveredTable}
                handleGripField={handleGripField}
                setLinkingLine={setLinkingLine}
                onPointerDown={(e) =>
                  handlePointerDownOnElement(e, table.id, ObjectType.TABLE)
                }
              />
            );
          })}
          {/*Draw the selection areas*/
          isAreaSelecting && (
            <rect
              x={selectionArea.x}
              y={selectionArea.y}
              width={selectionArea.width}
              height={selectionArea.height}
              fill="rgba(99, 152, 191, 0.3)"
              stroke="rgb(99, 152, 191)"
              strokeWidth="2"
            />
          )}
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
