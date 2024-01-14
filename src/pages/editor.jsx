import { useState, createContext, useEffect } from "react";

import ControlPanel from "../components/ControlPanel";
import Canvas from "../components/Canvas";
import SidePanel from "../components/SidePanel";
import {
  Tab,
  defaultTableTheme,
  defaultNoteTheme,
  // avatarThemes,
  Action,
  ObjectType,
  State,
} from "../data/data";
import { socket } from "../data/socket";
import { db } from "../data/db";
// import { flipAction } from "../utils";
// import { uniqueNamesGenerator, colors, animals } from "unique-names-generator";

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
    tables: true,
    areas: true,
    relationships: true,
    issues: true,
    editor: true,
    notes: true,
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
  const [historyCount, setHistoryCount] = useState(0);
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
    if (socket) {
      if (historyCount < undoStack.length) {
        socket.emit("send-changes", undoStack[undoStack.length - 1]);
      }
    }
  }, [undoStack, historyCount]);

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

    socket.connect();

    // const onConnect = () => {
    //   const name = uniqueNamesGenerator({
    //     dictionaries: [colors, animals],
    //     separator: " ",
    //     style: "capital",
    //   });
    //   const color =
    //     avatarThemes[Math.floor(Math.random() * avatarThemes.length)];
    //   socket.emit("new-user", name, color);
    //   setMessages((prev) => [
    //     ...prev,
    //     { message: `You joined as ${name}`, type: "note", action: "join" },
    //   ]);
    // };
    // const onRecieve = (value) =>
    //   setMessages((prev) => [{ ...value, type: "message" }, ...prev]);
    // const onUserConnected = (name) =>
    //   setMessages((prev) => [
    //     { message: `${name} just joined`, type: "note", action: "join" },
    //     ...prev,
    //   ]);
    // const onUserDisconnected = (name) =>
    //   setMessages((prev) => [
    //     { message: `${name} left`, type: "note", action: "leave" },
    //     ...prev,
    //   ]);

    // socket.on("connect", onConnect);
    // socket.on("recieve-message", onRecieve);
    // socket.on("user-connected", onUserConnected);
    // socket.on("user-disconnected", onUserDisconnected);

    const applyChange = (delta) => {
      // console.log("apply: ", delta)
      if (!delta) return;
      if (delta.action === Action.ADD) {
        switch (delta.element) {
          case ObjectType.TABLE:
            addTable(false);
            return;
          case ObjectType.AREA:
            addArea(false);
            return;
          case ObjectType.NOTE:
            addNote(false);
            return;
          case ObjectType.RELATIONSHIP:
            addRelationship(false, delta.data);
            return;
          case ObjectType.TYPE:
            addType(false);
            return;
        }
      } else if (delta.action === Action.MOVE) {
        switch (delta.element) {
          case ObjectType.TABLE:
            updateTable(delta.id, { x: delta.toX, y: delta.toY }, true);
            return;
          case ObjectType.AREA:
            updateArea(delta.id, { x: delta.toX, y: delta.toY });
            return;
          case ObjectType.NOTE:
            updateNote(delta.id, { x: delta.toX, y: delta.toY });
            return;
        }
      } else if (delta.action === Action.DELETE) {
        switch (delta.element) {
          case ObjectType.TABLE:
            deleteTable(delta.data.id, false);
            return;
          case ObjectType.RELATIONSHIP:
            deleteRelationship(delta.data.id, false);
            return;
          case ObjectType.AREA:
            deleteArea(delta.data.id, false);
            return;
          case ObjectType.NOTE:
            deleteNote(delta.data.id, false);
            return;
          case ObjectType.TYPE:
            deleteType(delta.id, false);
            return;
        }
      } else if (delta.action === Action.EDIT) {
        switch (delta.element) {
          case ObjectType.AREA:
            updateArea(delta.aid, delta.redo);
            return;
          case ObjectType.RELATIONSHIP:
            setRelationships((prev) =>
              prev.map((e, idx) =>
                idx === delta.rid ? { ...e, ...delta.redo } : e
              )
            );
            return;
          case ObjectType.NOTE:
            updateNote(delta.nid, delta.redo);
            return;
          case ObjectType.TABLE:
            if (delta.component === "field") {
              updateField(delta.tid, delta.fid, delta.redo);
            } else if (delta.component === "field_delete") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    setRelationships((prev) => {
                      return prev.map((e) => {
                        if (
                          e.startTableId === delta.tid &&
                          e.startFieldId > delta.data.id
                        ) {
                          return {
                            ...e,
                            startFieldId: e.startFieldId - 1,
                            startX: t.x + 15,
                            startY: t.y + (e.startFieldId - 1) * 36 + 50 + 19,
                          };
                        }
                        if (
                          e.endTableId === delta.tid &&
                          e.endFieldId > delta.data.id
                        ) {
                          return {
                            ...e,
                            endFieldId: e.endFieldId - 1,
                            endX: t.x + 15,
                            endY: t.y + (e.endFieldId - 1) * 36 + 50 + 19,
                          };
                        }
                        return e;
                      });
                    });
                    return {
                      ...t,
                      fields: t.fields
                        .filter((field) => field.id !== delta.data.id)
                        .map((e, i) => ({ ...e, id: i })),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "field_add") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    return {
                      ...t,
                      fields: [
                        ...t.fields,
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
                          id: t.fields.length,
                        },
                      ],
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "index_add") {
              setTables((prev) =>
                prev.map((table) => {
                  if (table.id === delta.tid) {
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
                })
              );
            } else if (delta.component === "index") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    return {
                      ...t,
                      indices: t.indices.map((index) =>
                        index.id === delta.iid
                          ? {
                            ...index,
                            ...delta.redo,
                          }
                          : index
                      ),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "index_delete") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    return {
                      ...t,
                      indices: t.indices
                        .filter((e) => e.id !== delta.data.id)
                        .map((x, i) => ({ ...x, id: i })),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "self") {
              updateTable(delta.tid, delta.redo, false);
            }
            return;
          case ObjectType.TYPE:
            if (delta.component === "field") {
              setTypes((prev) =>
                prev.map((t, i) => {
                  if (i === delta.tid) {
                    return {
                      ...t,
                      fields: t.fields.map((e, j) =>
                        j === delta.fid ? { ...e, ...delta.redo } : e
                      ),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "field_add") {
              setTypes((prev) =>
                prev.map((t, i) => {
                  if (i === delta.tid) {
                    return {
                      ...t,
                      fields: [...t.fields, { name: "", type: "" }],
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "field_delete") {
              setTypes((prev) =>
                prev.map((t, i) => {
                  if (i === delta.tid) {
                    return {
                      ...t,
                      fields: t.fields.filter((field, j) => j !== delta.fid),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "self") {
              updateType(delta.tid, delta.redo);
            }
            return;
        }
      }
    };

    const reverseChange = (delta) => {
      // console.log("reverse: ", delta);
      if (delta.action === Action.ADD) {
        switch (delta.element) {
          case ObjectType.TABLE:
            setTables(prev => prev.filter((e, i) => i !== prev.length - 1));
            return;
          case ObjectType.RELATIONSHIP:
            setRelationships(prev => prev.filter((e, i) => i !== prev.length - 1));
            return;
          case ObjectType.AREA:
            setAreas(prev => prev.filter((e, i) => i !== prev.length - 1));
            return;
          case ObjectType.NOTE:
            setNotes(prev => prev.filter((e, i) => i !== prev.length - 1));
            return;
          case ObjectType.TYPE:
            setTypes(prev => prev.filter((e, i) => i !== prev.length - 1));
            return;
        }
      } else if (delta.action === Action.MOVE) {
        switch (delta.element) {
          case ObjectType.TABLE:
            updateTable(delta.id, { x: delta.x, y: delta.y }, true);
            return;
          case ObjectType.AREA:
            updateArea(delta.id, { x: delta.x, y: delta.y });
            return;
          case ObjectType.NOTE:
            updateNote(delta.id, { x: delta.x, y: delta.y });
            return;
        }
      } else if (delta.action === Action.DELETE) {
        switch (delta.element) {
          case ObjectType.TABLE:
            addTable(false, delta.data);
            return;
          case ObjectType.AREA:
            addArea(false, delta.data);
            return;
          case ObjectType.NOTE:
            addNote(false, delta.data);
            return;
          case ObjectType.RELATIONSHIP:
            addRelationship(false, delta.data);
            return;
          case ObjectType.TYPE:
            addType(false, delta.data);
            return;
        }
      } else if (delta.action === Action.EDIT) {
        switch (delta.element) {
          case ObjectType.AREA:
            updateArea(delta.aid, delta.undo);
            return;
          case ObjectType.RELATIONSHIP:
            setRelationships((prev) =>
              prev.map((e, idx) =>
                idx === delta.rid ? { ...e, ...delta.undo } : e
              )
            );
            return;
          case ObjectType.NOTE:
            updateNote(delta.nid, delta.undo);
            return;
          case ObjectType.TABLE:
            if (delta.component === "field") {
              updateField(delta.tid, delta.fid, delta.undo);
            } else if (delta.component === "field_delete") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    const temp = t.fields.slice();
                    temp.splice(delta.data.id, 0, delta.data);
                    return { ...t, fields: temp.map((t, i) => ({ ...t, id: i })) };
                  }
                  return t;
                })
              );
            } else if (delta.component === "field_add") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    return {
                      ...t,
                      fields: t.fields.filter((f) => f.id !== t.fields.length - 1).map((f, i) => ({ ...f, id: i })),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "index_add") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    return {
                      ...t,
                      indices: t.indices.filter((f) => f.id !== t.indices.length - 1).map((f, i) => ({ ...f, id: i })),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "index") {
              setTables((prev) =>
                prev.map((t) => {
                  if (t.id === delta.tid) {
                    return {
                      ...t,
                      indices: t.indices.map((index) =>
                        index.id === delta.iid
                          ? {
                            ...index,
                            ...delta.undo,
                          }
                          : index
                      ),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "index_delete") {
              setTables((prev) =>
                prev.map((table) => {
                  if (table.id === delta.tid) {
                    const temp = table.indices.slice();
                    temp.splice(delta.data.id, 0, delta.data);
                    return {
                      ...table,
                      indices: temp.map((t, i) => ({ ...t, id: i })),
                    };
                  }
                  return table;
                })
              );
            } else if (delta.component === "self") {
              updateTable(delta.tid, delta.undo, false);
            }
            return;
          case ObjectType.TYPE:
            if (delta.component === "field") {
              setTypes((prev) =>
                prev.map((t, i) => {
                  if (i === delta.tid) {
                    return {
                      ...t,
                      fields: t.fields.map((e, j) =>
                        j === delta.fid ? { ...e, ...delta.undo } : e
                      ),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "field_add") {
              setTypes((prev) =>
                prev.map((t, i) => {
                  if (i === delta.tid) {
                    return {
                      ...t,
                      fields: t.fields.filter(
                        (e, i) => i !== t.fields.length - 1
                      ),
                    };
                  }
                  return t;
                })
              );
            } else if (delta.component === "field_delete") {
              setTypes((prev) =>
                prev.map((t, i) => {
                  if (i === delta.tid) {
                    const temp = t.fields.slice();
                    temp.splice(delta.fid, 0, delta.data);
                    return { ...t, fields: temp };
                  }
                  return t;
                })
              );
            } else if (delta.component === "self") {
              updateType(delta.tid, delta.undo);
            }
            return;
        }
      }
    };

    socket.on("recieve-changes", (delta) => applyChange(delta));
    socket.on("recieve-reversed-changes", (delta) => reverseChange(delta));
    return () => {
      // socket.off("connect", onConnect);
      // socket.off("recieve-message", onRecieve);
      // socket.off("user-connected", onUserConnected);
      // socket.off("user-disconnected", onUserDisconnected);
      socket.off("recieve-reversed-changes", reverseChange);
      socket.off("recieve-changes", applyChange);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                  value={{ undoStack, redoStack, setUndoStack, setRedoStack, setHistoryCount }}
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
                        <div className="h-[100vh] overflow-hidden theme">
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
                            className={
                              layout.header
                                ? `flex h-[calc(100vh-120px)]`
                                : `flex h-[calc(100vh-52px)]`
                            }
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
                            <Canvas state={state} setState={setState} />
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
