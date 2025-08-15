import { useContext, useState } from "react";
import {
  IconCaretdown,
  IconChevronRight,
  IconChevronLeft,
  IconChevronUp,
  IconChevronDown,
  IconSaveStroked,
  IconUndo,
  IconRedo,
  IconEdit,
  IconShareStroked,
} from "@douyinfe/semi-icons";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../assets/icon_dark_64.png";
import {
  Button,
  Divider,
  Dropdown,
  InputNumber,
  Tooltip,
  Spin,
  Toast,
  Popconfirm,
} from "@douyinfe/semi-ui";
import { toPng, toJpeg, toSvg } from "html-to-image";
import {
  jsonToMySQL,
  jsonToPostgreSQL,
  jsonToSQLite,
  jsonToMariaDB,
  jsonToSQLServer,
  jsonToOracle,
} from "../../utils/exportSQL/generic";
import {
  ObjectType,
  Action,
  Tab,
  State,
  MODAL,
  SIDESHEET,
  DB,
  IMPORT_FROM,
  Notation,
} from "../../data/constants";
import jsPDF from "jspdf";
import { useHotkeys } from "react-hotkeys-hook";
import { Validator } from "jsonschema";
import { areaSchema, noteSchema, tableSchema } from "../../data/schemas";
import { db } from "../../data/db";
import {
  useLayout,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useSelect,
  useSaveState,
  useTypes,
  useNotes,
  useAreas,
  useEnums,
  useFullscreen,
} from "../../hooks";
import { enterFullscreen, exitFullscreen } from "../../utils/fullscreen";
import { dataURItoBlob } from "../../utils/utils";
import { IconAddArea, IconAddNote, IconAddTable } from "../../icons";
import LayoutDropdown from "./LayoutDropdown";
import Sidesheet from "./SideSheet/Sidesheet";
import Modal from "./Modal/Modal";
import { useTranslation } from "react-i18next";
import { exportSQL } from "../../utils/exportSQL";
import { databases } from "../../data/databases";
import { jsonToMermaid } from "../../utils/exportAs/mermaid";
import { isRtl } from "../../i18n/utils/rtl";
import { jsonToDocumentation } from "../../utils/exportAs/documentation";
import { IdContext } from "../Workspace";
import { socials } from "../../data/socials";
import { toDBML } from "../../utils/exportAs/dbml";

