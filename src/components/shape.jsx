import { React } from "react";
import { useDrag } from "react-dnd";
import { ObjectType, defaultTableTheme } from "../data/data";

export default function Shape() {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { type: ObjectType.TABLE },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`${
        isDragging ? "opacity-50" : ""
      } bg-gray-100 cursor-move w-[150px] h-[72px]`}
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
          <div className="border border-gray-400 w-full rounded-md h-full text-xs border-collapse">
            <div
              className={`h-[7px] w-full rounded-t`}
              style={{ backgroundColor: defaultTableTheme }}
            />
            <div className="px-3 py-0.5 border-b border-gray-400 bg-gray-200">
              Table
            </div>
            <div className="px-1 py-0.5 border-b border-gray-400 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-[6px] h-[5px] bg-[#2f68ad] opacity-80 me-1 rounded-full" />
                <div>id</div>
              </div>
              <div className="text-slate-400">UUID</div>
            </div>
            <div className="px-1 py-0.5 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-[6px] h-[5px] bg-[#2f68ad] opacity-80 me-1 rounded-full" />
                <div>name</div>
              </div>
              <div className="text-slate-400">VARCHAR</div>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
