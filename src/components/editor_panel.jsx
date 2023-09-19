import { React, useState, useRef } from "react";
import { ResizableBox } from "react-resizable";
import CodeMirror from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { sql } from "@codemirror/lang-sql";
import { tags as t } from "@lezer/highlight";
import Shape from "./shape";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { Parser } from "node-sql-parser";
import "react-resizable/css/styles.css";

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

export default function EditorPanel(props) {
  const [editor, setEditor] = useState(true);
  const map = useRef(new Map());

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
            const newRectangle = {
              id: props.rectangles.length + 1,
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              label: `rect ${props.rectangles.length + 1}`,
            };
            props.setRectangles([...props.rectangles, newRectangle]);
          }}
        >
          add
        </button>
        <br />
        <button
          onClick={() => {
            const blob = new Blob([props.code], {
              type: "text/plain;charset=utf-8",
            });

            saveAs(blob, "src.txt");
          }}
        >
          export src
        </button>
        <br />
        <button
          onClick={() => {
            try {
              const parser = new Parser();
              const ast = parser.astify(props.code);
              console.log(ast);
              ast.forEach((e) => {
                e.table.forEach((t) => {
                  if (map.current.has(t.table)) {
                    return;
                  }
                  map.current.set(t.table, t);
                  const newRectangle = {
                    id: props.rectangles.length + 1,
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    label: `rect ${props.rectangles.length + 1}`,
                  };
                  props.setRectangles([...props.rectangles, newRectangle]);
                });
              });
            } catch (e) {
              alert("parsing error");
            }
          }}
        >
          parse
        </button>
        <br />
        <button
          onClick={() => {
            html2canvas(document.getElementById("canvas")).then((canvas) => {
              canvas.toBlob((blob) => {
                saveAs(blob, "image.png");
              });
            });
          }}
        >
          export img
        </button>
        {editor ? (
          <CodeMirror
            value={props.code}
            height="100%"
            theme={myTheme}
            extensions={[sql()]}
            onChange={(e) => {
              props.setCode(e);
            }}
          />
        ) : (
          <Shape />
        )}
      </div>
    </ResizableBox>
  );
}
