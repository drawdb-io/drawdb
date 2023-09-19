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
import { Tabs } from "@douyinfe/semi-ui";
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
  const [tab, setTab] = useState(1);
  const map = useRef(new Map());

  const tabList = [
    { tab: "Overview", itemKey: 1 },
    { tab: "Shapes", itemKey: 2 },
    { tab: "Editor", itemKey: 3 },
  ];
  const contentList = [
    <div>Overview</div>,
    <div>
      <Shape />
    </div>,
    <div>
      <CodeMirror
        value={props.code}
        height="100%"
        theme={myTheme}
        extensions={[sql()]}
        onChange={(e) => {
          props.setCode(e);
        }}
      />
    </div>,
  ];

  return (
    <ResizableBox
      width={window.innerWidth * 0.2}
      height={window.innerHeight}
      resizeHandles={["e"]}
      minConstraints={[window.innerWidth * 0.2, window.innerHeight]}
      maxConstraints={[Infinity, Infinity]}
      axis="x"
    >
      <div className="overflow-auto h-full mt-2">
        <Tabs
          type="card"
          tabList={tabList}
          onChange={(key) => {
            setTab(key);
          }}
        >
          {contentList[tab -1]}
        </Tabs>

        <button
          onClick={() => {
            const newTable = {
              id: props.tables.length + 1,
              name: `Table ${props.tables.length + 1}`,
              x: 0,
              y: 0,
              fields: [
                {
                  name: "id",
                  type: "UUID",
                  default: "",
                  primary: true,
                  unique: true,
                  notNull: true,
                  increment: true,
                },
              ],
            };
            props.setTables((prev) => {
              const updatedTables = [...prev, newTable];
              return updatedTables;
            });
            props.setCode((prev) =>
              prev === ""
                ? `CREATE TABLE \`${newTable.name}\`;`
                : `${prev}\n\nCREATE TABLE \`${newTable.name}\`;`
            );
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
                  const newTable = {
                    id: props.tables.length + 1,
                    name: `Table ${props.tables.length + 1}`,
                    x: 0,
                    y: 0,
                    fields: [
                      {
                        name: "id",
                        type: "UUID",
                        default: "",
                        primary: true,
                        unique: true,
                        notNull: true,
                        increment: true,
                      },
                    ],
                  };
                  props.setTables((prev) => [...prev, newTable]);
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
      </div>
    </ResizableBox>
  );
}
