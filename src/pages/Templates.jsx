import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabPane, Banner, Steps } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { db } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import Thumbnail from "../components/Thumbnail";
import logo_light from "../assets/logo_light_160.png";
import template_screenshot from "../assets/template_screenshot.png";

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
                    <div className="h-48">
                      <Thumbnail
                        diagram={t}
                        i={"1" + i}
                        zoom={0.3}
                        theme="light"
                      />
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex justify-between">
                        <div className="text-lg font-bold text-zinc-700">
                          {t.title}
                        </div>
                        <button
                          className="border rounded-sm px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300"
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
                      <div className="h-48">
                        <Thumbnail diagram={c} i={"2" + i} zoom={0.3} />
                      </div>
                      <div className="px-4 py-3 w-full">
                        <div className="flex justify-between">
                          <div className="text-lg font-bold text-zinc-700">
                            {c.title}
                          </div>
                          <div>
                            <button
                              className="me-1 border rounded-sm px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300"
                              onClick={() => forkTemplate(c.id)}
                            >
                              <i className="fa-solid fa-code-fork"></i>
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-around mt-2">
                          <button
                            className="w-full text-center flex justify-center items-center border rounded-sm px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300 text-blue-500"
                            onClick={() => editTemplate(c.id)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                            <div className="ms-1.5 font-semibold">Edit</div>
                          </button>
                          <div className="border-l border-gray-300 mx-2" />
                          <button
                            className="w-full text-center flex justify-center items-center border rounded-sm px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300 text-red-500"
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
                      className="border col-span-3 sm:cols-span-1 rounded-sm"
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
