import React, { useEffect } from "react";
import logo_light from "../assets/logo_light_46.png";
import { Link } from "react-router-dom";
import { Tabs, TabPane } from "@douyinfe/semi-ui";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { calcPath } from "../utils";

function Thumbnail({ diagram }) {
  const zoom = 0.3;
  return (
    <div className="w-full select-none">
      <svg className="bg-white w-full">
        <defs>
          <pattern
            id="pattern-circles"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
          >
            <circle
              id="pattern-circle"
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
          fill="url(#pattern-circles)"
        ></rect>
        <g id="diagram">
          {diagram.subjectAreas?.map((a) => (
            <foreignObject
              key={a.id}
              x={a.x * zoom}
              y={a.y * zoom}
              width={a.width > 0 ? a.width * zoom : 0}
              height={a.height > 0 ? a.height * zoom : 0}
            >
              <div
                className={`border border-slate-400 w-full h-full rounded-sm relative`}
              >
                <div
                  className="opacity-40 w-fill h-full"
                  style={{ backgroundColor: a.color }}
                />
              </div>
              <div className="text-color absolute top-[4px] left-[6px] select-none text-[4px]">
                {a.name}
              </div>
            </foreignObject>
          ))}
          {diagram.tables?.map((table, i) => {
            const height = table.fields.length * 36 + 50 + 7;
            return (
              <foreignObject
                x={table.x * zoom}
                y={table.y * zoom}
                width={200 * zoom}
                height={height * zoom}
                key={i}
              >
                <div className="border-[1px] rounded-[3px] border-zinc-300 text-[4px] bg-zinc-100">
                  <div
                    className="h-[4px] w-full rounded-t-sm"
                    style={{ backgroundColor: table.color }}
                  ></div>
                  <div className="rounded-b-[3px]">
                    <div className="bg-zinc-200 font-bold py-[2px] px-[4px] border-b border-gray-300">
                      {table.name}
                    </div>
                    {table.fields.map((f, j) => (
                      <div
                        className="flex justify-between items-center py-[2px] px-[3px]"
                        key={j}
                      >
                        <div className="flex items-center justify-start">
                          <div
                            className={`w-[3px] h-[3px] bg-[#2f68ad] opacity-80 z-50 rounded-full me-[2px]`}
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
              d={calcPath(e.startX, e.endX, e.startY, e.endY, zoom)}
              fill="none"
              strokeWidth={1}
              stroke="gray"
            />
          ))}
          {diagram.notes?.map((n) => {
            const x = n.x * zoom;
            const y = n.y * zoom;
            const w = 180 * zoom;
            const r = 3 * zoom;
            const fold = 24 * zoom;
            const h = n.height * zoom;
            return (
              <g>
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
                  <div className="text-gray-900 w-full h-full px-[4px] py-[2px] text-[4px]">
                    <label htmlFor={`note_${n.id}`} className="ms-[6px]">
                      {n.title}
                    </label>
                    <div className="text-[4px] mt-[2px]">{n.content}</div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default function Templates() {
  const templates = useLiveQuery(() => db.templates.toArray());

  useEffect(() => {
    document.title = "Templates | drawDB";
  }, []);

  return (
    <div>
      <div className="sm:py-3 py-5 px-12 xl:px-20 sm:px-6 flex justify-between items-center select-none">
        <div className="flex items-center justify-start">
          <Link to="/">
            <img
              src={logo_light}
              alt="logo"
              className="me-2 sm:h-[28px] md:h-[46px]"
            />
          </Link>
          <div className="ms-4 sm:text-sm xl:text-xl text-xl font-semibold">
            Templates
          </div>
        </div>
      </div>
      <hr className="border-zinc-300" />
      <div className="xl:px-20 sm:px-6 px-12 py-6">
        <div className="w-full md:w-[75%] xl:w-[50%] mb-2">
          <div className="text-2xl sm:text-lg font-semibold mb-2 text-neutral-800">
            Database schema templates
          </div>
          <div className="text-sm text-neutral-700">
            A compilation of database entity relationship diagrams to give you a
            quick start or inspire your application's architecture.
          </div>
        </div>
        <Tabs>
          <TabPane
            tab={<span className="mx-2">Default templates</span>}
            itemKey="1"
          >
            <div className="grid xl:grid-cols-3 grid-cols-2 sm:grid-cols-1 gap-4 my-3">
              {templates?.map((t, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-200 hover:translate-y-[-6px] transition-all duration-300"
                >
                  <Thumbnail diagram={t} />
                  <div>{t.title}</div>
                  <div>{t.description}</div>
                </div>
              ))}
            </div>
          </TabPane>
          <TabPane
            tab={<span className="mx-2">Your templates</span>}
            itemKey="2"
          >
            Your templates
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}
