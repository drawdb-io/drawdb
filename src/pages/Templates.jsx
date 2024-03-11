import { useEffect } from "react";
import logo_light from "../assets/logo_light_160.png";
import template_screenshot from "../assets/template_screenshot.png";
import { Link } from "react-router-dom";
import { Tabs, TabPane, Banner, Steps } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { db } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { calcPath } from "../utils/calcPath";

function Thumbnail({ diagram, i }) {
  const zoom = 0.3;
  return (
    <div className="w-full select-none">
      <svg className="bg-white w-full h-full rounded-t-md">
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
        <g>
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
                        className={`flex justify-between items-center py-[2px] px-[3px] ${
                          j < table.fields.length - 1 ? "border-b" : ""
                        }`}
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
              key={i}
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
  const defaultTemplates = useLiveQuery(() =>
    db.templates.where({ custom: 0 }).toArray()
  );
  const customTemplates = useLiveQuery(() =>
    db.templates.where({ custom: 1 }).toArray()
  );

  const deleteTemplate = async (id) => {
    await db.templates.delete(id);
  };

  const editTemplate = (id) => {
    const newWindow = window.open("/editor", "_blank");
    newWindow.name = "t " + id;
  };

  const forkTemplate = (id) => {
    const newWindow = window.open("/editor", "_blank");
    newWindow.name = "lt " + id;
  };

  useEffect(() => {
    document.title = "Templates | drawDB";
  }, []);

  return (
    <div>
      <div className="min-h-screen">
        <div className="sm:py-3 py-5 px-12 xl:px-20 sm:px-6 flex justify-between items-center select-none">
          <div className="flex items-center justify-start">
            <Link to="/">
              <img
                src={logo_light}
                alt="logo"
                className="me-2 sm:h-[28px] md:h-[46px] h-[48px]"
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
              A compilation of database entity relationship diagrams to give you
              a quick start or inspire your application&apos;s architecture.
            </div>
          </div>
          <Tabs>
            <TabPane
              tab={<span className="mx-2">Default templates</span>}
              itemKey="1"
            >
              <div className="grid xl:grid-cols-3 grid-cols-2 sm:grid-cols-1 gap-10 my-6">
                {defaultTemplates?.map((t, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 hover:translate-y-[-6px] transition-all duration-300 border rounded-md"
                  >
                    <Thumbnail diagram={t} i={"1" + i} />
                    <div className="px-4 py-3">
                      <div className="flex justify-between">
                        <div className="text-lg font-bold text-zinc-700">
                          {t.title}
                        </div>
                        <button
                          className="border rounded px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300"
                          onClick={() => forkTemplate(t.id)}
                        >
                          <i className="fa-solid fa-code-fork"></i>
                        </button>
                      </div>
                      <div>{t.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabPane>
            <TabPane
              tab={<span className="mx-2">Your templates</span>}
              itemKey="2"
            >
              {customTemplates?.length > 0 ? (
                <div className="grid xl:grid-cols-3 grid-cols-2 sm:grid-cols-1 gap-8 my-6">
                  {customTemplates?.map((c, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 hover:translate-y-[-6px] transition-all duration-300 border rounded-md"
                    >
                      <Thumbnail diagram={c} i={"2" + i} />
                      <div className="px-4 py-3 w-full">
                        <div className="flex justify-between">
                          <div className="text-lg font-bold text-zinc-700">
                            {c.title}
                          </div>
                          <div>
                            <button
                              className="me-1 border rounded px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300"
                              onClick={() => forkTemplate(c.id)}
                            >
                              <i className="fa-solid fa-code-fork"></i>
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-around mt-2">
                          <button
                            className="w-full text-center flex justify-center items-center border rounded px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300 text-blue-500"
                            onClick={() => editTemplate(c.id)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                            <div className="ms-1.5 font-semibold">Edit</div>
                          </button>
                          <div className="border-l border-gray-300 mx-2" />
                          <button
                            className="w-full text-center flex justify-center items-center border rounded px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300 text-red-500"
                            onClick={() => deleteTemplate(c.id)}
                          >
                            <IconDeleteStroked />
                            <div className="ms-1.5 font-semibold">Delete</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5">
                  <Banner
                    fullMode={false}
                    type="info"
                    bordered
                    icon={null}
                    closeIcon={null}
                    description={<div>You have no custom templates saved.</div>}
                  />
                  <div className="grid grid-cols-5 sm:grid-cols-1 gap-4 place-content-center my-4">
                    <img
                      src={template_screenshot}
                      className="border col-span-3 sm:cols-span-1 rounded"
                    />
                    <div className="col-span-2 sm:cols-span-1">
                      <div className="text-xl font-bold my-4">
                        How to save a template
                      </div>
                      <Steps direction="vertical" style={{ margin: "12px" }}>
                        <Steps.Step
                          title="Build a diagram"
                          description="Build the template in the editor"
                        />
                        <Steps.Step
                          title="Save as template"
                          description="Editor > File > Save as template"
                        />
                        <Steps.Step
                          title="Load a template"
                          description="Fork a template to build on"
                        />
                      </Steps>
                    </div>
                  </div>
                </div>
              )}
            </TabPane>
          </Tabs>
        </div>
      </div>
      <hr className="border-zinc-300 my-1" />
      <div className="text-center text-sm py-3">
        &copy; 2024 <strong>drawDB</strong> - All right reserved.
      </div>
    </div>
  );
}
