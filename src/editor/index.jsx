import { React } from "react";
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

export default function Editor(props) {
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
            <CodeMirror
              height="100%"
              theme={myTheme}
              extensions={[sql()]}
              onChange={(value, viewUpdate) => {
                console.log("value:", value);
              }}
            />
          </div>
        </ResizableBox>
        <div className="flex-grow">
          <Diagram />
        </div>
        <Sidebar />
      </div>
    </>
  );
}
