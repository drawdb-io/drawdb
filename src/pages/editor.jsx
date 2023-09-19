import React, { useState, useEffect } from "react";
import Header from "../components/header";
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

  useEffect(() => {
    console.log("changed: ", tables);
  }, [tables]);

  // const handleDelete = useCallback((id)=>{
  //   setTables(prev=>prev.filter(e=>e.id!==id).map((e, i)=>({...e, id: i})))
  // }, [])

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
            relationships={relationships}
            setRelationships={setRelationships}
            areas={areas}
            setAreas={setAreas}
            // handleDelete={handleDelete}
          />
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
        <Sidebar />
      </div>
    </>
  );
}
