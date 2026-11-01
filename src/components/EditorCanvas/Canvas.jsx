import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Slot } from "../../context/ExtensionsContext";
import {
  Action,
  Cardinality,
  Constraint,
  darkBgTheme,
  ObjectType,
  gridSize,
  gridCircleRadius,
  minAreaSize,
  defaultRelationshipColor,
} from "../../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import Table, { TableEditSheet } from "./Table";
import View from "./View";
import Area from "./Area";
import Relationship, { RelationshipEditSheet } from "./Relationship";
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
  useCollab,
  useViews,
  useAreaMembership,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { useEventListener } from "usehooks-ts";
import {
  areFieldsCompatible,
  getRelatedFieldKeysByTable,
  getTableHeight,
  getTableWidth,
} from "../../utils/utils";
import CanvasScrollbars from "./CanvasScrollbars";
import {
  getViewHeight,
  getViewWidth,
  resolveViewColumns,
} from "../../utils/views";
import {
  findContainingArea,
  getRectFromEndpoints,
  isInsideRect,
} from "../../utils/rect";
import { State, noteWidth } from "../../data/constants";
import { nanoid } from "nanoid";

const noHiddenAreas = {
  areaHiddenTableIds: new Set(),
  tableCountByArea: new Map(),
};

const notDragging = {
  id: -1,
  type: ObjectType.NONE,
  grabOffset: { x: 0, y: 0 },
};

