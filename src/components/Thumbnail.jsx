import {
  tableFieldHeight,
  tableHeaderHeight,
  noteWidth,
  noteRadius,
  noteFold,
  gridSize,
  gridCircleRadius,
} from "../data/constants";

export default function Thumbnail({ diagram, i, zoom, theme }) {
  return (
    <svg
      className={`${
        theme === "dark" ? "bg-[#222229]" : "bg-white"
      } w-full h-full rounded-md text-color`}
    >
      <defs>
        <pattern
          id={"pattern-grid-" + i}
          x={-gridCircleRadius}
          y={-gridCircleRadius}
          width={gridSize * zoom}
          height={gridSize * zoom}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle
            cx={gridCircleRadius * zoom}
            cy={gridCircleRadius * zoom}
            r={gridCircleRadius * zoom}
            fill="rgb(99, 152, 191)"
            opacity="1"
          />
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={"url(#pattern-grid-" + i + ")"}
      ></rect>
      <g
        style={{
          transform: `scale(${zoom})`,
        }}
      >
        {diagram.subjectAreas?.map((a) => (
          <foreignObject
            key={a.id}
            x={a.x}
            y={a.y}
            width={a.width > 0 ? a.width : 0}
            height={a.height > 0 ? a.height : 0}
          >
            <div className="border border-slate-400 w-full h-full rounded-xs relative">
              <div
                className="opacity-40 w-fill h-full"
                style={{ backgroundColor: a.color }}
              />
            </div>
            <div className="text-color absolute top-1 left-2 select-none">
              {a.name}
            </div>
          </foreignObject>
        ))}
        {diagram.tables?.map((table, i) => {
          const height =
            table.fields.length * tableFieldHeight + tableHeaderHeight + 7;
          return (
            <foreignObject
              x={table.x}
              y={table.y}
              width={200}
              height={height}
              key={i}
            >
              <div
                className={`border rounded-md ${
                  theme === "dark"
                    ? "bg-zinc-800"
                    : "border-zinc-300 bg-zinc-100"
                }`}
              >
                <div
                  className="h-2 w-full rounded-t-sm"
                  style={{ backgroundColor: table.color }}
                />
                <div className="rounded-b-[3px]">
                  <div
                    className={`font-bold py-1 px-2 border-b ${
                      theme === "dark" ? "bg-zinc-900" : "bg-zinc-200"
                    } border-gray-300`}
                  >
                    {table.name}
                  </div>
                  {table.fields.map((f, j) => (
                    <div
                      className={`flex justify-between items-center py-1 px-2 ${
                        j < table.fields.length - 1 ? "border-b" : ""
                      }`}
                      key={j}
                    >
                      <div className="flex items-center justify-start">
                        <div
                          className={`w-[6px] h-[6px] bg-[#2f68adcc] rounded-full me-2`}
                        ></div>
                        <div>{f.name}</div>
                      </div>
                      <div className="text-zinc-500">{f.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            </foreignObject>
          );
        })}
        {diagram.notes?.map((n) => {
          const x = n.x;
          const y = n.y;
          const h = n.height;
          return (
            <g key={n.id}>
              <path
                d={`M${x + noteFold} ${y} L${x + noteWidth - noteRadius} ${y} A${noteRadius} ${noteRadius} 0 0 1 ${
                  x + noteWidth
                } ${y + noteRadius} L${x + noteWidth} ${y + h - noteRadius} A${noteRadius} ${noteRadius} 0 0 1 ${
                  x + noteWidth - noteRadius
                } ${y + h} L${x + noteRadius} ${y + h} A${noteRadius} ${noteRadius} 0 0 1 ${x} ${
                  y + h - noteRadius
                } L${x} ${y + noteFold}`}
                fill={n.color}
                stroke="rgb(168 162 158)"
                strokeLinejoin="round"
                strokeWidth="0.5"
              />
              <path
                d={`M${x} ${y + noteFold} L${x + noteFold - noteRadius} ${
                  y + noteFold
                } A${noteRadius} ${noteRadius} 0 0 0 ${x + noteFold} ${y + noteFold - noteRadius} L${
                  x + noteFold
                } ${y} L${x} ${y + noteFold} Z`}
                fill={n.color}
                stroke={"rgb(168 162 158)"}
                strokeLinejoin="round"
                strokeWidth="0.5"
              />
              <foreignObject x={x} y={y} width={noteWidth} height={h}>
                <div className="text-gray-900 w-full h-full px-4 py-2">
                  <label htmlFor={`note_${n.id}`} className="ms-4">
                    {n.title}
                  </label>
                  <div className="mt-[2px]">{n.content}</div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
