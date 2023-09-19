import React, { useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import ControlPanel from "../components/control_panel";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Canvas from "../components/draw_area";
import EditorPanel from "../components/editor_panel";

export default function Editor(props) {
  const [code, setCode] = useState("");
  const [tables, setTables] = useState([]);

  return (
    <>
      <Header name={props.name} />
      <ControlPanel />
      <div className="flex h-full">
        <DndProvider backend={HTML5Backend}>
          <EditorPanel
            tables={tables}
            setTables={setTables}
            code={code}
            setCode={setCode}
          />
          <Canvas
            tables={tables}
            setTables={setTables}
            code={code}
            setCode={setCode}
          />
        </DndProvider>
        <Sidebar />
      </div>
    </>
  );
}