export default function Canvas() {
  const { t } = useTranslation();

  const canvasRef = useRef(null);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;

  const { tables, updateTables, relationships, addRelationship, database } =
    useDiagram();
  const { setSaveState } = useSaveState();
  const { areas, updateArea } = useAreas();
  const { views, updateView } = useViews();
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
  const { emitAwareness } = useCollab();
  const lastLinkingRef = useRef(false);
  const rightClickPanned = useRef(false);

  useEffect(() => {
    if (linking) {
      emitAwareness({
        linking: {
          startX: linkingLine.startX,
          startY: linkingLine.startY,
          endX: linkingLine.endX,
          endY: linkingLine.endY,
        },
      });
      lastLinkingRef.current = true;
    } else if (lastLinkingRef.current) {
      emitAwareness({ linking: null });
      lastLinkingRef.current = false;
    }
  }, [
    linking,
    linkingLine.startX,
    linkingLine.startY,
    linkingLine.endX,
    linkingLine.endY,
    emitAwareness,
  ]);
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
  const [bulkSelectRect, setBulkSelectRect] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    show: false,
    ctrlKey: false,
    metaKey: false,
  });
  const elementPointerDownRef = useRef(null);
  const carriedTablesRef = useRef([]);
  const handleElementPointerDown = useCallback((element, type) => {
    elementPointerDownRef.current = { element, type };
  }, []);

  const tablesById = useMemo(
    () => new Map(tables.map((table) => [table.id, table])),
    [tables],
  );

  // contentBounds holds the box around every table, area, note and view.
  // CanvasScrollbars measures the scrollable extent from it.
  const contentBounds = useMemo(() => {
    const elementBoxes = [
      ...tables.map((table) => ({
        x: table.x,
        y: table.y,
        width: getTableWidth(table),
        height: getTableHeight(table, settings.showComments),
      })),
      ...areas,
      ...notes.map((note) => ({
        x: note.x,
        y: note.y,
        width: noteWidth,
        height: note.height ?? 100,
      })),
      ...views.map((view) => ({
        x: view.x,
        y: view.y,
        width: getViewWidth(view),
        height: 200,
      })),
    ].filter((box) => Number.isFinite(box.x) && Number.isFinite(box.y));
    if (elementBoxes.length === 0) return null;
    return {
      left: Math.min(...elementBoxes.map((b) => b.x)),
      top: Math.min(...elementBoxes.map((b) => b.y)),
      right: Math.max(...elementBoxes.map((b) => b.x + b.width)),
      bottom: Math.max(...elementBoxes.map((b) => b.y + b.height)),
    };
  }, [tables, areas, notes, views, settings.showComments]);

  const relatedFieldKeysRef = useRef(new Map());
  const relatedFieldKeysByTable = useMemo(() => {
    const next = getRelatedFieldKeysByTable(relationships);
    const prev = relatedFieldKeysRef.current;
    next.forEach((keys, tableId) => {
      const old = prev.get(tableId);
      if (old && old.size === keys.size && [...keys].every((k) => old.has(k))) {
        next.set(tableId, old);
      }
    });
    relatedFieldKeysRef.current = next;
    return next;
  }, [relationships]);

  const selectedTableIds = useMemo(() => {
    const ids = new Set(
      bulkSelectedElements
        .filter((el) => el.type === ObjectType.TABLE)
        .map((el) => el.id),
    );
    if (selectedElement.element === ObjectType.TABLE) {
      ids.add(selectedElement.id);
    }
    return ids;
  }, [bulkSelectedElements, selectedElement.element, selectedElement.id]);

  const { getTableRect, resolveAreaId, persistInferredAreaIds } =
    useAreaMembership();

  const { areaHiddenTableIds, tableCountByArea } = useMemo(() => {
    const hiddenAreaIds = new Set(
      areas.filter((a) => a.hidden).map((a) => a.id),
    );
    if (hiddenAreaIds.size === 0) return noHiddenAreas;
    const areaHiddenTableIds = new Set();
    const tableCountByArea = new Map();
    tables.forEach((table) => {
      if (!hiddenAreaIds.has(table.areaId)) return;
      areaHiddenTableIds.add(table.id);
      tableCountByArea.set(
        table.areaId,
        (tableCountByArea.get(table.areaId) ?? 0) + 1,
      );
    });
    return { areaHiddenTableIds, tableCountByArea };
  }, [areas, tables]);

  const isSameElement = (el1, el2) => {
    return el1.id === el2.id && el1.type === el2.type;
  };

  const collectSelectedElements = () => {
    const rect = getRectFromEndpoints(bulkSelectRect);
    const elements = [];
    const shouldAddElement = (elementRect, element) => {
      // if ctrl key is pressed, only add the elements that are not already selected
      // can theoretically be optimized later if the selected elements is
      // a map from id to element (after the ids are made unique)
      return (
        isInsideRect(elementRect, rect) &&
        ((!bulkSelectRect.ctrlKey && !bulkSelectRect.metaKey) ||
          !bulkSelectedElements.some((el) => isSameElement(el, element)))
      );
    };

    tables.forEach((table) => {
      if (table.locked || areaHiddenTableIds.has(table.id)) return;

      const element = {
        id: table.id,
        type: ObjectType.TABLE,
        currentCoords: { x: table.x, y: table.y },
        initialCoords: { x: table.x, y: table.y },
      };
      if (shouldAddElement(getTableRect(table), element)) {
        elements.push(element);
      }
    });

    views.forEach((view) => {
      if (view.locked) return;

      const element = {
        id: view.id,
        type: ObjectType.VIEW,
        currentCoords: { x: view.x, y: view.y },
        initialCoords: { x: view.x, y: view.y },
      };
      const viewRect = {
        x: view.x,
        y: view.y,
        width: getViewWidth(view),
        height: getViewHeight(
          view,
          resolveViewColumns(view, tables),
          settings.showComments,
        ),
      };
      if (shouldAddElement(viewRect, element)) {
        elements.push(element);
      }
    });

    areas.forEach((area) => {
      if (area.locked || area.hidden) return;

      const element = {
        id: area.id,
        type: ObjectType.AREA,
        currentCoords: { x: area.x, y: area.y },
        initialCoords: { x: area.x, y: area.y },
      };
      const areaRect = {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      };
      if (shouldAddElement(areaRect, element)) {
        elements.push(element);
      }
    });

    notes.forEach((note) => {
      if (note.locked) return;

      const element = {
        id: note.id,
        type: ObjectType.NOTE,
        currentCoords: { x: note.x, y: note.y },
        initialCoords: { x: note.x, y: note.y },
      };
      const noteRect = {
        x: note.x,
        y: note.y,
        width: note.width ?? noteWidth,
        height: note.height,
      };
      if (shouldAddElement(noteRect, element)) {
        elements.push(element);
      }
    });

    if (bulkSelectRect.ctrlKey || bulkSelectRect.metaKey) {
      setBulkSelectedElements([...bulkSelectedElements, ...elements]);
    } else {
      setBulkSelectedElements(elements);
    }
  };

  const handlePointerDownOnElement = (e, { element, type }) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (!element.locked || !(e.ctrlKey || e.metaKey)) {
      setSelectedElement((prev) => ({
        ...prev,
        element: type,
        id: element.id,
        open: false,
      }));
    }

    if (element.locked) {
      if (!(e.ctrlKey || e.metaKey)) {
        setBulkSelectedElements([]);
      }
      return;
    }

    setBulkSelectRect((prev) => ({
      ...prev,
      show: false,
    }));

    // this is the object that will be added to the bulk selected elements
    // if necessary
    const elementInBulk = {
      id: element.id,
      type,
      currentCoords: { x: element.x, y: element.y },
      initialCoords: { x: element.x, y: element.y },
    };

    const isSelected = bulkSelectedElements.some((el) =>
      isSameElement(el, elementInBulk),
    );

    if (e.ctrlKey || e.metaKey) {
      if (isSelected) {
        if (bulkSelectedElements.length > 1) {
          setBulkSelectedElements(
            bulkSelectedElements.filter(
              (el) => !isSameElement(el, elementInBulk),
            ),
          );
          setSelectedElement({
            ...selectedElement,
            element: ObjectType.NONE,
            id: -1,
            open: false,
          });
        }
      } else {
        setBulkSelectedElements([...bulkSelectedElements, elementInBulk]);
      }
      setDragging(notDragging);
      return;
    }

    const dragSet = isSelected ? bulkSelectedElements : [elementInBulk];
    if (!isSelected) {
      setBulkSelectedElements(dragSet);
    }
    const draggedAreaIds = new Set(
      dragSet.filter((el) => el.type === ObjectType.AREA).map((el) => el.id),
    );
    const draggedTableIds = new Set(
      dragSet.filter((el) => el.type === ObjectType.TABLE).map((el) => el.id),
    );
    carriedTablesRef.current =
      draggedAreaIds.size === 0
        ? []
        : tables
            .filter(
              (table) =>
                !table.locked &&
                !draggedTableIds.has(table.id) &&
                draggedAreaIds.has(resolveAreaId(table, areas)),
            )
            .map((table) => ({
              id: table.id,
              initialCoords: { x: table.x, y: table.y },
              currentCoords: { x: table.x, y: table.y },
            }));
    if (draggedAreaIds.size > 0) persistInferredAreaIds(areas);
    setDragging({
      id: element.id,
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

    if (layout.readOnly) return;

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

      const { currentCoords, initialCoords } = bulkSelectedElements.find((el) =>
        isSameElement(el, dragging),
      );

      const deltaX = mainElementFinalX - currentCoords.x;
      const deltaY = mainElementFinalY - currentCoords.y;

      const newBulkSelectedElements = [];
      const tableUpdates = new Map();
      bulkSelectedElements.forEach((el) => {
        const elementFinalCoords = {
          x: el.currentCoords.x + deltaX,
          y: el.currentCoords.y + deltaY,
        };
        if (el.type === ObjectType.TABLE) {
          tableUpdates.set(el.id, elementFinalCoords);
        }
        if (el.type === ObjectType.AREA) {
          updateArea(el.id, { ...elementFinalCoords });
        }
        if (el.type === ObjectType.NOTE) {
          updateNote(el.id, { ...elementFinalCoords });
        }
        if (el.type === ObjectType.VIEW) {
          updateView(el.id, { ...elementFinalCoords });
        }
        newBulkSelectedElements.push({
          ...el,
          currentCoords: elementFinalCoords,
        });
      });

      carriedTablesRef.current.forEach((carried) => {
        carried.currentCoords = {
          x: carried.initialCoords.x + mainElementFinalX - initialCoords.x,
          y: carried.initialCoords.y + mainElementFinalY - initialCoords.y,
        };
        tableUpdates.set(carried.id, carried.currentCoords);
      });

      if (tableUpdates.size > 0) updateTables(tableUpdates);
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

      if (newDims.width <= minAreaSize) {
        newDims.width = minAreaSize;
        if (areaResize.dir === "tl" || areaResize.dir === "bl") {
          newDims.x =
            areaInitDimensions.x + areaInitDimensions.width - minAreaSize;
        }
      }

      if (newDims.height <= minAreaSize) {
        newDims.height = minAreaSize;
        if (areaResize.dir === "tl" || areaResize.dir === "tr") {
          newDims.y =
            areaInitDimensions.y + areaInitDimensions.height - minAreaSize;
        }
      }

      updateArea(areaResize.id, { ...newDims });
      return;
    }

    if (bulkSelectRect.show) {
      setBulkSelectRect((prev) => ({
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
    const elementPointerDown = elementPointerDownRef.current;
    elementPointerDownRef.current = null;

    if (!e.isPrimary) return;

    // don't pan if the sidesheet for editing a table is open
    if (
      (selectedElement.element === ObjectType.TABLE ||
        selectedElement.element === ObjectType.VIEW) &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    const isMouseLeftButton = e.button === 0;
    const isMouseMiddleButton = e.button === 1;
    const isMouseRightButton = e.button === 2;

    if (isMouseLeftButton) {
      setBulkSelectRect({
        x1: pointer.spaces.diagram.x,
        y1: pointer.spaces.diagram.y,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
        show: elementPointerDown === null || !elementPointerDown.element.locked,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      });
      if (elementPointerDown !== null) {
        handlePointerDownOnElement(e, elementPointerDown);
      }
      pointer.setStyle("crosshair");
    } else if (isMouseMiddleButton || isMouseRightButton) {
      if (isMouseRightButton) rightClickPanned.current = false;
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
    const area = areas.find((a) => a.id === id);
    return !(
      area.x === areaInitDimensions.x &&
      area.y === areaInitDimensions.y &&
      area.width === areaInitDimensions.width &&
      area.height === areaInitDimensions.height
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
      const movedAreas = bulkSelectedElements.filter(
        (el) => el.type === ObjectType.AREA,
      );
      const movedAreaIds = new Set(movedAreas.map((el) => el.id));
      const areasAt = (coordsKey) =>
        areas.map((area) => {
          const moved = movedAreas.find((el) => el.id === area.id);
          return moved ? { ...area, ...moved[coordsKey] } : area;
        });
      const areasBefore = areasAt("initialCoords");
      const areasAfter = areasAt("currentCoords");

      const areaChanges = new Map();
      bulkSelectedElements.forEach((el) => {
        if (el.type !== ObjectType.TABLE) return;
        const table = tablesById.get(el.id);
        const before = resolveAreaId(table, areasBefore, el.initialCoords);
        if (movedAreaIds.has(before)) return;
        const after =
          findContainingArea(getTableRect(table, el.currentCoords), areasAfter)
            ?.id ?? null;
        if (after !== before) areaChanges.set(el.id, { before, after });
      });
      if (areaChanges.size > 0) {
        updateTables(
          new Map(
            [...areaChanges].map(([id, { after }]) => [id, { areaId: after }]),
          ),
        );
      }

      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.MOVE,
          bulk: true,
          message: t("bulk_update"),
          elements: [
            ...bulkSelectedElements.map((el) => {
              const change =
                el.type === ObjectType.TABLE && areaChanges.get(el.id);
              return {
                id: el.id,
                type: el.type,
                undo: change
                  ? { ...el.initialCoords, areaId: change.before }
                  : el.initialCoords,
                redo: change
                  ? { ...el.currentCoords, areaId: change.after }
                  : el.currentCoords,
              };
            }),
            ...carriedTablesRef.current.map((carried) => ({
              id: carried.id,
              type: ObjectType.TABLE,
              undo: carried.initialCoords,
              redo: carried.currentCoords,
            })),
          ],
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

    if (bulkSelectRect.show) {
      setBulkSelectRect((prev) => ({
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
    carriedTablesRef.current = [];

    if (panning.isPanning && didPan()) {
      setSaveState(State.SAVING);
      if (e.button === 2) rightClickPanned.current = true;
    }
    setPanning((old) => ({ ...old, isPanning: false }));
    pointer.setStyle("default");

    if (linking) handleLinking();
    setLinking(false);

    if (areaResize.id !== -1 && didResize(areaResize.id)) {
      const resizedArea = areas.find((a) => a.id === areaResize.id);
      const areasBefore = areas.map((a) =>
        a.id === resizedArea.id ? { ...a, ...areaInitDimensions } : a,
      );
      const areaChanges = new Map();
      tables.forEach((table) => {
        const before = resolveAreaId(table, areasBefore);
        if (before !== resizedArea.id && before !== null) return;
        const rect = getTableRect(table);
        const stillInside =
          before === resizedArea.id &&
          findContainingArea(rect, [resizedArea]) !== null;
        const after = stillInside
          ? resizedArea.id
          : findContainingArea(rect, areas)?.id ?? null;
        if (after !== before) areaChanges.set(table.id, { before, after });
      });
      persistInferredAreaIds(areasBefore);
      if (areaChanges.size > 0) {
        updateTables(
          new Map(
            [...areaChanges].map(([id, { after }]) => [id, { areaId: after }]),
          ),
        );
      }
      const { x, y, width, height } = resizedArea;
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          bulk: true,
          element: ObjectType.AREA,
          message: t("edit_area", {
            areaName: resizedArea.name,
            extra: "[resize]",
          }),
          elements: [
            {
              id: resizedArea.id,
              type: ObjectType.AREA,
              undo: areaInitDimensions,
              redo: { x, y, width, height },
            },
            ...[...areaChanges].map(([id, { before, after }]) => ({
              id,
              type: ObjectType.TABLE,
              undo: { areaId: before },
              redo: { areaId: after },
            })),
          ],
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

  const handleGripField = useCallback(() => {
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging(notDragging);
    setLinking(true);
  }, []);

  const getCardinality = (startField, endField) => {
    const startIsUnique = startField.unique || startField.primary;
    const endIsUnique = endField.unique || endField.primary;

    if (startIsUnique && endIsUnique) {
      return Cardinality.ONE_TO_ONE;
    }

    if (startIsUnique && !endIsUnique) {
      return Cardinality.ONE_TO_MANY;
    }

    if (!startIsUnique && endIsUnique) {
      return Cardinality.MANY_TO_ONE;
    }

    return Cardinality.ONE_TO_ONE;
  };

  const handleLinking = () => {
    if (hoveredTable.tableId === null) return;
    if (hoveredTable.fieldId === null) return;

    const { fields: startTableFields, name: startTableName } = tables.find(
      (t) => t.id === linkingLine.startTableId,
    );
    const startField = startTableFields.find(
      (f) => f.id === linkingLine.startFieldId,
    );
    const { fields: endTableFields, name: endTableName } = tables.find(
      (t) => t.id === hoveredTable.tableId,
    );
    const endField = endTableFields.find((f) => f.id === hoveredTable.fieldId);

    if (!areFieldsCompatible(database, startField.type, endField.type)) {
      Toast.info(t("cannot_connect"));
      return;
    }
    if (
      linkingLine.startTableId === hoveredTable.tableId &&
      linkingLine.startFieldId === hoveredTable.fieldId
    )
      return;

    const cardinality = getCardinality(startField, endField);

    const newRelationship = {
      ...linkingLine,
      cardinality,
      endTableId: hoveredTable.tableId,
      endFieldId: hoveredTable.fieldId,
      fields: [
        {
          startFieldId: linkingLine.startFieldId,
          endFieldId: hoveredTable.fieldId,
        },
      ],
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: `fk_${startTableName}_${startField.name}_${endTableName}`,
      color: defaultRelationshipColor,
      id: nanoid(),
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
            ...prev.pan,
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
    <div className="grow h-full relative">
      <div className="w-full h-full touch-none relative" id="canvas">
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
            onContextMenu={(e) => {
              if (rightClickPanned.current) {
                e.preventDefault();
                rightClickPanned.current = false;
              }
            }}
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
                tableCount={tableCountByArea.get(a.id) ?? 0}
                setResize={setAreaResize}
                setInitDimensions={setAreaInitDimensions}
                onPointerDown={handleElementPointerDown}
              />
            ))}
            {relationships.map((e) =>
              areaHiddenTableIds.has(e.startTableId) ||
              areaHiddenTableIds.has(e.endTableId) ? null : (
                <Relationship
                  key={e.id}
                  data={e}
                  startTable={tablesById.get(e.startTableId)}
                  endTable={tablesById.get(e.endTableId)}
                  startRelatedFieldKeys={relatedFieldKeysByTable.get(
                    e.startTableId,
                  )}
                  endRelatedFieldKeys={relatedFieldKeysByTable.get(
                    e.endTableId,
                  )}
                />
              ),
            )}
            {tables.map((table) =>
              areaHiddenTableIds.has(table.id) ? null : (
                <Table
                  key={table.id}
                  tableData={table}
                  isSelected={selectedTableIds.has(table.id)}
                  database={database}
                  relatedFieldKeys={relatedFieldKeysByTable.get(table.id)}
                  setHoveredTable={setHoveredTable}
                  handleGripField={handleGripField}
                  setLinkingLine={setLinkingLine}
                  onPointerDown={handleElementPointerDown}
                />
              ),
            )}
            {views.map((view) => (
              <View
                key={view.id}
                viewData={view}
                onPointerDown={handleElementPointerDown}
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
            <Slot name="svg-overlay" />
            {notes.map((n) => (
              <Note
                key={n.id}
                data={n}
                onPointerDown={handleElementPointerDown}
              />
            ))}
            {bulkSelectRect.show && (
              <rect
                {...getRectFromEndpoints(bulkSelectRect)}
                stroke="grey"
                fill="grey"
                fillOpacity={0.15}
                strokeDasharray={10}
              />
            )}
          </svg>
        </div>
        <TableEditSheet />
        <RelationshipEditSheet />
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
      <CanvasScrollbars viewBox={viewBox} contentBounds={contentBounds} />
    </div>
  );
}
