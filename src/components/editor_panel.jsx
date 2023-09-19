import { React, useState } from "react";
import { ResizableBox } from "react-resizable";
import CodeMirror from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { sql } from "@codemirror/lang-sql";
import { tags as t } from "@lezer/highlight";
import { shapes } from "jointjs";
import Shape from "./shape";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
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
            onChange={() => {}}
          />
        ) : (
          <Shape />
        )}
      </div>
    </ResizableBox>
  );
}
