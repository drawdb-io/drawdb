import { React } from "react";
import { useDrag } from "react-dnd";

export default function Shape() {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        width: "150px",
        height: "65px",
      }}
    >
      <svg
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <foreignObject
          x={0}
          y={0}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <div className="border border-gray-600 w-full rounded h-full text-xs border-collapse">
            <div className="px-3 py-0.5 border-b border-gray-600">Table</div>
            <div className="px-1 py-0.5 border-b border-gray-600 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-[6px] h-[5px] bg-green-600 me-1 rounded-full" />
                <div>id</div>
              </div>
              <div>
                UUID
              </div>
            </div>
            <div className="px-1 py-0.5 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-[6px] h-[5px] bg-green-600 me-1 rounded-full" />
                <div>name</div>
              </div>
              <div>
                VARCHAR
              </div>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
