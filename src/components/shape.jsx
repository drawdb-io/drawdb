import { React } from "react";
import { useDrag } from "react-dnd";
import { ObjectType, defaultTableTheme } from "../data/data";

function Table() {
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
      } cursor-move w-[126px] h-[72px] border border-gray-400 rounded-md text-xs border-collapse bg-gray-100`}
    >
      <div
        className={`h-[7px] w-full rounded-t`}
        style={{ backgroundColor: defaultTableTheme }}
      />
      <div className="px-2 py-0.5 border-b border-gray-400 bg-gray-200">
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
  );
}

function Note() {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { type: ObjectType.NOTE },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`${
        isDragging ? "opacity-50" : ""
      } cursor-move w-[82px] h-[82px] relative`}
    >
      <svg className="w-full h-full">
        <path
          d="M20 1 L76 1 A4 4 0 0 1 80 4 L80 76 A4 4 0 0 1 76 80 L4 80 A4 4 0 0 1 1 76 L1 20 M1 20 L16 20 A4 4 0 0 0 20 16 L20 1Z"
          fill="#fcf7ac"
          stroke="#665b25"
          strokeLinejoin="round"
          strokeWidth="1"
        />
      </svg>
      <div className="text-gray-700 absolute select-none text-xs top-[50%] left-[50%] translate-y-[-50%] translate-x-[-50%]">
        Note
      </div>
    </div>
  );
}

function Area() {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { type: ObjectType.AREA },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className="cursor-move w-[92px] h-[82px] relative">
      <div
        className={`${isDragging ? "opacity-30" : "opacity-40"} 
           w-full h-full rounded border-2 border-slate-900`}
        style={{ backgroundColor: defaultTableTheme }}
      />
      <div className="text-gray-800 absolute top-[50%] left-[50%] translate-y-[-50%] translate-x-[-50%] select-none text-xs text-center">
        Subject area
      </div>
    </div>
  );
}



export default function Shape() {
  return (
    <div>
      <Table />
      <div className="py-2"></div>
      <Note />
      <div className="py-2"></div>
      <Area />
    </div>
  );
}
