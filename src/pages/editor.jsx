import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import ControlPanel from "../components/control_panel";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Canvas from "../components/canvas";
import EditorPanel from "../components/editor_panel";

export default function Editor(props) {
  const [code, setCode] = useState("");
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [areas, setAreas] = useState([]);
  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(340);
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

  return (
    <>
      <ControlPanel layout={layout} setLayout={setLayout} />
      <div
        className={`flex h-full`}
        onMouseUp={() => setResize(false)}
        onMouseMove={dragHandler}
      >
        <DndProvider backend={HTML5Backend}>
          {layout.sidebar && (
            <EditorPanel
              tables={tables}
              setTables={setTables}
              code={code}
              setCode={setCode}
              relationships={relationships}
              setRelationships={setRelationships}
              areas={areas}
              setAreas={setAreas}
              resize={resize}
              setResize={setResize}
              width={width}
            />
          )}
          <Canvas
            tables={tables}
            setTables={setTables}
            code={code}
            setCode={setCode}
            relationships={relationships}
            setRelationships={setRelationships}
            areas={areas}
            setAreas={setAreas}
          />
        </DndProvider>
        {layout.services && <Sidebar />}
      </div>
    </>
  );
}
