import { useState, createContext, useEffect, useCallback } from "react";
import ControlPanel from "../components/ControlPanel";
import Canvas from "../components/Canvas";
import SidePanel from "../components/SidePanel";
import { Tab, defaultNoteTheme, Action, ObjectType, State } from "../data/data";
import { db } from "../data/db";
import useLayout from "../hooks/useLayout";
import LayoutContextProvider from "../context/LayoutContext";
import useSettings from "../hooks/useSettings";
import TransformContextProvider from "../context/TransformContext";
import useTransform from "../hooks/useTransform";
import useTables from "../hooks/useTables";
import TablesContextProvider from "../context/TablesContext";
import useUndoRedo from "../hooks/useUndoRedo";
import UndoRedoContextProvider from "../context/UndoRedoContext";
import SelectContextProvider from "../context/SelectContext";
import AreasContextProvider from "../context/AreasContext";
import useSelect from "../hooks/useSelect";
import Controls from "../components/Controls";
import useAreas from "../hooks/useAreas";

export const StateContext = createContext();
export const TabContext = createContext();
export const NoteContext = createContext();
export const TaskContext = createContext();
export const TypeContext = createContext();

export default function Editor() {
  return (
    <LayoutContextProvider>
      <TransformContextProvider>
        <UndoRedoContextProvider>
          <SelectContextProvider>
            <AreasContextProvider>
              <TablesContextProvider>
                <WorkSpace />
              </TablesContextProvider>
            </AreasContextProvider>
          </SelectContextProvider>
        </UndoRedoContextProvider>
      </TransformContextProvider>
    </LayoutContextProvider>
  );
}

function WorkSpace() {
  const [id, setId] = useState(0);
  const [title, setTitle] = useState("Untitled Diagram");
  const [state, setState] = useState(State.NONE);
  const [lastSaved, setLastSaved] = useState("");
  const { tables, relationships, setTables, setRelationships } = useTables();
  const [notes, setNotes] = useState([]);
  const [types, setTypes] = useState([]);
  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(340);
  const [tab, setTab] = useState(Tab.tables);
  const { layout } = useLayout();
  const { settings, setSettings } = useSettings();
  const { transform, setTransform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const { areas, setAreas } = useAreas();
  const [tasks, setTasks] = useState([]);
  const { undoStack, redoStack, setUndoStack, setRedoStack } = useUndoRedo();

  const dragHandler = (e) => {
    if (!resize) return;
    const w = e.clientX;
    if (w > 340) setWidth(w);
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
          x: -transform.pan.x,
          y: -transform.pan.y,
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

  const updateTask = (id, values) =>
    setTasks((prev) =>
      prev.map((task, i) => (id === i ? { ...task, ...values } : task))
    );

  useEffect(() => {
    if (
      tables?.length === 0 &&
      areas?.length === 0 &&
      notes?.length === 0 &&
      types?.length === 0 &&
      tasks?.length === 0
    )
      return;

    if (settings.autosave) {
      setState(State.SAVING);
    }
  }, [
    undoStack,
    redoStack,
    settings.autosave,
    tables?.length,
    areas?.length,
    notes?.length,
    types?.length,
    relationships?.length,
    tasks?.length,
    transform.zoom,
    title,
  ]);

  const save = useCallback(
    async (diagram = true) => {
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
              todos: tasks,
              pan: transform.pan,
              zoom: transform.zoom,
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
              todos: tasks,
              pan: transform.pan,
              zoom: transform.zoom,
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
            todos: tasks,
            pan: transform.pan,
            zoom: transform.zoom,
          })
          .then(() => {
            setState(State.SAVED);
            setLastSaved(new Date().toLocaleString());
          })
          .catch(() => {
            setState(State.ERROR);
          });
      }
    },
    [
      tables,
      relationships,
      notes,
      areas,
      types,
      title,
      id,
      state,
      tasks,
      transform.zoom,
      transform.pan,
    ]
  );
  useEffect(() => {
    const name = window.name.split(" ");
    const op = name[0];
    const diagram = window.name === "" || op === "d" || op === "lt";

    save(diagram);
  }, [id, state, save]);

  useEffect(() => {
    document.title = "Editor | drawDB";

    const loadLatestDiagram = async () => {
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
            setTasks(d.todos);
            setTransform({ pan: d.pan, zoom: d.zoom });
            window.name = `d ${d.id}`;
          } else {
            window.name = "";
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    const loadDiagram = async (id) => {
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
            setTasks(diagram.todos);
            setTransform({
              pan: diagram.pan,
              zoom: diagram.zoom,
            });
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

    const loadTemplate = async (id) => {
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
            setTasks(diagram.tasks);
            setNotes(diagram.notes);
            setTransform({
              zoom: 1,
              pan: { x: 0, y: 0 },
            });
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
  }, [
    setSettings,
    setTransform,
    setRedoStack,
    setUndoStack,
    setRelationships,
    setTables,
    setAreas,
  ]);

  return (
    <StateContext.Provider value={{ state, setState }}>
      <NoteContext.Provider
        value={{ notes, setNotes, updateNote, addNote, deleteNote }}
      >
        <TabContext.Provider value={{ tab, setTab }}>
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
              <TaskContext.Provider value={{ tasks, setTasks, updateTask }}>
                <ControlPanel
                  diagramId={id}
                  setDiagramId={setId}
                  title={title}
                  setTitle={setTitle}
                  lastSaved={lastSaved}
                  setLastSaved={setLastSaved}
                />
              </TaskContext.Provider>
              <div
                className="flex h-full overflow-y-auto"
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
                <div className="relative w-full h-full overflow-hidden">
                  <Canvas state={state} setState={setState} />
                  {!(layout.sidebar || layout.toolbar || layout.header) && (
                    <div className="fixed right-5 bottom-4">
                      <Controls />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TypeContext.Provider>
        </TabContext.Provider>
      </NoteContext.Provider>
    </StateContext.Provider>
  );
}
