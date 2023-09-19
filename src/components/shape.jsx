import {React} from "react"
import { useDrag } from "react-dnd";

export default function Shape (){
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
