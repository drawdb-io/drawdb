import { React, useState, useMemo } from "react";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import ControlPanel from "../components/control_panel";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { dia } from "jointjs";
import DrawArea from "../components/draw_area";
import EditorPanel from "../components/editor_panel";

export default function Editor(props) {
  const graph = useMemo(() => new dia.Graph(), []);
  const [code, setCode] = useState("");

  return (
    <>
      <Header name={props.name} />
      <ControlPanel />
      <div className="flex h-full">
        <DndProvider backend={HTML5Backend}>
          <EditorPanel graph={graph} code={code} setCode={setCode}/>
          <DrawArea graph={graph} code={code} setCode={setCode}/>
        </DndProvider>
        <Sidebar />
      </div>
    </>
  );
}
