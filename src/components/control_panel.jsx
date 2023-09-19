import { React, useContext, useState } from "react";
import {
  IconCaretdown,
  IconChevronRight,
  IconShareStroked,
  IconChevronUp,
  IconChevronDown,
  IconCheckboxTick,
  IconSaveStroked,
  IconUndo,
  IconRedo,
} from "@douyinfe/semi-icons";
import { Link } from "react-router-dom";
import icon from "../assets/icon_dark_64.png";
import {
  Avatar,
  AvatarGroup,
  Button,
  Divider,
  Dropdown,
  InputNumber,
  Image,
  Modal,
  Spin,
  Input,
  Upload,
  Banner,
  Toast,
} from "@douyinfe/semi-ui";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { saveAs } from "file-saver";
import {
  jsonDiagramIsValid,
  enterFullscreen,
  exitFullscreen,
  ddbDiagramIsValid,
  dataURItoBlob,
} from "../utils";
import {
  AreaContext,
  LayoutContext,
  NoteContext,
  SettingsContext,
  TableContext,
  UndoRedoContext,
} from "../pages/editor";
import { IconAddTable, IconAddArea, IconAddNote } from "./custom_icons";
import {
  defaultTableTheme,
  defaultNoteTheme,
  ObjectType,
  Action,
} from "../data/data";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import jsPDF from "jspdf";

