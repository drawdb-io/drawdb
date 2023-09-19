import React from "react";
import Diagram from "../components/diagram";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import Header from "../components/header";

export default function Editor(props) {
  return (
    <>
      <Header name={props.name} />
      <div className="flex">
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
        <div>
          <Diagram />
        </div>
        <div>hi</div>
      </div>
    </>
  );
}
