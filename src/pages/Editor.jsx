import { useState, createContext, useEffect } from "react";
import ControlPanel from "../components/ControlPanel";
import Canvas from "../components/Canvas";
import SidePanel from "../components/SidePanel";
import {
  Tab,
  defaultTableTheme,
  defaultNoteTheme,
  Action,
  ObjectType,
  State,
} from "../data/data";
import { db } from "../data/db";
import { Divider, Tooltip } from "@douyinfe/semi-ui";
import { exitFullscreen } from "../utils";

export const LayoutContext = createContext();
export const TableContext = createContext();
export const AreaContext = createContext();
export const TabContext = createContext();
export const NoteContext = createContext();
export const SettingsContext = createContext();
export const UndoRedoContext = createContext();
export const SelectContext = createContext();
export const TaskContext = createContext();
export const MessageContext = createContext();
export const BotMessageContext = createContext();
export const TypeContext = createContext();

export default function Editor() {
  const [id, setId] = useState(0);
  const [title, setTitle] = useState("Untitled Diagram");
  const [state, setState] = useState(State.NONE);
  const [lastSaved, setLastSaved] = useState("");
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [areas, setAreas] = useState([]);
  const [notes, setNotes] = useState([]);
  const [types, setTypes] = useState([]);
  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(340);
  const [tab, setTab] = useState(Tab.tables);
  const [layout, setLayout] = useState({
    header: true,
    sidebar: true,
    services: true,
    issues: true,
    toolbar: true,
    fullscreen: false,
  });
  const [settings, setSettings] = useState({
    strictMode: false,
    showFieldSummary: true,
    zoom: 1,
    pan: { x: 0, y: 0 },
    showGrid: true,
    mode: "light",
    autosave: true,
    panning: true,
    showCardinality: true,
  });
  const [tasks, setTasks] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedElement, setSelectedElement] = useState({
    element: ObjectType.NONE,
    id: -1,
    openDialogue: false,
    openCollapse: false,
  });

  const dragHandler = (e) => {
    if (!resize) return;
    const w = e.clientX;
    if (w > 340) setWidth(w);
  };

  const addTable = (addToHistory = true, data) => {
    if (data) {
      setTables((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
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
              type: "INT",
              default: "",
              check: "",
              primary: true,
              unique: true,
              notNull: true,
              increment: true,
              comment: "",
              id: 0,
            },
          ],
          comment: "",
          indices: [],
          color: defaultTableTheme,
        },
      ]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.TABLE,
          message: `Add new table`,
        },
      ]);
      setRedoStack([]);
    }
  };

  const addType = (addToHistory = true, data) => {
    if (data) {
      setTypes((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp;
      });
    } else {
      setTypes((prev) => [
        ...prev,
        {
          name: `type_${prev.length}`,
          fields: [],
          comment: "",
        },
      ]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.TYPE,
          message: `Add new type`,
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteType = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TYPE,
          id: id,
          data: types[id],
          message: `Delete type`,
        },
      ]);
      setRedoStack([]);
    }
    setTypes((prev) => prev.filter((e, i) => i !== id));
  };

  const updateType = (id, values) => {
    setTypes((prev) =>
      prev.map((e, i) => (i === id ? { ...e, ...values } : e))
    );
  };

  const updateField = (tid, fid, updatedValues) => {
    setTables((prev) =>
      prev.map((table, i) => {
        if (tid === i) {
          return {
            ...table,
            fields: table.fields.map((field, j) =>
              fid === j ? { ...field, ...updatedValues } : field
            ),
          };
        }
        return table;
      })
    );
  };

  const addArea = (addToHistory = true, data) => {
    if (data) {
      setAreas((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
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
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.AREA,
          message: `Add new subject area`,
        },
      ]);
      setRedoStack([]);
    }
  };

  const addNote = (addToHistory = true, data) => {
    if (data) {
      setNotes((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
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
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.NOTE,
          message: `Add new note`,
        },
      ]);
      setRedoStack([]);
    }
  };

  const addRelationship = (addToHistory = true, data) => {
    if (addToHistory) {
      setRelationships((prev) => {
        setUndoStack((prevUndo) => [
          ...prevUndo,
          {
            action: Action.ADD,
            element: ObjectType.RELATIONSHIP,
            data: data,
            message: `Add new relationship`,
          },
        ]);
        setRedoStack([]);
        return [...prev, data];
      });
    } else {
      setRelationships((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    }
  };

  const deleteTable = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TABLE,
          data: tables[id],
          message: `Delete table`,
        },
      ]);
      setRedoStack([]);
    }
    setTables((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }))
    );
    setRelationships((prev) =>
      prev
        .filter((e) => e.startTableId !== id && e.endTableId !== id)
        .map((e, i) => ({ ...e, id: i }))
    );
    if (id === selectedElement.id) {
      setSelectedElement({
        element: ObjectType.NONE,
        id: -1,
        openDialogue: false,
        openCollapse: false,
      });
    }
  };

  const deleteArea = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.AREA,
          data: areas[id],
          message: `Delete subject area`,
        },
      ]);
      setRedoStack([]);
    }
    setAreas((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }))
    );
    if (id === selectedElement.id) {
      setSelectedElement({
        element: ObjectType.NONE,
        id: -1,
        openDialogue: false,
        openCollapse: false,
      });
    }
  };

  const deleteNote = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.NOTE,
          data: notes[id],
          message: `Delete note`,
        },
      ]);
      setRedoStack([]);
    }
    setNotes((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }))
    );
    if (id === selectedElement.id) {
      setSelectedElement({
        element: ObjectType.NONE,
        id: -1,
        openDialogue: false,
        openCollapse: false,
      });
    }
  };

  const deleteRelationship = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.RELATIONSHIP,
          data: relationships[id],
          message: `Delete relationship`,
        },
      ]);
      setRedoStack([]);
    }
    setRelationships((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }))
    );
  };

  const updateArea = (id, values) => {
    setAreas((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...values,
          };
        }
        return t;
      })
    );
  };

  const updateNote = (id, values) => {
    setNotes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...values,
          };
        }
        return t;
      })
    );
  };

  const updateTable = (id, updatedValues, updateRelationships = false) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === id) {
          if (updateRelationships) {
            setRelationships((prev) =>
              prev.map((r) => {
                if (r.startTableId === id) {
                  return {
                    ...r,
                    startX: updatedValues.x + 15,
                    startY: updatedValues.y + r.startFieldId * 36 + 69,
                  };
                } else if (r.endTableId === id) {
                  return {
                    ...r,
                    endX: updatedValues.x + 15,
                    endY: updatedValues.y + r.endFieldId * 36 + 69,
                  };
                }
                return r;
              })
            );
          }
          return {
            ...table,
            ...updatedValues,
          };
        }
        return table;
      })
    );
  };

  const updateTask = (id, values) =>
    setTasks((prev) =>
      prev.map((task, i) => (id === i ? { ...task, ...values } : task))
    );

  useEffect(() => {
    if (
      tables.length === 0 &&
      areas.length === 0 &&
      notes.length === 0 &&
      types.length === 0
    )
      return;

    if (settings.autosave) {
      setState(State.SAVING);
    }
  }, [
    undoStack,
    redoStack,
    settings.autosave,
    tables.length,
    areas.length,
    notes.length,
    types.length,
    relationships.length
  ]);

  useEffect(() => {
    const save = async (diagram = true) => {
      if (state !== State.SAVING) {
        return;
      }
      if (diagram) {
        if (
          (id === 0 && window.name === "") ||
          window.name.split(" ")[0] === "lt"
        ) {
          db.diagrams
            .add({
              name: title,
              lastModified: new Date(),
              tables: tables,
              references: relationships,
              types: types,
              notes: notes,
              areas: areas,
            })
            .then((id) => {
              setId(id);
              window.name = `d ${id}`;
              setState(State.SAVED);
              setLastSaved(new Date().toLocaleString());
            });
        } else {
          db.diagrams
            .update(id, {
              name: title,
              lastModified: new Date(),
              tables: tables,
              references: relationships,
              types: types,
              notes: notes,
              areas: areas,
            })
            .then(() => {
              setState(State.SAVED);
              setLastSaved(new Date().toLocaleString());
            });
        }
      } else {
        db.templates
          .update(id, {
            title: title,
            tables: tables,
            relationships: relationships,
            types: types,
            notes: notes,
            subjectAreas: areas,
          })
          .then(() => {
            setState(State.SAVED);
            setLastSaved(new Date().toLocaleString());
          })
          .catch(() => {
            setState(State.ERROR);
          });
      }
    };
    const name = window.name.split(" ");
    const op = name[0];
    const diagram = window.name === "" || op === "d" || op === "lt";

    save(diagram);
  }, [tables, relationships, notes, areas, types, title, id, state]);

  useEffect(() => {
    document.title = "Editor | drawDB";

    const loadLatestDiagram = () => {
      db.diagrams
        .orderBy("lastModified")
        .last()
        .then((d) => {
          if (d) {
            setId(d.id);
            setTables(d.tables);
            setRelationships(d.references);
            setNotes(d.notes);
            setAreas(d.areas);
            setTypes(d.types);
            window.name = `d ${d.id}`;
          } else {
            window.name = "";
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    const loadDiagram = (id) => {
      db.diagrams
        .get(id)
        .then((diagram) => {
          if (diagram) {
            setId(diagram.id);
            setTitle(diagram.name);
            setTables(diagram.tables);
            setTypes(diagram.types);
            setRelationships(diagram.references);
            setAreas(diagram.areas);
            setNotes(diagram.notes);
            setUndoStack([]);
            setRedoStack([]);
            window.name = `d ${diagram.id}`;
          } else {
            window.name = "";
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    const loadTemplate = (id) => {
      db.templates
        .get(id)
        .then((diagram) => {
          if (diagram) {
            setId(diagram.id);
            setTitle(diagram.title);
            setTables(diagram.tables);
            setTypes(diagram.types);
            setRelationships(diagram.relationships);
            setAreas(diagram.subjectAreas);
            setNotes(diagram.notes);
            setUndoStack([]);
            setRedoStack([]);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    if (window.name == "") {
      console.log("Loading the latest diagram");
      loadLatestDiagram();
    } else {
      const name = window.name.split(" ");
      const op = name[0];
      const did = parseInt(name[1]);
      switch (op) {
        case "d": {
          loadDiagram(did);
          break;
        }
        case "lt": {
          loadTemplate(did);
          break;
        }
        case "t": {
          loadTemplate(did);
          break;
        }
        default:
          break;
      }
    }

    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setSettings((prev) => ({ ...prev, mode: "dark" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "dark");
      }
    } else {
      setSettings((prev) => ({ ...prev, mode: "light" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "light");
      }
    }
  }, []);

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      <TableContext.Provider
        value={{
          tables,
          setTables,
          addTable,
          updateTable,
          updateField,
          deleteTable,
          relationships,
          setRelationships,
          addRelationship,
          deleteRelationship,
        }}
      >
        <AreaContext.Provider
          value={{ areas, setAreas, updateArea, addArea, deleteArea }}
        >
          <NoteContext.Provider
            value={{ notes, setNotes, updateNote, addNote, deleteNote }}
          >
            <TabContext.Provider value={{ tab, setTab }}>
              <SettingsContext.Provider value={{ settings, setSettings }}>
                <UndoRedoContext.Provider
                  value={{ undoStack, redoStack, setUndoStack, setRedoStack }}
                >
                  <SelectContext.Provider
                    value={{ selectedElement, setSelectedElement }}
                  >
                    <TaskContext.Provider
                      value={{ tasks, setTasks, updateTask }}
                    >
                      <TypeContext.Provider
                        value={{
                          types,
                          setTypes,
                          addType,
                          updateType,
                          deleteType,
                        }}
                      >
                        <div className="h-[100vh] flex flex-col overflow-hidden theme">
                          <ControlPanel
                            diagramId={id}
                            setDiagramId={setId}
                            title={title}
                            setTitle={setTitle}
                            state={state}
                            setState={setState}
                            lastSaved={lastSaved}
                            setLastSaved={setLastSaved}
                          />
                          <div
                            className="flex h-full"
                            onMouseUp={() => setResize(false)}
                            onMouseMove={dragHandler}
                          >
                            {layout.sidebar && (
                              <SidePanel
                                resize={resize}
                                setResize={setResize}
                                width={width}
                              />
                            )}
                            <div className="relative w-full h-full">
                              <Canvas state={state} setState={setState} />
                              {
                                !(layout.sidebar || layout.toolbar || layout.header) &&
                                <div className="fixed right-5 bottom-4 flex gap-2">
                                  <div className="popover-theme flex rounded-lg items-center">
                                    <button
                                      className="px-3 py-2"
                                      onClick={() =>
                                        setSettings((prev) => ({ ...prev, zoom: prev.zoom / 1.2 }))
                                      }>
                                      <i className="bi bi-dash-lg"></i>
                                    </button>
                                    <Divider align="center" layout="vertical" />
                                    <div className="px-3 py-2">{parseInt(settings.zoom * 100)}%</div>
                                    <Divider align="center" layout="vertical" />
                                    <button
                                      className="px-3 py-2"
                                      onClick={() =>
                                        setSettings((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }))
                                      }>
                                      <i className="bi bi-plus-lg"></i>
                                    </button>
                                  </div>
                                  <Tooltip content="Exit">
                                    <button
                                      className="px-3 py-2 rounded-lg popover-theme"
                                      onClick={() => {
                                        setLayout(prev => ({
                                          ...prev,
                                          sidebar: true,
                                          toolbar: true,
                                          header: true,
                                        }));
                                        exitFullscreen();
                                      }}
                                    >
                                      <i className="bi bi-fullscreen-exit"></i>
                                    </button>
                                  </Tooltip>
                                </div>
                              }
                            </div>
                          </div>
                        </div>
                      </TypeContext.Provider>
                    </TaskContext.Provider>
                  </SelectContext.Provider>
                </UndoRedoContext.Provider>
              </SettingsContext.Provider>
            </TabContext.Provider>
          </NoteContext.Provider>
        </AreaContext.Provider>
      </TableContext.Provider>
    </LayoutContext.Provider>
  );
}
