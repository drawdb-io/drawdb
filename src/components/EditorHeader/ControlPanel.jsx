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
  Tag,
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
  jsonToOracleSQL,
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
  noteWidth,
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
import { exportSavedData } from "../../utils/exportSavedData";
import { nanoid } from "nanoid";
import { getTableHeight } from "../../utils/utils";

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

    if (a.bulk) {
      for (const element of a.elements) {
        if (element.type === ObjectType.TABLE) {
          updateTable(element.id, element.undo);
        } else if (element.type === ObjectType.AREA) {
          updateArea(element.id, element.undo);
        } else if (element.type === ObjectType.NOTE) {
          updateNote(element.id, element.undo);
        }
      }
      setRedoStack((prev) => [...prev, a]);
      return;
    }

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        deleteTable(a.id, false);
      } else if (a.element === ObjectType.AREA) {
        deleteArea(areas[areas.length - 1].id, false);
      } else if (a.element === ObjectType.NOTE) {
        deleteNote(notes[notes.length - 1].id, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        deleteRelationship(a.data.id, false);
      } else if (a.element === ObjectType.TYPE) {
        deleteType(types.length - 1, false);
      } else if (a.element === ObjectType.ENUM) {
        deleteEnum(enums.length - 1, false);
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        const { x, y } = tables.find((t) => t.id === a.id);
        setRedoStack((prev) => [...prev, { ...a, x, y }]);
        updateTable(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.AREA) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: areas[a.id].x, y: areas[a.id].y },
        ]);
        updateArea(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.NOTE) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: notes[a.id].x, y: notes[a.id].y },
        ]);
        updateNote(a.id, { x: a.x, y: a.y });
      }
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        a.data.relationship.forEach((x) => addRelationship(x, false));
        addTable(a.data.table, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        addRelationship(a.data, false);
      } else if (a.element === ObjectType.NOTE) {
        addNote(a.data, false);
      } else if (a.element === ObjectType.AREA) {
        addArea(a.data, false);
      } else if (a.element === ObjectType.TYPE) {
        addType({ id: a.id, ...a.data }, false);
      } else if (a.element === ObjectType.ENUM) {
        addEnum({ id: a.id, ...a.data }, false);
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA) {
        updateArea(a.aid, a.undo);
      } else if (a.element === ObjectType.NOTE) {
        updateNote(a.nid, a.undo);
      } else if (a.element === ObjectType.TABLE) {
        const table = tables.find((t) => t.id === a.tid);
        if (a.component === "field") {
          updateField(a.tid, a.fid, a.undo);
        } else if (a.component === "field_delete") {
          setRelationships((prev) => {
            let temp = [...prev];
            a.data.relationship.forEach((r) => {
              temp.splice(r.id, 0, r);
            });
            return temp;
          });
          const updatedFields = table.fields.slice();
          updatedFields.splice(a.data.index, 0, a.data.field);
          updateTable(a.tid, { fields: updatedFields });
        } else if (a.component === "field_add") {
          updateTable(a.tid, {
            fields: table.fields.filter((e) => e.id !== a.fid),
          });
        } else if (a.component === "index_add") {
          updateTable(a.tid, {
            indices: table.indices
              .filter((e) => e.id !== table.indices.length - 1)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "index") {
          updateTable(a.tid, {
            indices: table.indices.map((index) =>
              index.id === a.iid
                ? {
                    ...index,
                    ...a.undo,
                  }
                : index,
            ),
          });
        } else if (a.component === "index_delete") {
          const updatedIndices = table.indices.slice();
          updatedIndices.splice(a.data.id, 0, a.data);
          updateTable(a.tid, {
            indices: updatedIndices.map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "self") {
          updateTable(a.tid, a.undo);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        updateRelationship(a.rid, a.undo);
      } else if (a.element === ObjectType.TYPE) {
        if (a.component === "field_add") {
          updateType(a.tid, {
            fields: types[a.tid].fields.filter(
              (_, i) => i !== types[a.tid].fields.length - 1,
            ),
          });
        }
        if (a.component === "field") {
          updateType(a.tid, {
            fields: types[a.tid].fields.map((e, i) =>
              i === a.fid ? { ...e, ...a.undo } : e,
            ),
          });
        } else if (a.component === "field_delete") {
          setTypes((prev) =>
            prev.map((t, i) => {
              if (i === a.tid) {
                const temp = t.fields.slice();
                temp.splice(a.fid, 0, a.data);
                return { ...t, fields: temp };
              }
              return t;
            }),
          );
        } else if (a.component === "self") {
          updateType(a.tid, a.undo);
          if (a.updatedFields) {
            if (a.undo.name) {
              a.updatedFields.forEach((x) =>
                updateField(x.tid, x.fid, { type: a.undo.name.toUpperCase() }),
              );
            }
          }
        }
      } else if (a.element === ObjectType.ENUM) {
        updateEnum(a.id, a.undo);
        if (a.updatedFields) {
          if (a.undo.name) {
            a.updatedFields.forEach((x) =>
              updateField(x.tid, x.fid, { type: a.undo.name.toUpperCase() }),
            );
          }
        }
      }
      setRedoStack((prev) => [...prev, a]);
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const a = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.filter((e, i) => i !== prev.length - 1));

    if (a.bulk) {
      for (const element of a.elements) {
        if (element.type === ObjectType.TABLE) {
          updateTable(element.id, element.redo);
        } else if (element.type === ObjectType.AREA) {
          updateArea(element.id, element.redo);
        } else if (element.type === ObjectType.NOTE) {
          updateNote(element.id, element.redo);
        }
      }
      setUndoStack((prev) => [...prev, a]);
      return;
    }

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        addTable(null, false);
      } else if (a.element === ObjectType.AREA) {
        addArea(null, false);
      } else if (a.element === ObjectType.NOTE) {
        addNote(null, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        addRelationship(a.data, false);
      } else if (a.element === ObjectType.TYPE) {
        addType(null, false);
      } else if (a.element === ObjectType.ENUM) {
        addEnum(null, false);
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        const { x, y } = tables.find((t) => t.id == a.id);
        setUndoStack((prev) => [...prev, { ...a, x, y }]);
        updateTable(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.AREA) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: areas[a.id].x, y: areas[a.id].y },
        ]);
        updateArea(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.NOTE) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: notes[a.id].x, y: notes[a.id].y },
        ]);
        updateNote(a.id, { x: a.x, y: a.y });
      }
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        deleteTable(a.data.table.id, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        deleteRelationship(a.data.id, false);
      } else if (a.element === ObjectType.NOTE) {
        deleteNote(a.data.id, false);
      } else if (a.element === ObjectType.AREA) {
        deleteArea(a.data.id, false);
      } else if (a.element === ObjectType.TYPE) {
        deleteType(a.id, false);
      } else if (a.element === ObjectType.ENUM) {
        deleteEnum(a.id, false);
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA) {
        updateArea(a.aid, a.redo);
      } else if (a.element === ObjectType.NOTE) {
        updateNote(a.nid, a.redo);
      } else if (a.element === ObjectType.TABLE) {
        const table = tables.find((t) => t.id === a.tid);
        if (a.component === "field") {
          updateField(a.tid, a.fid, a.redo);
        } else if (a.component === "field_delete") {
          deleteField(a.data.field, a.tid, false);
        } else if (a.component === "field_add") {
          updateTable(a.tid, {
            fields: [
              ...table.fields,
              {
                name: "",
                type: "",
                default: "",
                check: "",
                primary: false,
                unique: false,
                notNull: false,
                increment: false,
                comment: "",
                id: nanoid(),
              },
            ],
          });
        } else if (a.component === "index_add") {
          updateTable(a.tid, {
            indices: [
              ...table.indices,
              {
                id: table.indices.length,
                name: `index_${table.indices.length}`,
                fields: [],
              },
            ],
          });
        } else if (a.component === "index") {
          updateTable(a.tid, {
            indices: table.indices.map((index) =>
              index.id === a.iid
                ? {
                    ...index,
                    ...a.redo,
                  }
                : index,
            ),
          });
        } else if (a.component === "index_delete") {
          updateTable(a.tid, {
            indices: table.indices
              .filter((e) => e.id !== a.data.id)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "self") {
          updateTable(a.tid, a.redo, false);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        updateRelationship(a.rid, a.redo);
      } else if (a.element === ObjectType.TYPE) {
        if (a.component === "field_add") {
          updateType(a.tid, {
            fields: [
              ...types[a.tid].fields,
              {
                name: "",
                type: "",
              },
            ],
          });
        } else if (a.component === "field") {
          updateType(a.tid, {
            fields: types[a.tid].fields.map((e, i) =>
              i === a.fid ? { ...e, ...a.redo } : e,
            ),
          });
        } else if (a.component === "field_delete") {
          updateType(a.tid, {
            fields: types[a.tid].fields.filter((field, i) => i !== a.fid),
          });
        } else if (a.component === "self") {
          updateType(a.tid, a.redo);
          if (a.updatedFields) {
            if (a.redo.name) {
              a.updatedFields.forEach((x) =>
                updateField(x.tid, x.fid, { type: a.redo.name.toUpperCase() }),
              );
            }
          }
        }
      } else if (a.element === ObjectType.ENUM) {
        updateEnum(a.id, a.redo);
        if (a.updatedFields) {
          if (a.redo.name) {
            a.updatedFields.forEach((x) =>
              updateField(x.tid, x.fid, { type: a.redo.name.toUpperCase() }),
            );
          }
        }
      }
      setUndoStack((prev) => [...prev, a]);
    }
  };

  const fileImport = () => setModal(MODAL.IMPORT);
  const viewGrid = () =>
    setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  const snapToGrid = () =>
    setSettings((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }));
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
    const canvas = document.getElementById("canvas").getBoundingClientRect();

    const minMaxXY = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    };

    tables.forEach((table) => {
      minMaxXY.minX = Math.min(minMaxXY.minX, table.x);
      minMaxXY.minY = Math.min(minMaxXY.minY, table.y);
      minMaxXY.maxX = Math.max(minMaxXY.maxX, table.x + settings.tableWidth);
      minMaxXY.maxY = Math.max(minMaxXY.maxY, table.y + getTableHeight(table));
    });

    areas.forEach((area) => {
      minMaxXY.minX = Math.min(minMaxXY.minX, area.x);
      minMaxXY.minY = Math.min(minMaxXY.minY, area.y);
      minMaxXY.maxX = Math.max(minMaxXY.maxX, area.x + area.width);
      minMaxXY.maxY = Math.max(minMaxXY.maxY, area.y + area.height);
    });

    notes.forEach((note) => {
      minMaxXY.minX = Math.min(minMaxXY.minX, note.x);
      minMaxXY.minY = Math.min(minMaxXY.minY, note.y);
      minMaxXY.maxX = Math.max(minMaxXY.maxX, note.x + noteWidth);
      minMaxXY.maxY = Math.max(minMaxXY.maxY, note.y + note.height);
    });

    const padding = 10;
    const width = minMaxXY.maxX - minMaxXY.minX + padding;
    const height = minMaxXY.maxY - minMaxXY.minY + padding;

    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;
    // Making sure the scale is a multiple of 0.05
    const scale = Math.floor(Math.min(scaleX, scaleY) * 20) / 20;

    const centerX = (minMaxXY.minX + minMaxXY.maxX) / 2;
    const centerY = (minMaxXY.minY + minMaxXY.maxY) / 2;

    setTransform((prev) => ({
      ...prev,
      zoom: scale,
      pan: { x: centerX, y: centerY },
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
      case ObjectType.TABLE: {
        const copiedTable = tables.find((t) => t.id === selectedElement.id);
        addTable({
          ...copiedTable,
          x: copiedTable.x + 20,
          y: copiedTable.y + 20,
          id: nanoid(),
        });
        break;
      }
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
          .writeText(
            JSON.stringify(tables.find((t) => t.id === selectedElement.id)),
          )
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
          id: nanoid(),
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
  const toggleDBMLEditor = () => {
    setLayout((prev) => ({ ...prev, dbmlEditor: !prev.dbmlEditor }));
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
            function: fileImport,
            name: "JSON",
          },
          {
            function: () => {
              setModal(MODAL.IMPORT);
              setImportFrom(IMPORT_FROM.DBML);
            },
            name: "DBML",
          },
        ],
      },
      import_from_source: {
        ...(database === DB.GENERIC && {
          children: [
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MYSQL);
              },
              name: "MySQL",
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.POSTGRES);
              },
              name: "PostgreSQL",
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.SQLITE);
              },
              name: "SQLite",
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MARIADB);
              },
              name: "MariaDB",
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MSSQL);
              },
              name: "MSSQL",
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.ORACLESQL);
              },
              name: "Oracle",
              label: "Beta",
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
              name: "MySQL",
              function: () => {
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
              name: "PostgreSQL",
              function: () => {
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
              name: "SQLite",
              function: () => {
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
              name: "MariaDB",
              function: () => {
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
              name: "MSSQL",
              function: () => {
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
              label: "Beta",
              name: "Oracle",
              function: () => {
                setModal(MODAL.CODE);
                const src = jsonToOracleSQL({
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
            name: "PNG",
            function: () => {
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
            name: "JPEG",
            function: () => {
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
            name: "SVG",
            function: () => {
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
            name: "JSON",
            function: () => {
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
            name: "DBML",
            function: () => {
              setModal(MODAL.CODE);
              const result = toDBML({
                tables,
                relationships,
                enums,
                database,
              });
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "dbml",
              }));
            },
          },
          {
            name: "PDF",
            function: () => {
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
            name: "Mermaid",
            function: () => {
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
            name: "Markdown",
            function: () => {
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
        function: async () => {
          setTables([]);
          setRelationships([]);
          setAreas([]);
          setNotes([]);
          setEnums([]);
          setTypes([]);
          setUndoStack([]);
          setRedoStack([]);

          if (!diagramId) {
            Toast.error(t("oops_smth_went_wrong"));
            return;
          }

          db.table("diagrams")
            .delete(diagramId)
            .catch((error) => {
              Toast.error(t("oops_smth_went_wrong"));
              console.error(
                `Error deleting records with gistId '${diagramId}':`,
                error,
              );
            });
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
        shortcut: "Del",
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
      dbml_view: {
        state: layout.dbmlEditor ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: toggleDBMLEditor,
        shortcut: "Alt+E",
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
        shortcut: "Enter/Return",
      },
      show_datatype: {
        state: settings.showDataTypes ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showDataTypes: !prev.showDataTypes,
          })),
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
      snap_to_grid: {
        state: settings.snapToGrid ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: snapToGrid,
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
            name: t("light"),
            function: () => setSettings((prev) => ({ ...prev, mode: "light" })),
          },
          {
            name: t("dark"),
            function: () => setSettings((prev) => ({ ...prev, mode: "dark" })),
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
      table_width: {
        function: () => setModal(MODAL.TABLE_WIDTH),
      },
      language: {
        function: () => setModal(MODAL.LANGUAGE),
      },
      export_saved_data: {
        function: exportSavedData,
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
    },
  };

  useHotkeys("mod+i", fileImport, { preventDefault: true });
  useHotkeys("mod+z", undo, { preventDefault: true });
  useHotkeys("mod+y", redo, { preventDefault: true });
  useHotkeys("mod+s", save, { preventDefault: true });
  useHotkeys("mod+o", open, { preventDefault: true });
  useHotkeys("mod+e", edit, { preventDefault: true });
  useHotkeys("mod+d", duplicate, { preventDefault: true });
  useHotkeys("mod+c", copy, { preventDefault: true });
  useHotkeys("mod+v", paste, { preventDefault: true });
  useHotkeys("mod+x", cut, { preventDefault: true });
  useHotkeys("delete", del, { preventDefault: true });
  useHotkeys("mod+shift+g", viewGrid, { preventDefault: true });
  useHotkeys("mod+up", zoomIn, { preventDefault: true });
  useHotkeys("mod+down", zoomOut, { preventDefault: true });
  useHotkeys("mod+shift+m", viewStrictMode, {
    preventDefault: true,
  });
  useHotkeys("mod+shift+f", viewFieldSummary, {
    preventDefault: true,
  });
  useHotkeys("mod+shift+s", saveDiagramAs, {
    preventDefault: true,
  });
  useHotkeys("mod+alt+c", copyAsImage, { preventDefault: true });
  useHotkeys("enter", resetView, { preventDefault: true });
  useHotkeys("mod+h", () => window.open(socials.docs, "_blank"), {
    preventDefault: true,
  });
  useHotkeys("mod+alt+w", fitWindow, { preventDefault: true });
  useHotkeys("alt+e", toggleDBMLEditor, { preventDefault: true });

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
                className="!text-base me-2 !pe-6 !ps-5 !py-[18px] !rounded-md"
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
            <div className="py-1 px-2 hover-2 rounded-sm flex items-center justify-center">
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
              className="py-1 px-2 hover-2 rounded-sm text-lg"
              onClick={() =>
                setTransform((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }))
              }
            >
              <i className="fa-solid fa-magnifying-glass-plus" />
            </button>
          </Tooltip>
          <Tooltip content={t("zoom_out")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-lg"
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
              className="py-1 px-2 hover-2 rounded-sm flex items-center"
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
              className="py-1 px-2 hover-2 rounded-sm flex items-center"
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
              className="flex items-center py-1 px-2 hover-2 rounded-sm"
              onClick={() => addTable()}
            >
              <IconAddTable />
            </button>
          </Tooltip>
          <Tooltip content={t("add_area")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center"
              onClick={() => addArea()}
            >
              <IconAddArea />
            </button>
          </Tooltip>
          <Tooltip content={t("add_note")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center"
              onClick={() => addNote()}
            >
              <IconAddNote />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={t("save")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center"
              onClick={save}
            >
              <IconSaveStroked size="extra-large" />
            </button>
          </Tooltip>
          <Tooltip content={t("to_do")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-xl -mt-0.5"
              onClick={() => setSidesheet(SIDESHEET.TODO)}
            >
              <i className="fa-regular fa-calendar-check" />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={t("theme")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-xl -mt-0.5"
              onClick={() => {
                const body = document.body;
                if (body.hasAttribute("theme-mode")) {
                  if (body.getAttribute("theme-mode") === "light") {
                    menu["view"]["theme"].children[1].function();
                  } else {
                    menu["view"]["theme"].children[0].function();
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
                      <Dropdown.Menu className="menu max-h-[calc(100vh-80px)] overflow-auto">
                        {Object.keys(menu[category]).map((item, index) => {
                          if (menu[category][item].children) {
                            return (
                              <Dropdown
                                style={{ width: "150px" }}
                                key={item}
                                position="rightTop"
                                render={
                                  <Dropdown.Menu>
                                    {menu[category][item].children.map(
                                      (e, i) => (
                                        <Dropdown.Item
                                          key={i}
                                          onClick={e.function}
                                          className="flex justify-between"
                                        >
                                          <span>{e.name}</span>
                                          {e.label && (
                                            <Tag
                                              size="small"
                                              color="light-blue"
                                            >
                                              {e.label}
                                            </Tag>
                                          )}
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
                    <div className="px-3 py-1 hover-2 rounded-sm">
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
