import { useState } from "react";
import {
  IconCaretdown,
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
  IconSaveStroked,
  IconUndo,
  IconRedo,
  IconEdit,
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
import { saveAs } from "file-saver";
import {
  jsonToMySQL,
  jsonToPostgreSQL,
  jsonToSQLite,
  jsonToMariaDB,
  jsonToSQLServer,
} from "../../utils/toSQL";
import {
  ObjectType,
  Action,
  Tab,
  State,
  MODAL,
  SIDESHEET,
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
  useTables,
  useUndoRedo,
  useSelect,
} from "../../hooks";
import { enterFullscreen } from "../../utils/fullscreen";
import { dataURItoBlob } from "../../utils/utils";
import useAreas from "../../hooks/useAreas";
import useNotes from "../../hooks/useNotes";
import useTypes from "../../hooks/useTypes";
import useSaveState from "../../hooks/useSaveState";
import { IconAddArea, IconAddNote, IconAddTable } from "../../icons";
import LayoutDropdown from "./LayoutDropdown";
import Sidesheet from "./SideSheet/Sidesheet";
import Modal from "./Modal/Modal";
import { useTranslation } from "react-i18next";

export default function ControlPanel({
  diagramId,
  setDiagramId,
  title,
  setTitle,
  lastSaved,
}) {
  const [modal, setModal] = useState(MODAL.NONE);
  const [sidesheet, setSidesheet] = useState(SIDESHEET.NONE);
  const [prevTitle, setPrevTitle] = useState(title);
  const [showEditName, setShowEditName] = useState(false);
  const [exportData, setExportData] = useState({
    data: null,
    filename: `${title}_${new Date().toISOString()}`,
    extension: "",
  });
  const { saveState, setSaveState } = useSaveState();
  const { layout, setLayout } = useLayout();
  const { settings, setSettings } = useSettings();
  const {
    relationships,
    tables,
    setTables,
    addTable,
    updateTable,
    deleteTable,
    updateField,
    setRelationships,
    addRelationship,
    deleteRelationship,
  } = useTables();
  const { types, addType, deleteType, updateType, setTypes } = useTypes();
  const { notes, setNotes, updateNote, addNote, deleteNote } = useNotes();
  const { areas, setAreas, updateArea, addArea, deleteArea } = useAreas();
  const { undoStack, redoStack, setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const { transform, setTransform } = useTransform();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const invertLayout = (component) =>
    setLayout((prev) => ({ ...prev, [component]: !prev[component] }));

  const undo = () => {
    if (undoStack.length === 0) return;
    const a = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.filter((e, i) => i !== prev.length - 1));
    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        deleteTable(tables[tables.length - 1].id, false);
      } else if (a.element === ObjectType.AREA) {
        deleteArea(areas[areas.length - 1].id, false);
      } else if (a.element === ObjectType.NOTE) {
        deleteNote(notes[notes.length - 1].id, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        deleteRelationship(a.data.id, false);
      } else if (a.element === ObjectType.TYPE) {
        deleteType(types.length - 1, false);
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: tables[a.id].x, y: tables[a.id].y },
        ]);
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
        addTable(a.data, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        addRelationship(a.data, false);
      } else if (a.element === ObjectType.NOTE) {
        addNote(a.data, false);
      } else if (a.element === ObjectType.AREA) {
        addArea(a.data, false);
      } else if (a.element === ObjectType.TYPE) {
        addType({ id: a.id, ...a.data }, false);
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA) {
        updateArea(a.aid, a.undo);
      } else if (a.element === ObjectType.NOTE) {
        updateNote(a.nid, a.undo);
      } else if (a.element === ObjectType.TABLE) {
        if (a.component === "field") {
          updateField(a.tid, a.fid, a.undo);
        } else if (a.component === "field_delete") {
          setRelationships((prev) => {
            return prev.map((e) => {
              if (e.startTableId === a.tid && e.startFieldId >= a.data.id) {
                return {
                  ...e,
                  startFieldId: e.startFieldId + 1,
                };
              }
              if (e.endTableId === a.tid && e.endFieldId >= a.data.id) {
                return {
                  ...e,
                  endFieldId: e.endFieldId + 1,
                };
              }
              return e;
            });
          });
          setTables((prev) =>
            prev.map((t) => {
              if (t.id === a.tid) {
                const temp = t.fields.slice();
                temp.splice(a.data.id, 0, a.data);
                return { ...t, fields: temp.map((t, i) => ({ ...t, id: i })) };
              }
              return t;
            }),
          );
        } else if (a.component === "field_add") {
          updateTable(a.tid, {
            fields: tables[a.tid].fields
              .filter((e) => e.id !== tables[a.tid].fields.length - 1)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "index_add") {
          updateTable(a.tid, {
            indices: tables[a.tid].indices
              .filter((e) => e.id !== tables[a.tid].indices.length - 1)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "index") {
          updateTable(a.tid, {
            indices: tables[a.tid].indices.map((index) =>
              index.id === a.iid
                ? {
                    ...index,
                    ...a.undo,
                  }
                : index,
            ),
          });
        } else if (a.component === "index_delete") {
          setTables((prev) =>
            prev.map((table) => {
              if (table.id === a.tid) {
                const temp = table.indices.slice();
                temp.splice(a.data.id, 0, a.data);
                return {
                  ...table,
                  indices: temp.map((t, i) => ({ ...t, id: i })),
                };
              }
              return table;
            }),
          );
        } else if (a.component === "self") {
          updateTable(a.tid, a.undo);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        setRelationships((prev) =>
          prev.map((e, idx) => (idx === a.rid ? { ...e, ...a.undo } : e)),
        );
      } else if (a.element === ObjectType.TYPE) {
        if (a.component === "field_add") {
          updateType(a.tid, {
            fields: types[a.tid].fields.filter(
              (e, i) => i !== types[a.tid].fields.length - 1,
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
        }
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.PAN) {
      setTransform((prev) => ({
        ...prev,
        pan: a.undo,
      }));
      setRedoStack((prev) => [...prev, a]);
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const a = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.filter((e, i) => i !== prev.length - 1));
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
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: tables[a.id].x, y: tables[a.id].y },
        ]);
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
        deleteTable(a.data.id, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        deleteRelationship(a.data.id, false);
      } else if (a.element === ObjectType.NOTE) {
        deleteNote(a.data.id, false);
      } else if (a.element === ObjectType.AREA) {
        deleteArea(a.data.id, false);
      } else if (a.element === ObjectType.TYPE) {
        deleteType(a.id, false);
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA) {
        updateArea(a.aid, a.redo);
      } else if (a.element === ObjectType.NOTE) {
        updateNote(a.nid, a.redo);
      } else if (a.element === ObjectType.TABLE) {
        if (a.component === "field") {
          updateField(a.tid, a.fid, a.redo);
        } else if (a.component === "field_delete") {
          setRelationships((prev) => {
            return prev.map((e) => {
              if (e.startTableId === a.tid && e.startFieldId > a.data.id) {
                return {
                  ...e,
                  startFieldId: e.startFieldId - 1,
                };
              }
              if (e.endTableId === a.tid && e.endFieldId > a.data.id) {
                return {
                  ...e,
                  endFieldId: e.endFieldId - 1,
                };
              }
              return e;
            });
          });
          updateTable(a.tid, {
            fields: tables[a.tid].fields
              .filter((field) => field.id !== a.data.id)
              .map((e, i) => ({ ...e, id: i })),
          });
        } else if (a.component === "field_add") {
          updateTable(a.tid, {
            fields: [
              ...tables[a.tid].fields,
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
                id: tables[a.tid].fields.length,
              },
            ],
          });
        } else if (a.component === "index_add") {
          setTables((prev) =>
            prev.map((table) => {
              if (table.id === a.tid) {
                return {
                  ...table,
                  indices: [
                    ...table.indices,
                    {
                      id: table.indices.length,
                      name: `index_${table.indices.length}`,
                      fields: [],
                    },
                  ],
                };
              }
              return table;
            }),
          );
        } else if (a.component === "index") {
          updateTable(a.tid, {
            indices: tables[a.tid].indices.map((index) =>
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
            indices: tables[a.tid].indices
              .filter((e) => e.id !== a.data.id)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "self") {
          updateTable(a.tid, a.redo, false);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        setRelationships((prev) =>
          prev.map((e, idx) => (idx === a.rid ? { ...e, ...a.redo } : e)),
        );
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
        }
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.PAN) {
      setTransform((prev) => ({
        ...prev,
        pan: a.redo,
      }));
      setUndoStack((prev) => [...prev, a]);
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
              relationships: relationships,
              types: types,
              notes: notes,
              subjectAreas: areas,
              custom: 1,
            })
            .then(() => {
              Toast.success(t("template_saved"));
            });
        },
      },
      rename: {
        function: () => {
          setModal(MODAL.RENAME);
          setPrevTitle(title);
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
              setUndoStack([]);
              setRedoStack([]);
            })
            .catch(() => Toast.error(t("oops_smth_went_wrong")));
        },
      },
      import_diagram: {
        function: fileImport,
        shortcut: "Ctrl+I",
      },
      import_from_source: {
        function: () => setModal(MODAL.IMPORT_SRC),
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
            JSON: () => {
              setModal(MODAL.CODE);
              const result = JSON.stringify(
                {
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                  types: types,
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
            DRAWDB: () => {
              const result = JSON.stringify(
                {
                  author: "Unnamed",
                  title: title,
                  date: new Date().toISOString(),
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                  types: types,
                },
                null,
                2,
              );
              const blob = new Blob([result], {
                type: "text/plain;charset=utf-8",
              });
              saveAs(blob, `${exportData.filename}.ddb`);
            },
          },
        ],
        function: () => {},
      },
      export_source: {
        children: [
          {
            MySQL: () => {
              setModal(MODAL.CODE);
              const src = jsonToMySQL({
                tables: tables,
                references: relationships,
                types: types,
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
              });
              setExportData((prev) => ({
                ...prev,
                data: src,
                extension: "sql",
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
        shortcut: "Ctrl+Up/Wheel",
      },
      zoom_out: {
        function: zoomOut,
        shortcut: "Ctrl+Down/Wheel",
      },
      fullscreen: {
        function: enterFullscreen,
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
      shortcuts: {
        function: () => window.open("/shortcuts", "_blank"),
        shortcut: "Ctrl+H",
      },
      ask_on_discord: {
        function: () => window.open("https://discord.gg/BrjZgNrmR6", "_blank"),
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
  useHotkeys("delete", del, { preventDefault: true });
  useHotkeys("ctrl+shift+g, meta+shift+g", viewGrid, { preventDefault: true });
  useHotkeys("ctrl+up, meta+up", zoomIn, { preventDefault: true });
  useHotkeys("ctrl+down, meta+down", zoomOut, { preventDefault: true });
  useHotkeys("ctrl+shift+m, meta+shift+m", viewStrictMode, {
    preventDefault: true,
  });
  useHotkeys("ctrl+shift+f, meta+shift+f", viewFieldSummary, {
    preventDefault: true,
  });
  useHotkeys("ctrl+shift+s, meta+shift+s", saveDiagramAs, {
    preventDefault: true,
  });
  useHotkeys("ctrl+alt+c, meta+alt+c", copyAsImage, { preventDefault: true });
  useHotkeys("ctrl+r, meta+r", resetView, { preventDefault: true });
  useHotkeys("ctrl+h, meta+h", () => window.open("/shortcuts", "_blank"), {
    preventDefault: true,
  });
  useHotkeys("ctrl+alt+w, meta+alt+w", fitWindow, { preventDefault: true });

  return (
    <>
      {layout.header && header()}
      {layout.toolbar && toolbar()}
      <Modal
        modal={modal}
        exportData={exportData}
        setExportData={setExportData}
        title={title}
        setTitle={setTitle}
        setPrevTitle={setPrevTitle}
        setDiagramId={setDiagramId}
        setModal={setModal}
        prevTitle={prevTitle}
      />
      <Sidesheet
        type={sidesheet}
        onClose={() => setSidesheet(SIDESHEET.NONE)}
      />
    </>
  );

  function toolbar() {
    return (
      <div className="py-1.5 px-5 flex justify-between items-center rounded-xl my-1 sm:mx-1 xl:mx-6 select-none overflow-hidden toolbar-theme">
        <div className="flex justify-start items-center">
          <LayoutDropdown />
          <Divider layout="vertical" margin="8px" />
          <Dropdown
            style={{ width: "240px" }}
            position="bottomLeft"
            render={
              <Dropdown.Menu>
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
      default:
        return "";
    }
  }

  function header() {
    return (
      <nav className="flex justify-between pt-1 items-center whitespace-nowrap">
        <div className="flex justify-start items-center">
          <Link to="/">
            <img
              width={54}
              src={icon}
              alt="logo"
              className="ms-8 min-w-[54px]"
            />
          </Link>
          <div className="ms-1 mt-1">
            <div className="flex items-center">
              <div
                className="text-xl ms-3 me-1"
                onMouseEnter={() => setShowEditName(true)}
                onMouseLeave={() => setShowEditName(false)}
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
                    style={{ width: "240px" }}
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
                                  <IconChevronRight />
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