export default function ControlPanel({
  diagramId,
  setDiagramId,
  title,
  setTitle,
  lastSaved,
}) {
  const [modal, setModal] = useState(MODAL.NONE);
  const [sidesheet, setSidesheet] = useState(SIDESHEET.NONE);
  const [showEditName, setShowEditName] = useState(false);
  const [importDb, setImportDb] = useState("");
  const [exportData, setExportData] = useState({
    data: null,
    filename: `${title}_${new Date().toISOString()}`,
    extension: "",
  });
  const [importFrom, setImportFrom] = useState(IMPORT_FROM.JSON);
  const { saveState, setSaveState } = useSaveState();
  const { layout, setLayout } = useLayout();
  const { settings, setSettings } = useSettings();
  const {
    relationships,
    tables,
    setTables,
    addTable,
    updateTable,
    deleteField,
    deleteTable,
    updateField,
    setRelationships,
    addRelationship,
    deleteRelationship,
    restoreFieldsToTable,
    updateRelationship,
    database,
  } = useDiagram();
  const { enums, setEnums, deleteEnum, addEnum, updateEnum } = useEnums();
  const { types, addType, deleteType, updateType, setTypes } = useTypes();
  const { notes, setNotes, updateNote, addNote, deleteNote } = useNotes();
  const { areas, setAreas, updateArea, addArea, deleteArea } = useAreas();
  const { undoStack, redoStack, setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const { transform, setTransform } = useTransform();
  const { t, i18n } = useTranslation();
  const { setGistId } = useContext(IdContext);
  const navigate = useNavigate();

  const invertLayout = (component) =>
    setLayout((prev) => ({ ...prev, [component]: !prev[component] }));

  const undo = () => {
    if (undoStack.length === 0) return;
    const a = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.filter((_, i) => i !== prev.length - 1));

    let actionForRedoStack = { ...a }; // Cloning the action for redo stack

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        const tableIdToDelete = a.data && typeof a.data.id !== 'undefined' ? a.data.id : (tables.length > 0 ? tables[tables.length - 1].id : null);
        if (tableIdToDelete !== null) {
          deleteTable(tableIdToDelete, false);
        }
      } else if (a.element === ObjectType.AREA) {
        const areaIdToDelete = a.data && typeof a.data.id !== 'undefined' ? a.data.id : (areas.length > 0 ? areas[areas.length - 1].id : null);
        if (areaIdToDelete !== null) {
          deleteArea(areaIdToDelete, false);
        }
      } else if (a.element === ObjectType.NOTE) {
        const noteIdToDelete = a.data && typeof a.data.id !== 'undefined' ? a.data.id : (notes.length > 0 ? notes[notes.length - 1].id : null);
        if (noteIdToDelete !== null) {
          deleteNote(noteIdToDelete, false);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        const { relationship: relToDelete, autoGeneratedFkFields, childTableIdWithGeneratedFks } = a.data;
        if (relToDelete && typeof relToDelete.id !== 'undefined') {
          deleteRelationship(relToDelete.id, false);
          if (autoGeneratedFkFields && autoGeneratedFkFields.length > 0 && childTableIdWithGeneratedFks !== undefined) {
            const childTable = tables.find(t => t.id === childTableIdWithGeneratedFks);
            if (childTable) {
              const newFields = childTable.fields.filter(
                cf => !autoGeneratedFkFields.some(afk => afk.id === cf.id && afk.name === cf.name)
              ).map((f,i) => ({...f, id:i}));
              updateTable(childTableIdWithGeneratedFks, { fields: newFields });
            }
          }
        }
      } else if (a.element === ObjectType.TYPE) {
        const typeIdToDelete = a.data && typeof a.data.id !== 'undefined' ? a.data.id : (types.length > 0 ? types.length - 1 : null);
         if (typeIdToDelete !== null) {
            deleteType(typeIdToDelete, false);
         }
      } else if (a.element === ObjectType.ENUM) {
        const enumIdToDelete = a.data && typeof a.data.id !== 'undefined' ? a.data.id : (enums.length > 0 ? enums.length - 1 : null);
        if (enumIdToDelete !== null) {
            deleteEnum(enumIdToDelete, false);
        }
      }
      actionForRedoStack = { ...a }; // For ADD, the redo is the same action.
      setRedoStack((prev) => [...prev, actionForRedoStack]);
    } else if (a.action === Action.MOVE) {
      let originalPositions = {};
      if (Array.isArray(a.id)) {
        originalPositions = a.id.reduce((acc, id) => {
          let elementArr;
          if (a.element === ObjectType.TABLE) elementArr = tables;
          else if (a.element === ObjectType.AREA) elementArr = areas;
          else if (a.element === ObjectType.NOTE) elementArr = notes;
          else return acc;

          const item = elementArr.find(el => el.id === id);
          if (item) {
            acc[id] = { x: item.x, y: item.y }; // Save current position for redo
          }
          return acc;
        }, {});
        // Undo the movement by restoring original positions
        a.originalPositions.forEach(op => {
          if (a.element === ObjectType.TABLE) updateTable(op.id, { x: op.x, y: op.y });
          else if (a.element === ObjectType.AREA) updateArea(op.id, { x: op.x, y: op.y });
          else if (a.element === ObjectType.NOTE) updateNote(op.id, { x: op.x, y: op.y });
        });
        actionForRedoStack = { ...a, newPositions: originalPositions }; // For redo, we need the positions to which it was moved
      } else {
        let currentItem;
        if (a.element === ObjectType.TABLE) currentItem = tables.find(t => t.id === a.id);
        else if (a.element === ObjectType.AREA) currentItem = areas.find(ar => ar.id === a.id);
        else if (a.element === ObjectType.NOTE) currentItem = notes.find(n => n.id === a.id);

        if (currentItem) {
          actionForRedoStack = { ...a, to: { x: currentItem.x, y: currentItem.y } }; // Save current position for redo
        }
        if (a.element === ObjectType.TABLE) updateTable(a.id, { x: a.from.x, y: a.from.y });
        else if (a.element === ObjectType.AREA) updateArea(a.id, { x: a.from.x, y: a.from.y });
        else if (a.element === ObjectType.NOTE) updateNote(a.id, { x: a.from.x, y: a.from.y });
      }
      setRedoStack((prev) => [...prev, actionForRedoStack]);
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        if (a.data && a.data.table) {
          addTable(a.data.table, false);
        }
        if (a.data && a.data.relationship && Array.isArray(a.data.relationship)) {
          a.data.relationship.forEach((x) => addRelationship(x, null, null, false));
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        // --- Undo the deletion of a relationship ---
        const {
          relationship: relationshipToRestore,
          childTableFieldsBeforeFkDeletion,
          childTableIdWithPotentiallyModifiedFields,
          allChildTablesFieldsBeforeFkDeletion,
          removedFkFields,
          childTableId
        } = a.data;

        if (relationshipToRestore) {
          // Handle NEW format for subtype relationships with multiple children
          if (allChildTablesFieldsBeforeFkDeletion && Object.keys(allChildTablesFieldsBeforeFkDeletion).length > 0) {
            // Restore fields for all child tables
            Object.entries(allChildTablesFieldsBeforeFkDeletion).forEach(([childTableId, fieldsSnapshot]) => {
              const numericChildTableId = parseInt(childTableId, 10);
              if (!isNaN(numericChildTableId)) {
                updateTable(numericChildTableId, { fields: JSON.parse(JSON.stringify(fieldsSnapshot)) });
              }
            });
          }
          // Handle legacy format (normal relationships and old subtype format)
          else if (childTableFieldsBeforeFkDeletion && typeof childTableIdWithPotentiallyModifiedFields !== 'undefined') {
            updateTable(childTableIdWithPotentiallyModifiedFields, { fields: JSON.parse(JSON.stringify(childTableFieldsBeforeFkDeletion)) });
          }
          if (removedFkFields && typeof childTableId !== 'undefined') {
            // Restore the FK fields to the child table
            if (typeof restoreFieldsToTable === 'function') {
              restoreFieldsToTable(childTableId, removedFkFields);
            }
          }
          addRelationship(relationshipToRestore, null, null, false);
        }
      } else if (a.element === ObjectType.NOTE) {
        if (a.data) {
          addNote(a.data, false);
        }
      } else if (a.element === ObjectType.AREA) {
        if (a.data) {
          addArea(a.data, false);
        }
      } else if (a.element === ObjectType.TYPE) {
        if (a.data) {
          addType({ id: a.id, ...a.data }, false);
        }
      } else if (a.element === ObjectType.ENUM) {
         if (a.data) {
            addEnum({ id: a.id, ...a.data }, false);
         }
      }
      actionForRedoStack = { ...a };
      setRedoStack((prev) => [...prev, actionForRedoStack]);
    } else if (a.action === Action.EDIT) {
      let redoStateProperties = {};

      if (a.element === ObjectType.AREA) {
        const currentArea = areas.find(ar => ar.id === a.aid);
        if (currentArea) redoStateProperties = { redo: { ...currentArea } };
        updateArea(a.aid, a.undo);
      } else if (a.element === ObjectType.NOTE) {
        const currentNote = notes.find(n => n.id === a.nid);
        if (currentNote) redoStateProperties = { redo: { ...currentNote } };
        updateNote(a.nid, a.undo);
      } else if (a.element === ObjectType.TABLE) {
        const currentTable = tables.find(t => t.id === a.tid);
        if (a.component === "field_update") {
          if (currentTable && a.data && a.data.previousFields) {
            actionForRedoStack.data = {
              ...a.data,
              fieldsBeforeUndoWasApplied: JSON.parse(JSON.stringify(currentTable.fields)),
            };
            setTables(prevTables =>
              prevTables.map(table => {
                if (table.id === a.tid) {
                  return { ...table, fields: a.data.previousFields };
                }
                return table;
              })
            );
          }
        } else if (a.component === "field") {
          let currentFieldStateForRedo = a.redo;
          if (currentTable) {
            const currentField = currentTable.fields.find(f => f.id === a.fid);
            if (currentField) currentFieldStateForRedo = { ...currentField };
          }
          redoStateProperties = { redo: currentFieldStateForRedo };
          if (typeof a.undo !== 'undefined') {
            updateField(a.tid, a.fid, a.undo, false);
          }
        } else if (a.component === "field_delete") {
          // a.data content:
          // - field: the field that was deleted.
          // - previousFields: the array of fields in the table BEFORE the deletion of the 'field'.
          // - deletedRelationships: array of relationships that were deleted.
          // - modifiedRelationshipsOriginalState: array of relationships (original state) that were modified (not deleted).
          // - childFieldsSnapshot: object { tableId: arrayOfFieldsBeforeFkDeletion }
          // - tid: the id of the table.
          if (a.data && a.data.previousFields && a.data.field) {
            actionForRedoStack.data = JSON.parse(JSON.stringify(a.data));
            // Restore the fields of the main table to their previous state.
            setTables(prevTables =>
              prevTables.map(table => {
                if (table.id === a.tid) {
                  return { ...table, fields: JSON.parse(JSON.stringify(a.data.previousFields)) };
                }
                return table;
              })
            );
            // Restore the fields in the child tables (if snapshot was saved and restoreFieldsToTable is available).
            if (a.data.childFieldsSnapshot && typeof restoreFieldsToTable === 'function') {
              Object.entries(a.data.childFieldsSnapshot).forEach(([childTableId, fieldsSnapshot]) => {
                const numericChildTableId = parseInt(childTableId, 10);
                if (!isNaN(numericChildTableId)) {
                  restoreFieldsToTable(numericChildTableId, JSON.parse(JSON.stringify(fieldsSnapshot)));
                }
              });
            }
            // Restore the relationships that were deleted.
            if (a.data.deletedRelationships && Array.isArray(a.data.deletedRelationships)) {
              a.data.deletedRelationships.forEach(rel => {
                addRelationship(JSON.parse(JSON.stringify(rel)), null, null, false);
              });
            }
            // Restore the relationships that were modified (their fieldId) to their original state.
            if (a.data.modifiedRelationshipsOriginalState && Array.isArray(a.data.modifiedRelationshipsOriginalState)) {
              a.data.modifiedRelationshipsOriginalState.forEach(originalRel => {
                updateRelationship(originalRel.id, JSON.parse(JSON.stringify(originalRel)), false);
              });
            }
            // Restore the subtype relationship that was modified.
            if (a.data.modifiedSubtypeRelationship) {
              updateRelationship(a.data.modifiedSubtypeRelationship.id, JSON.parse(JSON.stringify(a.data.modifiedSubtypeRelationship)), false);
            }
          }
        } else if (a.component === "field_add") {
          if (currentTable) {
            const fieldAdded = a.data && a.data.fieldIdAdded;
            const fieldsBeforeAdd = a.data && a.data.fieldsBeforeAdd;

            if (fieldsBeforeAdd) {
                 actionForRedoStack.data = {
                    ...a.data,
                    fieldThatWasAdded: currentTable.fields.find(f => f.id === fieldAdded)
                 };
                 updateTable(a.tid, { fields: JSON.parse(JSON.stringify(fieldsBeforeAdd)) });
            } else if (currentTable.fields.length > 0) {
                 actionForRedoStack.data = {
                    ...a.data,
                    fieldToAdd: JSON.parse(JSON.stringify(currentTable.fields[currentTable.fields.length - 1]))
                 };
                 updateTable(a.tid, { fields: currentTable.fields.slice(0, -1).map((f,i)=> ({...f, id:i})) });
            }
          }
        } else if (a.component === "index_add") {
          if (currentTable && currentTable.indices.length > 0) {
             actionForRedoStack.data = { ...a.data, indexToAdd: JSON.parse(JSON.stringify(currentTable.indices[currentTable.indices.length - 1])) };
             updateTable(a.tid, { indices: currentTable.indices.slice(0, -1).map((idx,i)=> ({...idx, id:i})) });
          }
        } else if (a.component === "index") {
          if (currentTable) {
            const currentIndex = currentTable.indices.find(idx => idx.id === a.iid);
            if (currentIndex) redoStateProperties = { redo: { ...currentIndex } };
            updateTable(a.tid, { indices: currentTable.indices.map(idx => idx.id === a.iid ? {...idx, ...a.undo} : idx ) });
          }
        } else if (a.component === "index_delete") {
          if (a.data && currentTable) {
            actionForRedoStack.data = { ...a.data, indexIdToDelete: a.data.id, tid: a.tid };
            const newIndices = [...currentTable.indices];
            newIndices.splice(a.data.id, 0, JSON.parse(JSON.stringify(a.data)));
            updateTable(a.tid, { indices: newIndices.map((idx,i)=> ({...idx, id:i})) });
          }
        } else if (a.component === "self") {
          if (currentTable) redoStateProperties = { redo: { ...currentTable, ...a.redo } };
          updateTable(a.tid, a.undo);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        const currentRel = relationships.find(r => r.id === a.rid);
        if (currentRel) redoStateProperties = { redo: { ...currentRel, ...a.redo } };
        // Handle FK field restoration for subtype relationships
        if (a.undo && a.undo.removedFkFields && a.undo.childTableId !== undefined) {
          // Restore the FK fields to the child table
          if (typeof restoreFieldsToTable === 'function') {
            restoreFieldsToTable(a.undo.childTableId, a.undo.removedFkFields);
          }
        }
        updateRelationship(a.rid, a.undo);
      } else if (a.element === ObjectType.TYPE) {
        const currentType = types.find(ty => ty.id === a.tid);
        if (a.component === "field_add") {
          if (currentType) {
            actionForRedoStack.data = { ...a.data, fieldToAdd: JSON.parse(JSON.stringify(currentType.fields[currentType.fields.length - 1])) };
            updateType(a.tid, {
              fields: currentType.fields.slice(0, -1).map((f,i)=> ({...f, id:i})),
            });
          }
        } else if (a.component === "field") {
          if (currentType) {
            const currentField = currentType.fields.find(f => f.id === a.fid);
            if (currentField) redoStateProperties = { redo: { ...currentField } };
            updateType(a.tid, {
              fields: currentType.fields.map(f =>
                f.id === a.fid ? { ...f, ...a.undo } : f,
              ),
            });
          }
        } else if (a.component === "field_delete") {
          if (a.data && currentType) {
            actionForRedoStack.data = { ...a.data, fieldIdToDelete: a.data.id, typeId: a.tid };
            const newFields = [...currentType.fields];
            // Find the index of the field to delete
            const originalIndex = currentType.fields.findIndex(f => f.id === a.data.id);
            newFields.splice(originalIndex !== -1 ? originalIndex : newFields.length, 0, JSON.parse(JSON.stringify(a.data)));
            updateType(a.tid, { fields: newFields.map((f,i)=> ({...f, id:i})) });
          }
        } else if (a.component === "self") {
          if (currentType) redoStateProperties = { redo: { ...currentType, ...a.redo } };
          updateType(a.tid, a.undo);
          if (a.updatedFields && a.undo.name) {
            a.updatedFields.forEach((x) =>
              updateField(x.tid, x.fid, { type: x.originalType }),
            );
          }
        }
      } else if (a.element === ObjectType.ENUM) {
        const currentEnum = enums.find(en => en.id === a.id);
        if (currentEnum) redoStateProperties = { redo: { ...currentEnum, ...a.redo } };
        updateEnum(a.id, a.undo);
        if (a.updatedFields && a.undo.name) {
           a.updatedFields.forEach((x) =>
              updateField(x.tid, x.fid, { type: x.originalType }),
            );
        }
      }
      if (Object.keys(redoStateProperties).length > 0) {
        actionForRedoStack = { ...actionForRedoStack, ...redoStateProperties };
      }
      setRedoStack((prev) => [...prev, actionForRedoStack]);
    } else if (a.action === Action.PAN) {
      actionForRedoStack = { ...a, redo: { ...transform.pan } };
      setTransform((prevTransform) => ({
        ...prevTransform,
        pan: a.undo,
      }));
      setRedoStack((prev) => [...prev, actionForRedoStack]);
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const a = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.filter((_, i) => i !== prev.length - 1));

    let actionForUndoStack = { ...a };

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        addTable(a.data ? a.data.table || a.data : null, false);
      } else if (a.element === ObjectType.AREA) {
        addArea(a.data || null, false);
      } else if (a.element === ObjectType.NOTE) {
        addNote(a.data || null, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        const { relationship, autoGeneratedFkFields, childTableIdWithGeneratedFks } = a.data;
        addRelationship(relationship, autoGeneratedFkFields, childTableIdWithGeneratedFks, false);
      } else if (a.element === ObjectType.TYPE) {
        addType(a.data ? {id: a.id, ...a.data} : null, false);
      } else if (a.element === ObjectType.ENUM) {
        addEnum(a.data ? {id: a.id, ...a.data} : null, false);
      }
      setUndoStack((prev) => [...prev, actionForUndoStack]);
    } else if (a.action === Action.MOVE) {
      if (!Array.isArray(a.id)) {
        let itemBeforeMove;
        if (a.element === ObjectType.TABLE) itemBeforeMove = tables.find(t => t.id === a.id);
        else if (a.element === ObjectType.AREA) itemBeforeMove = areas.find(ar => ar.id === a.id);
        else if (a.element === ObjectType.NOTE) itemBeforeMove = notes.find(n => n.id === a.id);

        if (itemBeforeMove) {
          actionForUndoStack.from = { x: itemBeforeMove.x, y: itemBeforeMove.y }; // Current pos becomes 'from' for next undo
        }
        // Apply the redo move (a.to contains the target position)
        if (a.element === ObjectType.TABLE) updateTable(a.id, { x: a.to.x, y: a.to.y });
        else if (a.element === ObjectType.AREA) updateArea(a.id, { x: a.to.x, y: a.to.y });
        else if (a.element === ObjectType.NOTE) updateNote(a.id, { x: a.to.x, y: a.to.y });
      } else {
        const currentPositions = a.id.reduce((acc, id) => {
          let elementArr;
          if (a.element === ObjectType.TABLE) elementArr = tables;
          else if (a.element === ObjectType.AREA) elementArr = areas;
          else if (a.element === ObjectType.NOTE) elementArr = notes;
          else return acc;
          const item = elementArr.find(el => el.id === id);
          if (item) acc[id] = { x: item.x, y: item.y };
          return acc;
        }, {});
        actionForUndoStack.originalPositions = Object.values(currentPositions).map((pos, index) => ({ id: a.id[index], ...pos }));

        a.newPositions.forEach(np => { // a.newPositions has target positions for redo
           if (a.element === ObjectType.TABLE) updateTable(np.id, { x: np.x, y: np.y });
           else if (a.element === ObjectType.AREA) updateArea(np.id, { x: np.x, y: np.y });
           else if (a.element === ObjectType.NOTE) updateNote(np.id, { x: np.x, y: np.y });
        });
      }
      setUndoStack((prev) => [...prev, actionForUndoStack]);
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        // a.data.table should be the table object that was deleted
        if (a.data && a.data.table) deleteTable(a.data.table.id, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        // a.data.relationship is the relationship object that was deleted
        if (a.data && a.data.relationship) deleteRelationship(a.data.relationship.id, false);
      } else if (a.element === ObjectType.NOTE) {
        if (a.data) deleteNote(a.data.id, false);
      } else if (a.element === ObjectType.AREA) {
        if (a.data) deleteArea(a.data.id, false);
      } else if (a.element === ObjectType.TYPE) {
        if (a.data) deleteType(a.id, false);
      } else if (a.element === ObjectType.ENUM) {
        if (a.data) deleteEnum(a.id, false);
      }
      setUndoStack((prev) => [...prev, actionForUndoStack]);
    } else if (a.action === Action.EDIT) {
      let undoStateProperties = {};

      if (a.element === ObjectType.AREA) {
        const areaBeforeRedo = areas.find(ar => ar.id === a.aid);
        if (areaBeforeRedo) undoStateProperties = { undo: { ...areaBeforeRedo } };
        else if (a.undo) undoStateProperties = { undo: a.undo };
        updateArea(a.aid, a.redo);
      } else if (a.element === ObjectType.NOTE) {
        const noteBeforeRedo = notes.find(n => n.id === a.nid);
        if (noteBeforeRedo) undoStateProperties = { undo: { ...noteBeforeRedo } };
        else if (a.undo) undoStateProperties = { undo: a.undo };
        updateNote(a.nid, a.redo);
      } else if (a.element === ObjectType.TABLE) {
        const tableBeforeRedo = tables.find(t => t.id === a.tid);
        if (a.component === "field_update") {
          if (tableBeforeRedo && a.data && typeof a.data.updatedFieldId !== 'undefined' && a.data.appliedValues) {
            actionForUndoStack.data = {
              ...a.data,
              previousFields: JSON.parse(JSON.stringify(tableBeforeRedo.fields)),
            };
            updateField(a.tid, a.data.updatedFieldId, a.data.appliedValues, false);
          }
        } else if (a.component === "field") {
          let previousFieldStateForUndo = a.undo;
          if (tableBeforeRedo) {
            const fieldBeforeRedo = tableBeforeRedo.fields.find(f => f.id === a.fid);
            if (fieldBeforeRedo) previousFieldStateForUndo = { ...fieldBeforeRedo };
          }
          undoStateProperties = { undo: previousFieldStateForUndo };
          if (typeof a.redo !== 'undefined') {
            updateField(a.tid, a.fid, a.redo, false);
          }
        } else if (a.component === "field_delete") {
          // Redoing a field_delete means calling deleteField again.
          // a.data should contain { field, deletedRelationships, modifiedRelationshipsOriginalState, previousFields, childFieldsSnapshot }
          // The 'previousFields' in a.data is the state *before* the original deletion, which is what the *next* undo needs.
          if (a.data && a.data.field && typeof a.data.tid !== 'undefined') {
            actionForUndoStack.data = JSON.parse(JSON.stringify(a.data));

            deleteField(a.data.field, a.data.tid, false);
          }
        } else if (a.component === "field_add") {
          if (tableBeforeRedo && a.data && a.data.fieldThatWasAdded) {
            actionForUndoStack.data = {
              ...a.data,
              fieldsBeforeAdd: JSON.parse(JSON.stringify(tableBeforeRedo.fields))
            };
            const newFields = [...tableBeforeRedo.fields, JSON.parse(JSON.stringify(a.data.fieldThatWasAdded))];
            updateTable(a.tid, { fields: newFields.map((f, i) => ({ ...f, id: i })) }, false);
          }
        } else if (a.component === "index_add") {
          if (tableBeforeRedo && a.data && a.data.indexToAdd) {
            actionForUndoStack.data = {
                ...a.data,
                indicesBeforeAdd: JSON.parse(JSON.stringify(tableBeforeRedo.indices || []))
            };
            const newIndices = [...(tableBeforeRedo.indices || []), JSON.parse(JSON.stringify(a.data.indexToAdd))];
            updateTable(a.tid, { indices: newIndices.map((idx, i) => ({ ...idx, id: i })) }, false);
          }
        } else if (a.component === "index") {
          if (tableBeforeRedo) {
            const indexBeforeRedo = tableBeforeRedo.indices.find(idx => idx.id === a.iid);
            if (indexBeforeRedo) undoStateProperties = { undo: { ...indexBeforeRedo } };
            else if (a.undo) undoStateProperties = { undo: a.undo };
            updateTable(a.tid, { indices: tableBeforeRedo.indices.map(idx => idx.id === a.iid ? {...idx, ...a.redo} : idx ) }, false);
          }
        } else if (a.component === "index_delete") {
          if (tableBeforeRedo && a.data && typeof a.data.id !== 'undefined') {
             actionForUndoStack.data = JSON.parse(JSON.stringify(a.data));
             const newIndices = tableBeforeRedo.indices.filter(idx => idx.id !== a.data.id).map((idx, i) => ({...idx, id: i}));
             updateTable(a.tid, { indices: newIndices }, false);
          }
        } else if (a.component === "self") {
          if (tableBeforeRedo) undoStateProperties = { undo: { ...tableBeforeRedo, ...a.undo } };
          updateTable(a.tid, a.redo, false);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        const relBeforeRedo = relationships.find(r => r.id === a.rid);
        if (relBeforeRedo) undoStateProperties = { undo: { ...relBeforeRedo } };
        else if (a.undo) undoStateProperties = { undo: a.undo };
        // Handle FK field removal for subtype relationships on redo
        if (a.redo && a.redo.removedFkFields && a.redo.childTableId !== undefined) {
          // Remove the FK fields from the child table
          const childTable = tables.find(t => t.id === a.redo.childTableId);
          if (childTable) {
            const fieldsToRemoveIds = a.redo.removedFkFields.map(f => f.id);
            const updatedFields = childTable.fields.filter(f => !fieldsToRemoveIds.includes(f.id))
              .map((f, i) => ({ ...f, id: i }));
            updateTable(a.redo.childTableId, { fields: updatedFields }, false);
          }
        }
        updateRelationship(a.rid, a.redo, false);
      } else if (a.element === ObjectType.TYPE) {
        const typeBeforeRedo = types.find(ty => ty.id === a.tid);
        if (a.component === "field_add") {
          // a.data.fieldToAdd was prepared by undo
          if (typeBeforeRedo && a.data && a.data.fieldToAdd) {
            actionForUndoStack.data = {
                ...a.data,
                fieldsBeforeAdd: JSON.parse(JSON.stringify(typeBeforeRedo.fields || []))
            };
            const newFields = [...(typeBeforeRedo.fields || []), JSON.parse(JSON.stringify(a.data.fieldToAdd))];
            updateType(a.tid, { fields: newFields.map((f, i) => ({ ...f, id: i })) }, false);
          }
        } else if (a.component === "field") {
          if (typeBeforeRedo) {
            const fieldBeforeRedo = typeBeforeRedo.fields.find(f => f.id === a.fid);
            if (fieldBeforeRedo) undoStateProperties = { undo: { ...fieldBeforeRedo } };
            else if (a.undo) undoStateProperties = { undo: a.undo };
            // Apply redo
            updateType(a.tid, {
              fields: typeBeforeRedo.fields.map(f =>
                f.id === a.fid ? { ...f, ...a.redo } : f,
              ),
            }, false);
          }
        } else if (a.component === "field_delete") {
          // Redoing a field_delete for a type field
          // a.data is the field object that was deleted.
          if (typeBeforeRedo && a.data && typeof a.data.id !== 'undefined') {
            actionForUndoStack.data = JSON.parse(JSON.stringify(a.data)); // Save deleted field for next undo
            const newFields = typeBeforeRedo.fields.filter(f => f.id !== a.data.id).map((f,i) => ({...f, id:i}));
            updateType(a.tid, { fields: newFields }, false);
          }
        } else if (a.component === "self") {
          if (typeBeforeRedo) undoStateProperties = { undo: { ...typeBeforeRedo, ...a.undo } };
          updateType(a.tid, a.redo, false);
        }
      } else if (a.element === ObjectType.ENUM) {
        const enumBeforeRedo = enums.find(en => en.id === a.id);
        if (enumBeforeRedo) undoStateProperties = { undo: { ...enumBeforeRedo } };
        else if (a.undo) undoStateProperties = { undo: a.undo };
        updateEnum(a.id, a.redo, false);
        // Similar to TYPE self, the updatedFields logic might be for undo
      }

      // Merge general undo properties if they were set and not handled by direct data manipulation
      const componentHandledDataDirectly =
        (a.element === ObjectType.TABLE && (a.component === "field_update" || a.component === "field_delete" || a.component === "field_add" || a.component === "index_add" || a.component === "index_delete")) ||
        (a.element === ObjectType.TYPE && (a.component === "field_add" || a.component === "field_delete"));

      if (Object.keys(undoStateProperties).length > 0 && !componentHandledDataDirectly) {
        actionForUndoStack = { ...actionForUndoStack, ...undoStateProperties };
      }
      setUndoStack((prev) => [...prev, actionForUndoStack]);
    } else if (a.action === Action.PAN) {
      actionForUndoStack = { ...a, undo: { ...transform.pan } };
      setTransform((prevTransform) => ({
        ...prevTransform,
        pan: a.redo,
      }));
      setUndoStack((prev) => [...prev, actionForUndoStack]);
    }
  };

  const fileImport = () => setModal(MODAL.IMPORT);
  const viewGrid = () =>
    setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  const zoomIn = () =>
    setTransform((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }));
  const zoomOut = () =>
    setTransform((prev) => ({ ...prev, zoom: prev.zoom / 1.2 }));
  const viewStrictMode = () => {
    setSettings((prev) => ({ ...prev, strictMode: !prev.strictMode }));
  };
  const viewFieldSummary = () => {
    setSettings((prev) => ({
      ...prev,
      showFieldSummary: !prev.showFieldSummary,
    }));
  };
  const copyAsImage = () => {
    toPng(document.getElementById("canvas")).then(function (dataUrl) {
      const blob = dataURItoBlob(dataUrl);
      navigator.clipboard
        .write([new ClipboardItem({ "image/png": blob })])
        .then(() => {
          Toast.success(t("copied_to_clipboard"));
        })
        .catch(() => {
          Toast.error(t("oops_smth_went_wrong"));
        });
    });
  };
  const resetView = () =>
    setTransform((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
  const fitWindow = () => {
    const diagram = document.getElementById("diagram").getBoundingClientRect();
    const canvas = document.getElementById("canvas").getBoundingClientRect();

    const scaleX = canvas.width / diagram.width;
    const scaleY = canvas.height / diagram.height;
    const scale = Math.min(scaleX, scaleY);
    const translateX = canvas.left;
    const translateY = canvas.top;

    setTransform((prev) => ({
      ...prev,
      zoom: scale - 0.01,
      pan: { x: translateX, y: translateY },
    }));
  };
  const edit = () => {
    if (selectedElement.element === ObjectType.TABLE) {
      if (!layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
        }));
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
          currentTab: Tab.TABLES,
        }));
        if (selectedElement.currentTab !== Tab.TABLES) return;
        document
          .getElementById(`scroll_table_${selectedElement.id}`)
          .scrollIntoView({ behavior: "smooth" });
      }
    } else if (selectedElement.element === ObjectType.AREA) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          currentTab: Tab.AREAS,
        }));
        if (selectedElement.currentTab !== Tab.AREAS) return;
        document
          .getElementById(`scroll_area_${selectedElement.id}`)
          .scrollIntoView({ behavior: "smooth" });
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
          editFromToolbar: true,
        }));
      }
    } else if (selectedElement.element === ObjectType.NOTE) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          currentTab: Tab.NOTES,
          open: false,
        }));
        if (selectedElement.currentTab !== Tab.NOTES) return;
        document
          .getElementById(`scroll_note_${selectedElement.id}`)
          .scrollIntoView({ behavior: "smooth" });
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
          editFromToolbar: true,
        }));
      }
    }
  };
  const del = () => {
    switch (selectedElement.element) {
      case ObjectType.TABLE:
        deleteTable(selectedElement.id);
        break;
      case ObjectType.NOTE:
        deleteNote(selectedElement.id);
        break;
      case ObjectType.AREA:
        deleteArea(selectedElement.id);
        break;
      default:
        break;
    }
  };
  const duplicate = () => {
    switch (selectedElement.element) {
      case ObjectType.TABLE:
        addTable({
          ...tables[selectedElement.id],
          x: tables[selectedElement.id].x + 20,
          y: tables[selectedElement.id].y + 20,
          id: tables.length,
        });
        break;
      case ObjectType.NOTE:
        addNote({
          ...notes[selectedElement.id],
          x: notes[selectedElement.id].x + 20,
          y: notes[selectedElement.id].y + 20,
          id: notes.length,
        });
        break;
      case ObjectType.AREA:
        addArea({
          ...areas[selectedElement.id],
          x: areas[selectedElement.id].x + 20,
          y: areas[selectedElement.id].y + 20,
          id: areas.length,
        });
        break;
      default:
        break;
    }
  };
  const copy = () => {
    switch (selectedElement.element) {
      case ObjectType.TABLE:
        navigator.clipboard
          .writeText(JSON.stringify({ ...tables[selectedElement.id] }))
          .catch(() => Toast.error(t("oops_smth_went_wrong")));
        break;
      case ObjectType.NOTE:
        navigator.clipboard
          .writeText(JSON.stringify({ ...notes[selectedElement.id] }))
          .catch(() => Toast.error(t("oops_smth_went_wrong")));
        break;
      case ObjectType.AREA:
        navigator.clipboard
          .writeText(JSON.stringify({ ...areas[selectedElement.id] }))
          .catch(() => Toast.error(t("oops_smth_went_wrong")));
        break;
      default:
        break;
    }
  };
  const paste = () => {
    navigator.clipboard.readText().then((text) => {
      let obj = null;
      try {
        obj = JSON.parse(text);
      } catch (error) {
        return;
      }
      const v = new Validator();
      if (v.validate(obj, tableSchema).valid) {
        addTable({
          ...obj,
          x: obj.x + 20,
          y: obj.y + 20,
          id: tables.length,
        });
      } else if (v.validate(obj, areaSchema).valid) {
        addArea({
          ...obj,
          x: obj.x + 20,
          y: obj.y + 20,
          id: areas.length,
        });
      } else if (v.validate(obj, noteSchema)) {
        addNote({
          ...obj,
          x: obj.x + 20,
          y: obj.y + 20,
          id: notes.length,
        });
      }
    });
  };
  const cut = () => {
    copy();
    del();
  };
  const save = () => setSaveState(State.SAVING);
  const open = () => setModal(MODAL.OPEN);
  const saveDiagramAs = () => setModal(MODAL.SAVEAS);
  const fullscreen = useFullscreen();

  const menu = {
    file: {
      new: {
        function: () => setModal(MODAL.NEW),
      },
      new_window: {
        function: () => {
          const newWindow = window.open("/editor", "_blank");
          newWindow.name = window.name;
        },
      },
      open: {
        function: open,
        shortcut: "Ctrl+O",
      },
      save: {
        function: save,
        shortcut: "Ctrl+S",
      },
      save_as: {
        function: saveDiagramAs,
        shortcut: "Ctrl+Shift+S",
      },
      save_as_template: {
        function: () => {
          db.templates
            .add({
              title: title,
              tables: tables,
              database: database,
              relationships: relationships,
              notes: notes,
              subjectAreas: areas,
              custom: 1,
              ...(databases[database].hasEnums && { enums: enums }),
              ...(databases[database].hasTypes && { types: types }),
            })
            .then(() => {
              Toast.success(t("template_saved"));
            });
        },
      },
      rename: {
        function: () => {
          setModal(MODAL.RENAME);
        },
      },
      delete_diagram: {
        warning: {
          title: t("delete_diagram"),
          message: t("are_you_sure_delete_diagram"),
        },
        function: async () => {
          await db.diagrams
            .delete(diagramId)
            .then(() => {
              setDiagramId(0);
              setTitle("Untitled diagram");
              setTables([]);
              setRelationships([]);
              setAreas([]);
              setNotes([]);
              setTypes([]);
              setEnums([]);
              setUndoStack([]);
              setRedoStack([]);
              setGistId("");
            })
            .catch(() => Toast.error(t("oops_smth_went_wrong")));
        },
      },
      import_from: {
        children: [
          {
            JSON: fileImport,
          },
          {
            DBML: () => {
              setModal(MODAL.IMPORT);
              setImportFrom(IMPORT_FROM.DBML);
            },
          },
        ],
      },
      import_from_source: {
        ...(database === DB.GENERIC && {
          children: [
            {
              MySQL: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MYSQL);
              },
            },
            {
              PostgreSQL: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.POSTGRES);
              },
            },
            {
              SQLite: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.SQLITE);
              },
            },
            {
              MariaDB: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MARIADB);
              },
            },
            {
              MSSQL: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MSSQL);
              },
            },
            {
              Oracle: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.ORACLE);
              },
            },
          ],
        }),
        function: () => {
          if (database === DB.GENERIC) return;

          setModal(MODAL.IMPORT_SRC);
        },
      },
      export_source: {
        ...(database === DB.GENERIC && {
          children: [
            {
              MySQL: () => {
                setModal(MODAL.CODE);
                const src = jsonToMySQL({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              PostgreSQL: () => {
                setModal(MODAL.CODE);
                const src = jsonToPostgreSQL({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              SQLite: () => {
                setModal(MODAL.CODE);
                const src = jsonToSQLite({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              MariaDB: () => {
                setModal(MODAL.CODE);
                const src = jsonToMariaDB({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              MSSQL: () => {
                setModal(MODAL.CODE);
                const src = jsonToSQLServer({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              Oracle: () => {
                setModal(MODAL.CODE);
                const src = jsonToOracle({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              }
            },
          ],
        }),
        function: () => {
          if (database === DB.GENERIC) return;
          setModal(MODAL.CODE);
          const src = exportSQL({
            tables: tables,
            references: relationships,
            types: types,
            database: database,
            enums: enums,
          });
          setExportData((prev) => ({
            ...prev,
            data: src,
            extension: "sql",
          }));
        },
      },
      export_as: {
        children: [
          {
            PNG: () => {
              toPng(document.getElementById("canvas")).then(function (dataUrl) {
                setExportData((prev) => ({
                  ...prev,
                  data: dataUrl,
                  extension: "png",
                }));
              });
              setModal(MODAL.IMG);
            },
          },
          {
            JPEG: () => {
              toJpeg(document.getElementById("canvas"), { quality: 0.95 }).then(
                function (dataUrl) {
                  setExportData((prev) => ({
                    ...prev,
                    data: dataUrl,
                    extension: "jpeg",
                  }));
                },
              );
              setModal(MODAL.IMG);
            },
          },
          {
            SVG: () => {
              const filter = (node) => node.tagName !== "i";
              toSvg(document.getElementById("canvas"), { filter: filter }).then(
                function (dataUrl) {
                  setExportData((prev) => ({
                    ...prev,
                    data: dataUrl,
                    extension: "svg",
                  }));
                },
              );
              setModal(MODAL.IMG);
            },
          },
          {
            JSON: () => {
              setModal(MODAL.CODE);
              const result = JSON.stringify(
                {
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                  database: database,
                  ...(databases[database].hasTypes && { types: types }),
                  ...(databases[database].hasEnums && { enums: enums }),
                  title: title,
                },
                null,
                2,
              );
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "json",
              }));
            },
          },
          {
            DBML: () => {
              setModal(MODAL.CODE);
              const result = toDBML({
                tables,
                relationships,
                enums,
              });
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "dbml",
              }));
            },
          },
          {
            PDF: () => {
              const canvas = document.getElementById("canvas");
              toJpeg(canvas).then(function (dataUrl) {
                const doc = new jsPDF("l", "px", [
                  canvas.offsetWidth,
                  canvas.offsetHeight,
                ]);
                doc.addImage(
                  dataUrl,
                  "jpeg",
                  0,
                  0,
                  canvas.offsetWidth,
                  canvas.offsetHeight,
                );
                doc.save(`${exportData.filename}.pdf`);
              });
            },
          },
          {
            MERMAID: () => {
              setModal(MODAL.CODE);
              const result = jsonToMermaid({
                tables: tables,
                relationships: relationships,
                notes: notes,
                subjectAreas: areas,
                database: database,
                title: title,
              });
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "md",
              }));
            },
          },
          {
            readme: () => {
              setModal(MODAL.CODE);
              const result = jsonToDocumentation({
                tables: tables,
                relationships: relationships,
                notes: notes,
                subjectAreas: areas,
                database: database,
                title: title,
                ...(databases[database].hasTypes && { types: types }),
                ...(databases[database].hasEnums && { enums: enums }),
              });
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "md",
              }));
            },
          },
        ],
        function: () => {},
      },
      exit: {
        function: () => {
          save();
          if (saveState === State.SAVED) navigate("/");
        },
      },
    },
    edit: {
      undo: {
        function: undo,
        shortcut: "Ctrl+Z",
      },
      redo: {
        function: redo,
        shortcut: "Ctrl+Y",
      },
      clear: {
        warning: {
          title: t("clear"),
          message: t("are_you_sure_clear"),
        },
        function: () => {
          setTables([]);
          setRelationships([]);
          setAreas([]);
          setNotes([]);
          setEnums([]);
          setTypes([]);
          setUndoStack([]);
          setRedoStack([]);
        },
      },
      edit: {
        function: edit,
        shortcut: "Ctrl+E",
      },
      cut: {
        function: cut,
        shortcut: "Ctrl+X",
      },
      copy: {
        function: copy,
        shortcut: "Ctrl+C",
      },
      paste: {
        function: paste,
        shortcut: "Ctrl+V",
      },
      duplicate: {
        function: duplicate,
        shortcut: "Ctrl+D",
      },
      delete: {
        function: del,
        shortcut: "Del / Ctrl + Backspace",
      },
      copy_as_image: {
        function: copyAsImage,
        shortcut: "Ctrl+Alt+C",
      },
    },
    view: {
      header: {
        state: layout.header ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setLayout((prev) => ({ ...prev, header: !prev.header })),
      },
      sidebar: {
        state: layout.sidebar ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setLayout((prev) => ({ ...prev, sidebar: !prev.sidebar })),
      },
      issues: {
        state: layout.issues ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setLayout((prev) => ({ ...prev, issues: !prev.issues })),
      },
      strict_mode: {
        state: settings.strictMode ? (
          <i className="bi bi-toggle-off" />
        ) : (
          <i className="bi bi-toggle-on" />
        ),
        function: viewStrictMode,
        shortcut: "Ctrl+Shift+M",
      },
      presentation_mode: {
        function: () => {
          setLayout((prev) => ({
            ...prev,
            header: false,
            sidebar: false,
            toolbar: false,
          }));
          enterFullscreen();
        },
      },
      field_details: {
        state: settings.showFieldSummary ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: viewFieldSummary,
        shortcut: "Ctrl+Shift+F",
      },
      reset_view: {
        function: resetView,
        shortcut: "Ctrl+R",
      },
      show_grid: {
        state: settings.showGrid ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: viewGrid,
        shortcut: "Ctrl+Shift+G",
      },
      show_cardinality: {
        state: settings.showCardinality ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showCardinality: !prev.showCardinality,
          })),
      },
      notation: {
        children: [
          {
            default_notation: () => {
              setSettings((prev) => ({ ...prev, notation: Notation.DEFAULT }));
            },
          },
          {
            crows_foot_notation: () => {
              setSettings((prev) => ({ ...prev, notation: Notation.CROWS_FOOT }));
            },
          },
          {
            idef1x_notation: () => {
              setSettings((prev) => ({ ...prev, notation: Notation.IDEF1X }));
            },
          },
        ],
        function: () => {},
      },
      show_relationship_labels: {
        state: settings.showRelationshipLabels ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showRelationshipLabels: !prev.showRelationshipLabels,
          })),
      },
      show_debug_coordinates: {
        state: settings.showDebugCoordinates ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showDebugCoordinates: !prev.showDebugCoordinates,
          })),
      },
      theme: {
        children: [
          {
            light: () => {
              const body = document.body;
              if (body.hasAttribute("theme-mode")) {
                body.setAttribute("theme-mode", "light");
              }
              localStorage.setItem("theme", "light");
              setSettings((prev) => ({ ...prev, mode: "light" }));
            },
          },
          {
            dark: () => {
              const body = document.body;
              if (body.hasAttribute("theme-mode")) {
                body.setAttribute("theme-mode", "dark");
              }
              localStorage.setItem("theme", "dark");
              setSettings((prev) => ({ ...prev, mode: "dark" }));
            },
          },
        ],
        function: () => {},
      },
      zoom_in: {
        function: zoomIn,
        shortcut: "Ctrl+(Up/Wheel)",
      },
      zoom_out: {
        function: zoomOut,
        shortcut: "Ctrl+(Down/Wheel)",
      },
      fullscreen: {
        state: fullscreen ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: fullscreen ? exitFullscreen : enterFullscreen,
      },
    },
    settings: {
      show_timeline: {
        function: () => setSidesheet(SIDESHEET.TIMELINE),
      },
      autosave: {
        state: settings.autosave ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({ ...prev, autosave: !prev.autosave })),
      },
      panning: {
        state: settings.panning ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({ ...prev, panning: !prev.panning })),
      },
      table_width: {
        function: () => setModal(MODAL.TABLE_WIDTH),
      },
      language: {
        function: () => setModal(MODAL.LANGUAGE),
      },
      flush_storage: {
        warning: {
          title: t("flush_storage"),
          message: t("are_you_sure_flush_storage"),
        },
        function: async () => {
          db.delete()
            .then(() => {
              Toast.success(t("storage_flushed"));
              window.location.reload(false);
            })
            .catch(() => {
              Toast.error(t("oops_smth_went_wrong"));
            });
        },
      },
    },
    help: {
      docs: {
        function: () => window.open(`${socials.docs}`, "_blank"),
        shortcut: "Ctrl+H",
      },
      shortcuts: {
        function: () => window.open(`${socials.docs}/shortcuts`, "_blank"),
      },
      ask_on_discord: {
        function: () => window.open(socials.discord, "_blank"),
      },
      report_bug: {
        function: () => window.open("/bug-report", "_blank"),
      },
      feedback: {
        function: () => window.open("/survey", "_blank"),
      },
    },
  };

  useHotkeys("ctrl+i, meta+i", fileImport, { preventDefault: true });
  useHotkeys("ctrl+z, meta+z", undo, { preventDefault: true });
  useHotkeys("ctrl+y, meta+y", redo, { preventDefault: true });
  useHotkeys("ctrl+s, meta+s", save, { preventDefault: true });
  useHotkeys("ctrl+o, meta+o", open, { preventDefault: true });
  useHotkeys("ctrl+e, meta+e", edit, { preventDefault: true });
  useHotkeys("ctrl+d, meta+d", duplicate, { preventDefault: true });
  useHotkeys("ctrl+c, meta+c", copy, { preventDefault: true });
  useHotkeys("ctrl+v, meta+v", paste, { preventDefault: true });
  useHotkeys("ctrl+x, meta+x", cut, { preventDefault: true });
  useHotkeys("delete, ctrl+backspace, meta+backspace", del, { preventDefault: true });
  useHotkeys("ctrl+shift+g, meta+shift+g", viewGrid, { preventDefault: true });
  useHotkeys("ctrl+up, meta+up", zoomIn, { preventDefault: true });
  useHotkeys("ctrl+down, meta+down", zoomOut, { preventDefault: true });
  useHotkeys("ctrl+shift+m, meta+shift+m", viewStrictMode, {
    preventDefault: true,
  });
  useHotkeys("mod+shift+f", viewFieldSummary, {
    preventDefault: true,
  });
  useHotkeys("mod+shift+s", saveDiagramAs, {
    preventDefault: true,
  });
  useHotkeys("mod+alt+c", copyAsImage, { preventDefault: true });
  useHotkeys("mod+r", resetView, { preventDefault: true });
  useHotkeys("mod+h", () => window.open(socials.docs, "_blank"), {
    preventDefault: true,
  });
  useHotkeys("mod+alt+w", fitWindow, { preventDefault: true });

  return (
    <>
      <div>
        {layout.header && (
          <div
            className="flex justify-between items-center me-7"
            style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
          >
            {header()}
            {window.name.split(" ")[0] !== "t" && (
              <Button
                type="primary"
                className="text-base me-2 pe-6 ps-5 py-[18px] rounded-md"
                size="default"
                icon={<IconShareStroked />}
                onClick={() => setModal(MODAL.SHARE)}
              >
                {t("share")}
              </Button>
            )}
          </div>
        )}
        {layout.toolbar && toolbar()}
      </div>
      <Modal
        modal={modal}
        exportData={exportData}
        setExportData={setExportData}
        title={title}
        setTitle={setTitle}
        setDiagramId={setDiagramId}
        setModal={setModal}
        importFrom={importFrom}
        importDb={importDb}
      />
      <Sidesheet
        type={sidesheet}
        onClose={() => setSidesheet(SIDESHEET.NONE)}
      />
    </>
  );

  function toolbar() {
    return (
      <div
        className="py-1.5 px-5 flex justify-between items-center rounded-xl my-1 sm:mx-1 xl:mx-6 select-none overflow-hidden toolbar-theme"
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        <div className="flex justify-start items-center">
          <LayoutDropdown />
          <Divider layout="vertical" margin="8px" />
          <Dropdown
            style={{ width: "240px" }}
            position={isRtl(i18n.language) ? "bottomRight" : "bottomLeft"}
            render={
              <Dropdown.Menu
                style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
              >
                <Dropdown.Item
                  onClick={fitWindow}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>{t("fit_window_reset")}</div>
                  <div className="text-gray-400">Ctrl+Alt+W</div>
                </Dropdown.Item>
                <Dropdown.Divider />
                {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((e, i) => (
                  <Dropdown.Item
                    key={i}
                    onClick={() => {
                      setTransform((prev) => ({ ...prev, zoom: e }));
                    }}
                  >
                    {Math.floor(e * 100)}%
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item>
                  <InputNumber
                    field="zoom"
                    label={t("zoom")}
                    placeholder={t("zoom")}
                    suffix={<div className="p-1">%</div>}
                    onChange={(v) =>
                      setTransform((prev) => ({
                        ...prev,
                        zoom: parseFloat(v) * 0.01,
                      }))
                    }
                  />
                </Dropdown.Item>
              </Dropdown.Menu>
            }
            trigger="click"
          >
            <div className="py-1 px-2 hover-2 rounded flex items-center justify-center">
              <div className="w-[40px]">
                {Math.floor(transform.zoom * 100)}%
              </div>
              <div>
                <IconCaretdown />
              </div>
            </div>
          </Dropdown>
          <Tooltip content={t("zoom_in")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded text-lg"
              onClick={() =>
                setTransform((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }))
              }
            >
              <i className="fa-solid fa-magnifying-glass-plus" />
            </button>
          </Tooltip>
          <Tooltip content={t("zoom_out")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded text-lg"
              onClick={() =>
                setTransform((prev) => ({ ...prev, zoom: prev.zoom / 1.2 }))
              }
            >
              <i className="fa-solid fa-magnifying-glass-minus" />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={t("undo")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded flex items-center"
              onClick={undo}
            >
              <IconUndo
                size="large"
                style={{ color: undoStack.length === 0 ? "#9598a6" : "" }}
              />
            </button>
          </Tooltip>
          <Tooltip content={t("redo")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded flex items-center"
              onClick={redo}
            >
              <IconRedo
                size="large"
                style={{ color: redoStack.length === 0 ? "#9598a6" : "" }}
              />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={t("add_table")} position="bottom">
            <button
              className="flex items-center py-1 px-2 hover-2 rounded"
              onClick={() => addTable()}
            >
              <IconAddTable />
            </button>
          </Tooltip>
          <Tooltip content={t("add_area")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded flex items-center"
              onClick={() => addArea()}
            >
              <IconAddArea />
            </button>
          </Tooltip>
          <Tooltip content={t("add_note")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded flex items-center"
              onClick={() => addNote()}
            >
              <IconAddNote />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={t("save")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded flex items-center"
              onClick={save}
            >
              <IconSaveStroked size="extra-large" />
            </button>
          </Tooltip>
          <Tooltip content={t("to_do")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded text-xl -mt-0.5"
              onClick={() => setSidesheet(SIDESHEET.TODO)}
            >
              <i className="fa-regular fa-calendar-check" />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={t("theme")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded text-xl -mt-0.5"
              onClick={() => {
                const body = document.body;
                if (body.hasAttribute("theme-mode")) {
                  if (body.getAttribute("theme-mode") === "light") {
                    menu["view"]["theme"].children[1]["dark"]();
                  } else {
                    menu["view"]["theme"].children[0]["light"]();
                  }
                }
              }}
            >
              <i className="fa-solid fa-circle-half-stroke" />
            </button>
          </Tooltip>
        </div>
        <button
          onClick={() => invertLayout("header")}
          className="flex items-center"
        >
          {layout.header ? <IconChevronUp /> : <IconChevronDown />}
        </button>
      </div>
    );
  }

  function getState() {
    switch (saveState) {
      case State.NONE:
        return t("no_changes");
      case State.LOADING:
        return t("loading");
      case State.SAVED:
        return `${t("last_saved")} ${lastSaved}`;
      case State.SAVING:
        return t("saving");
      case State.ERROR:
        return t("failed_to_save");
      case State.FAILED_TO_LOAD:
        return t("failed_to_load");
      default:
        return "";
    }
  }

  function header() {
    return (
      <nav
        className="flex justify-between pt-1 items-center whitespace-nowrap"
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        <div className="flex justify-start items-center">
          <Link to="/">
            <img
              width={54}
              src={icon}
              alt="logo"
              className="ms-7 min-w-[54px]"
            />
          </Link>
          <div className="ms-1 mt-1">
            <div className="flex items-center ms-3 gap-2">
              {databases[database].image && (
                <img
                  src={databases[database].image}
                  className="h-5"
                  style={{
                    filter:
                      "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                  }}
                  alt={databases[database].name + " icon"}
                  title={databases[database].name + " diagram"}
                />
              )}
              <div
                className="text-xl  me-1"
                onPointerEnter={(e) => e.isPrimary && setShowEditName(true)}
                onPointerLeave={(e) => e.isPrimary && setShowEditName(false)}
                onPointerDown={(e) => {
                  // Required for onPointerLeave to trigger when a touch pointer leaves
                  // https://stackoverflow.com/a/70976017/1137077
                  e.target.releasePointerCapture(e.pointerId);
                }}
                onClick={() => setModal(MODAL.RENAME)}
              >
                {window.name.split(" ")[0] === "t" ? "Templates/" : "Diagrams/"}
                {title}
              </div>
              {(showEditName || modal === MODAL.RENAME) && <IconEdit />}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex justify-start text-md select-none me-2">
                {Object.keys(menu).map((category) => (
                  <Dropdown
                    key={category}
                    position="bottomLeft"
                    style={{
                      width: "240px",
                      direction: isRtl(i18n.language) ? "rtl" : "ltr",
                    }}
                    render={
                      <Dropdown.Menu>
                        {Object.keys(menu[category]).map((item, index) => {
                          if (menu[category][item].children) {
                            return (
                              <Dropdown
                                style={{ width: "120px" }}
                                key={item}
                                position="rightTop"
                                render={
                                  <Dropdown.Menu>
                                    {menu[category][item].children.map(
                                      (e, i) => (
                                        <Dropdown.Item
                                          key={i}
                                          onClick={Object.values(e)[0]}
                                        >
                                          {t(Object.keys(e)[0])}
                                        </Dropdown.Item>
                                      ),
                                    )}
                                  </Dropdown.Menu>
                                }
                              >
                                <Dropdown.Item
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                  onClick={menu[category][item].function}
                                >
                                  {t(item)}

                                  {isRtl(i18n.language) ? (
                                    <IconChevronLeft />
                                  ) : (
                                    <IconChevronRight />
                                  )}
                                </Dropdown.Item>
                              </Dropdown>
                            );
                          }
                          if (menu[category][item].warning) {
                            return (
                              <Popconfirm
                                key={index}
                                title={menu[category][item].warning.title}
                                content={menu[category][item].warning.message}
                                onConfirm={menu[category][item].function}
                                position="right"
                                okText={t("confirm")}
                                cancelText={t("cancel")}
                              >
                                <Dropdown.Item>{t(item)}</Dropdown.Item>
                              </Popconfirm>
                            );
                          }
                          return (
                            <Dropdown.Item
                              key={index}
                              onClick={menu[category][item].function}
                              style={
                                menu[category][item].shortcut && {
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }
                              }
                            >
                              <div className="w-full flex items-center justify-between">
                                <div>{t(item)}</div>
                                <div className="flex items-center gap-1">
                                  {menu[category][item].shortcut && (
                                    <div className="text-gray-400">
                                      {menu[category][item].shortcut}
                                    </div>
                                  )}
                                  {menu[category][item].state &&
                                    menu[category][item].state}
                                </div>
                              </div>
                            </Dropdown.Item>
                          );
                        })}
                      </Dropdown.Menu>
                    }
                  >
                    <div className="px-3 py-1 hover-2 rounded">
                                           {t(category)}
                    </div>
                  </Dropdown>
                ))}
              </div>
              <Button
                size="small"
                type="tertiary"
                icon={
                  saveState === State.LOADING || saveState === State.SAVING ? (
                    <Spin size="small" />
                  ) : null
                }
              >
                {getState()}
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }
}
