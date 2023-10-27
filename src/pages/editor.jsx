import React, { useState, createContext, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ControlPanel from "../components/ControlPanel";
import Canvas from "../components/Canvas";
import SidePanel from "../components/SidePanel";
import {
  Tab,
  defaultTableTheme,
  defaultNoteTheme,
  avatarThemes,
  Action,
  ObjectType,
} from "../data/data";
import { socket } from "../data/socket";
import { db } from "../data/db";
import { uniqueNamesGenerator, colors, animals } from "unique-names-generator";

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

export default function Editor(props) {
  const [id, setId] = useState(0);
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
  });
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [botMessages, setBotMessages] = useState([
    { sender: "bot", message: "Hey there! How can I help you?" },
  ]);
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

  const updateNote = (id, values, addToHistory = true) => {
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
                    endX: tables[r.endTableId].x + 15,
                    endY: tables[r.endTableId].y + r.endFieldId * 36 + 69,
                  };
                } else if (r.endTableId === id) {
                  return {
                    ...r,
                    startX: tables[r.startTableId].x + 15,
                    startY: tables[r.startTableId].y + r.startFieldId * 36 + 69,
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
    document.title = "Editor | drawDB";

    const loadLatestDiagram = async () => {
      await db.diagrams
        .orderBy("lastModified")
        .last()
        .then((d) => {
          if (d) {
            setId(d.id);
            setTables(d.tables);
            setRelationships(d.references);
            setNotes(d.notes);
            setAreas(d.areas);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    loadLatestDiagram();

    socket.connect();

    const onConnect = () => {
      const name = uniqueNamesGenerator({
        dictionaries: [colors, animals],
        separator: " ",
        style: "capital",
      });
      const color =
        avatarThemes[Math.floor(Math.random() * avatarThemes.length)];
      socket.emit("new-user", name, color);
      setMessages((prev) => [
        ...prev,
        { message: `You joined as ${name}`, type: "note", action: "join" },
      ]);
    };
    const onRecieve = (value) =>
      setMessages((prev) => [{ ...value, type: "message" }, ...prev]);
    const onUserConnected = (name) =>
      setMessages((prev) => [
        { message: `${name} just joined`, type: "note", action: "join" },
        ...prev,
      ]);
    const onUserDisconnected = (name) =>
      setMessages((prev) => [
        { message: `${name} left`, type: "note", action: "leave" },
        ...prev,
      ]);

    socket.on("connect", onConnect);
    socket.on("recieve-message", onRecieve);
    socket.on("user-connected", onUserConnected);
    socket.on("user-disconnected", onUserDisconnected);

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

    return () => {
      socket.off("connect", onConnect);
      socket.off("recieve-message", onRecieve);
      socket.off("user-connected", onUserConnected);
      socket.off("user-disconnected", onUserDisconnected);
      socket.disconnect();
    };
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
                        <div className="h-[100vh] overflow-hidden theme">
                          <ControlPanel diagramId={id} setDiagramId={setId}/>
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
                            <Canvas />
                            {layout.services && (
                              <MessageContext.Provider
                                value={{ messages, setMessages }}
                              >
                                <BotMessageContext.Provider
                                  value={{ botMessages, setBotMessages }}
                                >
                                  <Sidebar />
                                </BotMessageContext.Provider>
                              </MessageContext.Provider>
                            )}
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
