import React, { useState, createContext, useEffect } from "react";
import Sidebar from "../components/sidebar";
import ControlPanel from "../components/control_panel";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Canvas from "../components/canvas";
import EditorPanel from "../components/editor_panel";

export const LayoutContext = createContext();
export const TableContext = createContext();
export const AreaContext = createContext();

export default function Editor(props) {
  const [code, setCode] = useState("");
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [areas, setAreas] = useState([]);
  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(340);
  const [selectedTable, setSelectedTable] = useState("");
  const [layout, setLayout] = useState({
    header: true,
    sidebar: true,
    services: true,
    tables: true,
    relationships: true,
    issues: true,
    editor: true,
    shapes: true,
    fullscreen: false,
  });

  const dragHandler = (e) => {
    if (!resize) return;
    const w = e.clientX;
    if (w > 340) setWidth(w);
  };

  useEffect(()=>{
    document.title = "Editor";
  }, [])

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      <TableContext.Provider
        value={{ tables, setTables, relationships, setRelationships }}
      >
        <AreaContext.Provider value={{ areas, setAreas }}>
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
          </div>{" "}
        </AreaContext.Provider>
      </TableContext.Provider>
    </LayoutContext.Provider>
  );
}
