import React, { useState, createContext, useEffect } from "react";
import Sidebar from "../components/sidebar";
import ControlPanel from "../components/control_panel";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Canvas from "../components/canvas";
import EditorPanel from "../components/editor_panel";
import { Tab } from "../data/data";

export const LayoutContext = createContext();
export const TableContext = createContext();
export const AreaContext = createContext();
export const TabContext = createContext();
export const NoteContext = createContext();
export const SettingsContext = createContext();
export const UndoRedoContext = createContext();

export default function Editor(props) {
  const [code, setCode] = useState("");
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [areas, setAreas] = useState([]);
  const [notes, setNotes] = useState([]);
  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(340);
  const [selectedTable, setSelectedTable] = useState("");
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
    showGrid: true,
  });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const dragHandler = (e) => {
    if (!resize) return;
    const w = e.clientX;
    if (w > 340) setWidth(w);
  };

  useEffect(() => {
    document.title = "Editor";
  }, []);

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      <TableContext.Provider
        value={{ tables, setTables, relationships, setRelationships }}
      >
        <AreaContext.Provider value={{ areas, setAreas }}>
          <NoteContext.Provider value={{ notes, setNotes }}>
            <TabContext.Provider value={{ tab, setTab }}>
              <SettingsContext.Provider value={{ settings, setSettings }}>
                <UndoRedoContext.Provider
                  value={{ undoStack, redoStack, setUndoStack, setRedoStack }}
                >
                  <div className="h-[100vh] overflow-hidden">
                    <ControlPanel />
                    <div
                      className={
                        layout.header
                          ? `flex h-[calc(100vh-123.93px)]`
                          : `flex h-[calc(100vh-51.97px)]`
                      }
                      onMouseUp={() => setResize(false)}
                      onMouseMove={dragHandler}
                    >
                      <DndProvider backend={HTML5Backend}>
                        {layout.sidebar && (
                          <EditorPanel
                            code={code}
                            setCode={setCode}
                            resize={resize}
                            setResize={setResize}
                            width={width}
                            selectedTable={selectedTable}
                            setSelectedTable={setSelectedTable}
                          />
                        )}
                        <Canvas
                          code={code}
                          setCode={setCode}
                          selectedTable={selectedTable}
                          setSelectedTable={setSelectedTable}
                        />
                      </DndProvider>
                      {layout.services && <Sidebar />}
                    </div>
                  </div>
                </UndoRedoContext.Provider>
              </SettingsContext.Provider>
            </TabContext.Provider>
          </NoteContext.Provider>
        </AreaContext.Provider>
      </TableContext.Provider>
    </LayoutContext.Provider>
  );
}
