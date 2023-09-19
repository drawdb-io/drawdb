import React from "react";
import Diagram from "../components/diagram";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import ControlPanel from "../components/control_panel";

export default function Editor(props) {
  return (
    <>
      <Header name={props.name} />
      <ControlPanel/>
      <div className="flex h-full">
        <ResizableBox
          width={window.innerWidth * 0.2}
          height={window.innerHeight}
          resizeHandles={["e"]}
          minConstraints={[window.innerWidth * 0.2, window.innerHeight]}
          maxConstraints={[Infinity, Infinity]}
          axis="x"
        >
          <span className="text">window 1</span>
        </ResizableBox>
        <div className="flex-grow">
          <Diagram />
        </div>
        <Sidebar/>
      </div>
    </>
  );
}
