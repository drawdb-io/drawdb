import { calcPath } from "../utils";

export function Thumbnail({ diagram, i, zoom }) {
  const translateX = 32 * zoom;
  const translateY = 32 * zoom;
  const theme = localStorage.getItem("theme");
  return (
    <svg
      className={`${
        theme === "dark" ? "bg-[#222229]" : "bg-white"
      } w-full h-full rounded-md text-color`}
    >
      <defs>
        <pattern
          id={"pattern-circles-" + i}
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle
            id={"pattern-circle-" + i}
            cx="2"
            cy="2"
            r="0.4"
            fill="rgb(99, 152, 191)"
          ></circle>
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={"url(#pattern-circles-" + i + ")"}
      ></rect>
      <g
        style={{
          transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
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
            <div
              className={`border border-slate-400 w-full h-full rounded-sm relative`}
            >
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
          const height = table.fields.length * 36 + 50 + 7;
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
                ></div>
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
                          className={`w-[6px] h-[6px] bg-[#2f68ad] opacity-80 z-50 rounded-full me-2`}
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
        {diagram.relationships?.map((e, i) => (
          <path
            key={i}
            d={calcPath(
              e.startX,
              e.endX,
              e.startY - translateY / zoom,
              e.endY - (translateY / zoom) * 0.5,
              e.startFieldId,
              e.endFieldId
            )}
            fill="none"
            strokeWidth={1}
            stroke="#ddd"
          />
        ))}
        {diagram.notes?.map((n) => {
          const x = n.x;
          const y = n.y;
          const w = 180;
          const r = 3;
          const fold = 24;
          const h = n.height;
          return (
            <g key={n.id}>
              <path
                d={`M${x + fold} ${y} L${x + w - r} ${y} A${r} ${r} 0 0 1 ${
                  x + w
                } ${y + r} L${x + w} ${y + h - r} A${r} ${r} 0 0 1 ${
                  x + w - r
                } ${y + h} L${x + r} ${y + h} A${r} ${r} 0 0 1 ${x} ${
                  y + h - r
                } L${x} ${y + fold}`}
                fill={n.color}
                stroke="rgb(168 162 158)"
                strokeLinejoin="round"
                strokeWidth="0.5"
              />
              <path
                d={`M${x} ${y + fold} L${x + fold - r} ${
                  y + fold
                } A${r} ${r} 0 0 0 ${x + fold} ${y + fold - r} L${
                  x + fold
                } ${y} L${x} ${y + fold} Z`}
                fill={n.color}
                stroke={"rgb(168 162 158)"}
                strokeLinejoin="round"
                strokeWidth="0.5"
              />
              <foreignObject x={x} y={y} width={w} height={h}>
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
