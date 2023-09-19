import Diagram from "./diagram";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

function App() {
  return (
    <div className="flex">
      <ResizableBox
        width={window.innerWidth * 0.2}
        height={window.innerHeight}
        resizeHandles={["e"]}
        minConstraints={[window.innerWidth * 0.2, window.innerHeight]}
        axis="x"
      >
        <span className="text">window 1</span>
      </ResizableBox>
      <ResizableBox
        width={window.innerWidth * 0.8}
        height={window.innerHeight}
        resizeHandles={[]}
      >
        <Diagram />
      </ResizableBox>
    </div>
  );
}

export default App;
