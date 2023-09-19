import { React, useState, useRef, useEffect, useMemo } from "react";
// import Diagram from "../components/diagram";
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
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  //   const canvas = useRef(null);

  //   useEffect(() => {
  //     const graph = new dia.Graph();
  //     new dia.Paper({
  //       el: document.getElementById("canvas"),
  //       background: {
  //         color: "#fec3b0",
  //       },
  //       model: graph,
  //       height: "100%",
  //       width: "100%",
  //       gridSize: 1,
  //       interactive: true,
  //     });

  //     const rect = new shapes.standard.Rectangle();
  //     rect.position(100, 100);
  //     rect.resize(100, 40);
  //     rect.attr({
  //       body: {
  //         fill: "#9039FF",
  //       },
  //       label: {
  //         text: "hi",
  //         fill: "white",
  //       },
  //     });
  //     rect.addTo(graph);
  //   });

  return (
    <>
      <div
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          fontSize: 25,
          fontWeight: "bold",
          cursor: "move",
        }}
      >
        <table>
          <tr>hi</tr>
        </table>
        {/* <div id="canvas" ref={canvas} /> */}
      </div>
    </>
  );
};

function Diagram(props) {
  const canvas = useRef(null);

  useEffect(() => {
    // const graph = new dia.Graph();
    new dia.Paper({
      el: document.getElementById("canvas"),
      background: {
        color: "#aec3b0",
      },
      model: props.graph,
      height: "100%",
      width: "100%",
      gridSize: 1,
      interactive: true,
    });

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
  });

  return <div id="canvas" ref={canvas} />;
}

export default function Editor(props) {
  const graph = useMemo(() => new dia.Graph(), []);
  const [editor, setEditor] = useState(true);
  useEffect(() => {}, [graph]);
  return (
    <>
      <Header name={props.name} />
      <ControlPanel />
      <div className="flex h-full">
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
                rect.addTo(graph);
              }}
            >
              add
            </button>
            {editor ? (
              <CodeMirror
                height="100%"
                theme={myTheme}
                extensions={[sql()]}
                onChange={(value, viewUpdate) => {
                  console.log("value:", value);
                }}
              />
            ) : (
              <div>
                <DndProvider backend={HTML5Backend}>
                  <Shape />
                </DndProvider>
              </div>
            )}
          </div>
        </ResizableBox>
        <div className="flex-grow">
          <Diagram graph={graph} />
        </div>
        <Sidebar />
      </div>
    </>
  );
}
