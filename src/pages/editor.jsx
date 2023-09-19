import { React, useState, useEffect, useMemo } from "react";
import Diagram from "../components/diagram";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import ControlPanel from "../components/control_panel";
import CodeMirror from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { sql } from "@codemirror/lang-sql";
import { tags as t } from "@lezer/highlight";
import { DndProvider, useDrag } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { dia, shapes } from "jointjs";

const myTheme = createTheme({
  dark: "light",
  settings: {},
  styles: [
    { tag: t.comment, color: "#8ab0ed" },
    { tag: t.string, color: "#e68e29" },
    { tag: t.number, color: "#e68e29" },
    { tag: t.keyword, color: "#295be6" },
    { tag: t.variableName, color: "#1a00db" },
    { tag: t.typeName, color: "#295be6" },
    { tag: t.tagName, color: "#008a02" },
  ],
});
const Shape = () => {
  const rectData = {
    type: "rect",
    position: { x: 100, y: 100 },
    size: { width: 100, height: 40 },
    attrs: {
      body: {
        fill: "#7039FF",
      },
      label: {
        text: "hi",
        fill: "white",
      },
    },
  };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: rectData,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        fontSize: 25,
        fontWeight: "bold",
        cursor: "move",
      }}
    >
      rect
    </div>
  );
};

const Window = (props) => {
  const [editor, setEditor] = useState(true);

  return (
    <ResizableBox
      width={window.innerWidth * 0.2}
      height={window.innerHeight}
      resizeHandles={["e"]}
      minConstraints={[window.innerWidth * 0.2, window.innerHeight]}
      maxConstraints={[Infinity, Infinity]}
      axis="x"
    >
      <div className="overflow-auto h-full">
        <button
          onClick={() => {
            setEditor(!editor);
          }}
        >
          change view
        </button>
        <br />
        <button
          onClick={() => {
            const rect = new shapes.standard.Rectangle();
            rect.position(100, 100);
            rect.resize(100, 40);
            rect.attr({
              body: {
                fill: "#7039FF",
              },
              label: {
                text: "hi",
                fill: "white",
              },
            });
            rect.addTo(props.graph);
            props.setCode((prevCode) => `create table hi\n\n${prevCode}`);
          }}
        >
          add
        </button>
        {editor ? (
          <CodeMirror
            value={props.code}
            height="100%"
            theme={myTheme}
            extensions={[sql()]}
            onChange={() => {}}
          />
        ) : (
          <Shape />
        )}
      </div>
    </ResizableBox>
  );
};

export default function Editor(props) {
  const graph = useMemo(() => new dia.Graph(), []);
  const [code, setCode] = useState("");

  useEffect(() => {}, [graph]);

  return (
    <>
      <Header name={props.name} />
      <ControlPanel />
      <div className="flex h-full">
        <DndProvider backend={HTML5Backend}>
          <Window graph={graph} code={code} setCode={setCode}/>
          <Diagram graph={graph} code={code} setCode={setCode}/>
        </DndProvider>
        <Sidebar />
      </div>
    </>
  );
}