export default function ControlPanel(props) {
  const MODAL = {
    NONE: 0,
    IMG: 1,
    CODE: 2,
    IMPORT: 3,
  };
  const ERROR = {
    NONE: 0,
    WARNING: 1,
    ERROR: 2,
    OK: 3,
  };
  const [visible, setVisible] = useState(MODAL.NONE);
  const [exportData, setExportData] = useState({
    data: "",
    filename: `diagram_${new Date().toISOString()}`,
    extension: "",
  });
  const [error, setError] = useState({
    type: ERROR.NONE,
    message: "",
  });
  const [data, setData] = useState(null);
  const { layout, setLayout } = useContext(LayoutContext);
  const { settings, setSettings } = useContext(SettingsContext);
  const { relationships, tables, setTables, setRelationships } =
    useContext(TableContext);
  const { notes, setNotes } = useContext(NoteContext);
  const { areas, setAreas } = useContext(AreaContext);
  const { undoStack, redoStack, setUndoStack, setRedoStack } =
    useContext(UndoRedoContext);

  const invertLayout = (component) =>
    setLayout((prev) => ({ ...prev, [component]: !prev[component] }));

  const diagramIsEmpty = () => {
    return (
      tables.length === 0 &&
      relationships.length === 0 &&
      notes.length === 0 &&
      areas.length === 0
    );
  };

  const overwriteDiagram = () => {
    setTables(data.tables);
    setRelationships(data.relationships);
    setAreas(data.subjectAreas);
    setNotes(data.notes);
  };

  const addTable = () => {
    setTables((prev) => [
      ...prev,
      {
        id: prev.length,
        name: `table_${prev.length}`,
        x: -settings.pan.x,
        y: -settings.pan.y,
        fields: [
          {
            name: "id",
            type: "UUID",
            default: "",
            check: "",
            primary: true,
            unique: true,
            notNull: true,
            increment: true,
            comment: "",
          },
        ],
        comment: "",
        indices: [],
        color: defaultTableTheme,
      },
    ]);
  };

  const addArea = () => {
    setAreas((prev) => [
      ...prev,
      {
        id: prev.length,
        name: `area_${prev.length}`,
        x: -settings.pan.x,
        y: -settings.pan.y,
        width: 200,
        height: 200,
        color: defaultTableTheme,
      },
    ]);
  };

  const addNote = () => {
    setNotes((prev) => [
      ...prev,
      {
        id: prev.length,
        x: -settings.pan.x,
        y: -settings.pan.y,
        title: `note_${prev.length}`,
        content: "",
        color: defaultNoteTheme,
        height: 88,
      },
    ]);
  };

  const moveTable = (id, x, y) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          setRelationships((prev) =>
            prev.map((r) => {
              if (r.startTableId === id) {
                return {
                  ...r,
                  startX: x + 15,
                  startY: y + r.startFieldId * 36 + 69,
                };
              } else if (r.endTableId === id) {
                return {
                  ...r,
                  endX: x + 15,
                  endY: y + r.endFieldId * 36 + 69,
                };
              }
              return r;
            })
          );
          return {
            ...t,
            x: x,
            y: y,
          };
        }
        return t;
      })
    );
  };

  const moveArea = (id, x, y) => {
    setAreas((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            x: x,
            y: y,
          };
        }
        return t;
      })
    );
  };

  const moveNote = (id, x, y) => {
    setNotes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            x: x,
            y: y,
          };
        }
        return t;
      })
    );
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const a = undoStack.pop();
    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        setTables((prev) =>
          prev
            .filter((e) => e.id !== prev.length - 1)
            .map((e, i) => ({ ...e, id: i }))
        );
      } else if (a.element === ObjectType.AREA) {
        setAreas((prev) =>
          prev
            .filter((e) => e.id !== prev.length - 1)
            .map((e, i) => ({ ...e, id: i }))
        );
      } else if (a.element === ObjectType.NOTE) {
        setNotes((prev) =>
          prev
            .filter((e) => e.id !== prev.length - 1)
            .map((e, i) => ({ ...e, id: i }))
        );
      } else if (a.element === ObjectType.RELATIONSHIP) {
        setRelationships((prev) =>
          prev
            .filter((e) => e.id !== a.data.id)
            .map((e, idx) => ({ ...e, id: idx }))
        );
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: tables[a.id].x, y: tables[a.id].y },
        ]);
        moveTable(a.id, a.x, a.y);
      } else if (a.element === ObjectType.AREA) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: areas[a.id].x, y: areas[a.id].y },
        ]);
        moveArea(a.id, a.x, a.y);
      } else if (a.element === ObjectType.NOTE) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: notes[a.id].x, y: notes[a.id].y },
        ]);
        moveNote(a.id, a.x, a.y);
      }
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        setTables((prev) => {
          const temp = prev.slice();
          temp.splice(a.data.id, 0, a.data);
          return temp.map((t, i) => ({ ...t, id: i }));
        });
      } else if (a.element === ObjectType.RELATIONSHIP) {
        setRelationships((prev) => {
          const temp = prev.slice();
          temp.splice(a.data.id, 0, a.data);
          return temp.map((t, i) => ({ ...t, id: i }));
        });
      }
      setRedoStack((prev) => [...prev, a]);
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const a = redoStack.pop();
    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        addTable();
      } else if (a.element === ObjectType.AREA) {
        addArea();
      } else if (a.element === ObjectType.NOTE) {
        addNote();
      } else if (a.element === ObjectType.RELATIONSHIP) {
        setRelationships((prev) => {
          const temp = prev.slice();
          temp.splice(a.data.id, 0, a.data);
          return temp.map((t, i) => ({ ...t, id: i }));
        });
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: tables[a.id].x, y: tables[a.id].y },
        ]);
        moveTable(a.id, a.x, a.y);
      } else if (a.element === ObjectType.AREA) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: areas[a.id].x, y: areas[a.id].y },
        ]);
        moveArea(a.id, a.x, a.y);
      } else if (a.element === ObjectType.NOTE) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: notes[a.id].x, y: notes[a.id].y },
        ]);
        moveNote(a.id, a.x, a.y);
      }
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        setTables((prev) =>
          prev
            .filter((t) => t.id !== a.data.id)
            .map((t, i) => ({ ...t, id: i }))
        );
      } else if (a.element === ObjectType.RELATIONSHIP) {
        setRelationships((prev) =>
          prev
            .filter((t) => t.id !== a.data.id)
            .map((t, i) => ({ ...t, id: i }))
        );
      }
      setUndoStack((prev) => [...prev, a]);
    }
  };

  const menu = {
    File: {
      New: {
        children: [],
        function: () => console.log("New"),
      },
      "New window": {
        children: [],
        function: () => {},
      },
      Save: {
        children: [],
        function: () => {},
      },
      "Save as": {
        children: [],
        function: () => {},
      },
      Share: {
        children: [],
        function: () => {},
      },
      Rename: {
        children: [],
        function: () => {},
      },
      Import: {
        children: [],
        function: () => {
          setVisible(MODAL.IMPORT);
        },
      },
      "Export as": {
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
              setVisible(MODAL.IMG);
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
                }
              );
              setVisible(MODAL.IMG);
            },
          },
          {
            JSON: () => {
              setVisible(MODAL.CODE);

              const result = JSON.stringify(
                {
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                },
                null,
                2
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
                }
              );
              setVisible(MODAL.IMG);
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
                  canvas.offsetHeight
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
                  project: "Untitled",
                  filename: "Untitled",
                  date: new Date().toISOString(),
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                },
                null,
                2
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
      "Export source": {
        children: [
          { MySQL: () => {} },
          { PostgreSQL: () => {} },
          { DBML: () => {} },
        ],
        function: () => {},
      },
      Properties: {
        children: [],
        function: () => {},
      },
      Close: {
        children: [],
        function: () => {},
      },
    },
    Edit: {
      Undo: {
        children: [],
        function: undo,
      },
      Redo: {
        children: [],
        function: redo,
      },
      Clear: {
        children: [],
        function: () => {
          setTables([]);
          setRelationships([]);
          setAreas([]);
          setNotes([]);
        },
      },
      Edit: {
        children: [],
        function: () => {},
      },
      Cut: {
        children: [],
        function: () => {},
      },
      Copy: {
        children: [],
        function: () => {},
      },
      Paste: {
        children: [],
        function: () => {},
      },
      Duplicate: {
        children: [],
        function: () => {},
      },
      Delete: {
        children: [],
        function: () => {},
      },
      "Copy as image": {
        children: [],
        function: () => {
          toPng(document.getElementById("canvas")).then(function (dataUrl) {
            const blob = dataURItoBlob(dataUrl);
            navigator.clipboard
              .write([new ClipboardItem({ "image/png": blob })])
              .then(() => {
                Toast.success("Copied to clipboard.");
              })
              .catch((error) => {
                Toast.error("Could not copy to clipboard.");
              });
          });
        },
      },
    },
    View: {
      Header: {
        children: [],
        function: () =>
          setLayout((prev) => ({ ...prev, header: !prev.header })),
      },
      Sidebar: {
        children: [],
        function: () =>
          setLayout((prev) => ({ ...prev, sidebar: !prev.sidebar })),
      },
      Issues: {
        children: [],
        function: () =>
          setLayout((prev) => ({ ...prev, issues: !prev.issues })),
      },
      Services: {
        children: [],
        function: () =>
          setLayout((prev) => ({ ...prev, services: !prev.services })),
      },
      "Strict mode": {
        children: [],
        function: () => {
          setSettings((prev) => ({ ...prev, strictMode: !prev.strictMode }));
          Toast.success(`Stict mode is ${settings.strictMode ? "on" : "off"}.`);
        },
      },
      "Field summary": {
        children: [],
        function: () => {
          setSettings((prev) => ({
            ...prev,
            showFieldSummary: !prev.showFieldSummary,
          }));
          Toast.success(
            `Field summary is ${settings.showFieldSummary ? "off" : "on"}.`
          );
        },
      },
      "Reset view": {
        children: [],
        function: () => {},
      },
      "View schema": {
        children: [],
        function: () => {},
      },
      Grid: {
        children: [],
        function: () =>
          setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid })),
      },
      Theme: {
        children: [{ Light: () => {} }, { Dark: () => {} }],
        function: () => {},
      },
      "Zoom in": {
        children: [],
        function: () =>
          setSettings((prev) => ({ ...prev, zoom: prev.zoom * 1.2 })),
      },
      "Zoom out": {
        children: [],
        function: () =>
          setSettings((prev) => ({ ...prev, zoom: prev.zoom / 1.2 })),
      },
      Fullscreen: {
        children: [],
        function: enterFullscreen,
      },
    },
    Logs: {
      "Open logs": {
        children: [],
        function: () => {},
      },
      "Commit changes": {
        children: [],
        function: () => {},
      },
      "Revert changes": {
        children: [],
        function: () => {},
      },
      "View commits": {
        children: [],
        function: () => {},
      },
    },
    Help: {
      Shortcuts: {
        children: [],
        function: () => {},
      },
      "Ask us on discord": {
        children: [],
        function: () => {},
      },
      "Tweet us": {
        children: [],
        function: () => {},
      },
      "Found a bug": {
        children: [],
        function: () => {},
      },
    },
  };

  return (
    <div>
      {layout.header && header()}
      <div className="py-1 px-5 flex justify-between items-center rounded-xl bg-slate-100 my-1 sm:mx-1 md:mx-6 text-slate-700 select-none overflow-x-hidden">
        <div className="flex justify-start items-center">
          {layoutDropdown()}
          <Divider layout="vertical" margin="8px" />
          <Dropdown
            style={{ width: "180px" }}
            position="bottomLeft"
            render={
              <Dropdown.Menu>
                <Dropdown.Item>Fit window</Dropdown.Item>
                <Dropdown.Divider />
                {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((e, i) => (
                  <Dropdown.Item
                    key={i}
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, zoom: e }));
                    }}
                  >
                    {Math.floor(e * 100)}%
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item>
                  <InputNumber
                    field="zoom"
                    label="Custom zoom"
                    placeholder="Zoom"
                    suffix={<div className="p-1">%</div>}
                    onChange={(v) =>
                      setSettings((prev) => ({
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
            <div className="py-1 px-2 hover:bg-slate-200 rounded flex items-center justify-center">
              <div className="w-[40px]">{Math.floor(settings.zoom * 100)}%</div>
              <div>
                <IconCaretdown />
              </div>
            </div>
          </Dropdown>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded text-lg"
            title="Zoom in"
            onClick={() =>
              setSettings((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }))
            }
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded text-lg"
            title="Zoom out"
            onClick={() =>
              setSettings((prev) => ({ ...prev, zoom: prev.zoom / 1.2 }))
            }
          >
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <Divider layout="vertical" margin="8px" />
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Undo"
            onClick={undo}
          >
            <IconUndo
              size="large"
              style={{ color: undoStack.length === 0 ? "#9598a6" : "" }}
            />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Redo"
            onClick={redo}
          >
            <IconRedo
              size="large"
              style={{ color: redoStack.length === 0 ? "#9598a6" : "" }}
            />
          </button>
          <Divider layout="vertical" margin="8px" />
          <button
            className="flex items-center py-1 px-2 hover:bg-slate-200 rounded"
            title="Add new table"
            onClick={() => {
              addTable();
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.ADD,
                  element: ObjectType.TABLE,
                },
              ]);
              setRedoStack([]);
            }}
          >
            <IconAddTable />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Add subject area"
            onClick={() => {
              addArea();
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.ADD,
                  element: ObjectType.AREA,
                },
              ]);
              setRedoStack([]);
            }}
          >
            <IconAddArea />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Add new note"
            onClick={() => {
              addNote();
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.ADD,
                  element: ObjectType.NOTE,
                },
              ]);
              setRedoStack([]);
            }}
          >
            <IconAddNote />
          </button>
          <Divider layout="vertical" margin="8px" />
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Save"
          >
            <IconSaveStroked size="extra-large" />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded text-xl"
            title="Commit"
          >
            <i className="fa-solid fa-code-branch"></i>
          </button>
        </div>
        <button
          onClick={() => invertLayout("header")}
          className="flex items-center"
        >
          {layout.header ? <IconChevronUp /> : <IconChevronDown />}
        </button>
      </div>
      <Modal
        title={`${visible === MODAL.IMPORT ? "Import" : "Export"} diagram`}
        visible={visible !== MODAL.NONE}
        onOk={() => {
          if (visible === MODAL.IMG) {
            saveAs(
              exportData.data,
              `${exportData.filename}.${exportData.extension}`
            );
          } else if (visible === MODAL.CODE) {
            const blob = new Blob([exportData.data], {
              type: "application/json",
            });
            saveAs(blob, `${exportData.filename}.${exportData.extension}`);
          } else if (visible === MODAL.IMPORT) {
            if (error.type !== ERROR.ERROR) {
              setSettings((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
              overwriteDiagram();
              setData(null);
              setVisible(MODAL.NONE);
              setUndoStack([]);
              setRedoStack([]);
            }
          }
        }}
        afterClose={() => {
          setExportData((prev) => ({
            data: "",
            extension: "",
            filename: `diagram_${new Date().toISOString()}`,
          }));
          setError({
            type: ERROR.NONE,
            message: "",
          });
          setData(null);
        }}
        onCancel={() => setVisible(MODAL.NONE)}
        centered
        closeOnEsc={true}
        okText={`${visible === MODAL.IMPORT ? "Import" : "Export"}`}
        okButtonProps={{
          disabled:
            (visible === MODAL.IMPORT &&
              (error.type === ERROR.ERROR || !data)) ||
            ((visible === MODAL.IMG || visible === MODAL.CODE) &&
              !exportData.data),
        }}
        cancelText="Cancel"
        width={520}
      >
        {visible === MODAL.IMPORT ? (
          <div>
            <Upload
              action="#"
              beforeUpload={({ file, fileList }) => {
                const f = fileList[0].fileInstance;
                if (!f) {
                  return;
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                  let jsonObject = null;
                  try {
                    jsonObject = JSON.parse(event.target.result);
                  } catch (error) {
                    setError({
                      type: ERROR.ERROR,
                      message: "The file contains an error.",
                    });
                    return;
                  }
                  if (f.type === "application/json") {
                    if (!jsonDiagramIsValid(jsonObject)) {
                      setError({
                        type: ERROR.ERROR,
                        message:
                          "The file is missing necessary properties for a diagram.",
                      });
                      return;
                    }
                  } else if (f.name.split(".").pop() === "ddb") {
                    if (!ddbDiagramIsValid(jsonObject)) {
                      setError({
                        type: ERROR.ERROR,
                        message:
                          "The file is missing necessary properties for a diagram.",
                      });
                      return;
                    }
                  }
                  setData(jsonObject);
                  if (diagramIsEmpty()) {
                    setError({
                      type: ERROR.OK,
                      message: "Everything looks good. You can now import.",
                    });
                  } else {
                    setError({
                      type: ERROR.WARNING,
                      message:
                        "The current diagram is not empty. Importing a new diagram will overwrite the current changes.",
                    });
                  }
                };
                reader.readAsText(f);

                return {
                  autoRemove: false,
                  fileInstance: file.fileInstance,
                  status: "success",
                  shouldUpload: false,
                };
              }}
              draggable={true}
              dragMainText="Click to upload the file or drag and drop the file here"
              dragSubText="Support json"
              accept="application/json,.ddb"
              onRemove={() =>
                setError({
                  type: ERROR.NONE,
                  message: "",
                })
              }
              onFileChange={() =>
                setError({
                  type: ERROR.NONE,
                  message: "",
                })
              }
              limit={1}
            ></Upload>
            {error.type === ERROR.ERROR ? (
              <Banner
                type="danger"
                fullMode={false}
                description={
                  <div className="text-red-800">{error.message}</div>
                }
              />
            ) : error.type === ERROR.OK ? (
              <Banner
                type="info"
                fullMode={false}
                description={<div>{error.message}</div>}
              />
            ) : (
              error.type === ERROR.WARNING && (
                <Banner
                  type="warning"
                  fullMode={false}
                  description={<div>{error.message}</div>}
                />
              )
            )}
          </div>
        ) : exportData.data !== "" || exportData.data ? (
          <>
            {visible === MODAL.IMG ? (
              <Image src={exportData.data} alt="Diagram" height={220} />
            ) : (
              <div className="max-h-[400px] overflow-auto border border-gray-200">
                <CodeMirror
                  value={exportData.data}
                  extensions={[json()]}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}
            <div className="text-sm font-semibold mt-2">Filename:</div>
            <Input
              value={exportData.filename}
              placeholder="Filename"
              suffix={<div className="p-2">{`.${exportData.extension}`}</div>}
              onChange={(value) =>
                setExportData((prev) => ({ ...prev, filename: value }))
              }
              field="filename"
            />
          </>
        ) : (
          <div className="text-center my-3">
            <Spin tip="Loading..." size="large" />
          </div>
        )}
      </Modal>
    </div>
  );

  function header() {
    return (
      <nav className="flex justify-between pt-1 items-center whitespace-nowrap">
        <div className="flex justify-start items-center text-slate-800">
          <Link to="/">
            <img
              width={54}
              src={icon}
              alt="logo"
              className="ms-8 min-w-[54px]"
            />
          </Link>
          <div className="ms-1 mt-1">
            <div className="text-xl ms-3">Project1 / Untitled</div>
            <div className="flex justify-between items-center">
              <div className="flex justify-start text-md select-none me-2">
                {Object.keys(menu).map((category) => (
                  <Dropdown
                    key={category}
                    position="bottomLeft"
                    style={{ width: "200px" }}
                    render={
                      <Dropdown.Menu>
                        {Object.keys(menu[category]).map((item, index) => {
                          if (menu[category][item].children.length > 0) {
                            return (
                              <Dropdown
                                style={{ width: "120px" }}
                                key={item}
                                position={"rightTop"}
                                render={
                                  <Dropdown.Menu>
                                    {menu[category][item].children.map(
                                      (e, i) => (
                                        <Dropdown.Item
                                          key={i}
                                          onClick={Object.values(e)[0]}
                                        >
                                          {Object.keys(e)[0]}
                                        </Dropdown.Item>
                                      )
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
                                  {item}
                                  <IconChevronRight />
                                </Dropdown.Item>
                              </Dropdown>
                            );
                          }
                          return (
                            <Dropdown.Item
                              key={index}
                              onClick={menu[category][item].function}
                            >
                              {item}
                            </Dropdown.Item>
                          );
                        })}
                      </Dropdown.Menu>
                    }
                  >
                    <div className="px-3 py-1 hover:bg-gray-100 rounded">
                      {category}
                    </div>
                  </Dropdown>
                ))}
              </div>
              <Button size="small" type="tertiary">
                Last saved {new Date().toISOString()}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-around items-center text-md me-8">
          <AvatarGroup maxCount={3} size="default">
            <Avatar color="red" alt="Lisa LeBlanc">
              LL
            </Avatar>
            <Avatar color="green" alt="Caroline Xiao">
              CX
            </Avatar>
            <Avatar color="amber" alt="Rafal Matin">
              RM
            </Avatar>
            <Avatar alt="Zank Lance">ZL</Avatar>
            <Avatar alt="Youself Zhang">YZ</Avatar>
          </AvatarGroup>
          <Button
            type="primary"
            style={{
              fontSize: "16px",
              marginLeft: "12px",
              marginRight: "12px",
            }}
            size="large"
            icon={<IconShareStroked />}
          >
            Share
          </Button>
          <Avatar size="default" alt="Buni Zhang">
            BZ
          </Avatar>
        </div>
      </nav>
    );
  }

  function layoutDropdown() {
    return (
      <Dropdown
        position="bottomLeft"
        style={{ width: "180px" }}
        render={
          <Dropdown.Menu>
            <Dropdown.Item
              icon={
                layout.header ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() => invertLayout("header")}
            >
              Header
            </Dropdown.Item>
            <Dropdown.Item
              icon={
                layout.sidebar ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() => invertLayout("sidebar")}
            >
              Sidebar
            </Dropdown.Item>
            <Dropdown.Item
              icon={
                layout.issues ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() => invertLayout("issues")}
            >
              Issues
            </Dropdown.Item>

            <Dropdown.Item
              icon={
                layout.services ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() => invertLayout("services")}
            >
              Services
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              icon={
                layout.fullscreen ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() => {
                if (layout.fullscreen) {
                  exitFullscreen();
                } else {
                  enterFullscreen();
                }
                invertLayout("fullscreen");
              }}
            >
              Fullscreen
            </Dropdown.Item>
          </Dropdown.Menu>
        }
        trigger="click"
      >
        <div className="py-1 px-2 hover:bg-slate-200 rounded flex items-center justify-center">
          <div>
            <i className="fa-solid fa-table-list text-xl me-1"></i>
          </div>
          <div>
            <IconCaretdown />
          </div>
        </div>
      </Dropdown>
    );
  }
}
