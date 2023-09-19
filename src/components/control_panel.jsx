import { React, useContext, useState } from "react";
import {
  IconCaretdown,
  IconChevronRight,
  IconShareStroked,
  IconChevronUp,
  IconChevronDown,
  IconCheckboxTick,
  IconSaveStroked,
  IconUndo,
  IconRedo,
} from "@douyinfe/semi-icons";
import { Link } from "react-router-dom";
import icon from "../assets/icon_dark_64.png";
import {
  Avatar,
  AvatarGroup,
  Button,
  Divider,
  Dropdown,
  InputNumber,
  Image,
  Modal,
  Spin,
  Input,
  Upload,
  Banner,
} from "@douyinfe/semi-ui";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { saveAs } from "file-saver";
import {
  jsonDiagramIsValid,
  enterFullscreen,
  exitFullscreen,
  ddbDiagramIsValid,
} from "../utils";
import {
  AreaContext,
  LayoutContext,
  NoteContext,
  SettingsContext,
  TableContext,
} from "../pages/editor";
import { AddTable, AddArea, AddNote } from "./custom_icons";
import { defaultTableTheme, defaultNoteTheme } from "../data/data";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import jsPDF from "jspdf";

export default function ControlPanel(props) {
  const MODAL = {
    NONE: 0,
    IMG: 1,
    CODE: 2,
    IMPORT: 3,
  };
  const ERROR = {
    NONE: 0,
    WARNING: 1,
    ERROR: 2,
    OK: 3,
  };
  const [visible, setVisible] = useState(MODAL.NONE);
  const [exportData, setExportData] = useState({
    data: "",
    filename: `diagram_${new Date().toISOString()}`,
    extension: "",
  });
  const [error, setError] = useState({
    type: ERROR.NONE,
    message: "",
  });
  const [data, setData] = useState(null);
  const { layout, setLayout } = useContext(LayoutContext);
  const { settings, setSettings } = useContext(SettingsContext);
  const { relationships, tables, setTables, setRelationships } =
    useContext(TableContext);
  const { notes, setNotes } = useContext(NoteContext);
  const { areas, setAreas } = useContext(AreaContext);

  const menu = {
    File: {
      New: {
        children: [],
        function: () => console.log("New"),
      },
      "New window": {
        children: [],
        function: () => {},
      },
      Save: {
        children: [],
        function: () => {},
      },
      "Save as": {
        children: [],
        function: () => {},
      },
      Share: {
        children: [],
        function: () => {},
      },
      Rename: {
        children: [],
        function: () => {},
      },
      Import: {
        children: [],
        function: () => {
          setVisible(MODAL.IMPORT);
        },
      },
      "Export as": {
        children: [
          {
            PNG: () => {
              toPng(document.getElementById("canvas")).then(function (dataUrl) {
                setExportData((prev) => ({
                  ...prev,
                  data: dataUrl,
                  extension: "png",
                }));
              });
              setVisible(MODAL.IMG);
            },
          },
          {
            JPEG: () => {
              toJpeg(document.getElementById("canvas"), { quality: 0.95 }).then(
                function (dataUrl) {
                  setExportData((prev) => ({
                    ...prev,
                    data: dataUrl,
                    extension: "jpeg",
                  }));
                }
              );
              setVisible(MODAL.IMG);
            },
          },
          {
            JSON: () => {
              setVisible(MODAL.CODE);

              const result = JSON.stringify(
                {
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                },
                null,
                2
              );
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "json",
              }));
            },
          },
          {
            SVG: () => {
              const filter = (node) => node.tagName !== "i";
              toSvg(document.getElementById("canvas"), { filter: filter }).then(
                function (dataUrl) {
                  setExportData((prev) => ({
                    ...prev,
                    data: dataUrl,
                    extension: "svg",
                  }));
                }
              );
              setVisible(MODAL.IMG);
            },
          },
          {
            PDF: () => {
              const canvas = document.getElementById("canvas");
              toJpeg(canvas).then(function (dataUrl) {
                const doc = new jsPDF("l", "px", [
                  canvas.offsetWidth,
                  canvas.offsetHeight,
                ]);
                doc.addImage(
                  dataUrl,
                  "jpeg",
                  0,
                  0,
                  canvas.offsetWidth,
                  canvas.offsetHeight
                );
                doc.save(`${exportData.filename}.pdf`);
              });
            },
          },
          {
            DRAWDB: () => {
              const result = JSON.stringify(
                {
                  author: "Unnamed",
                  project: "Untitled",
                  filename: "Untitled",
                  date: new Date().toISOString(),
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                },
                null,
                2
              );
              const blob = new Blob([result], {
                type: "text/plain;charset=utf-8",
              });
              saveAs(blob, `${exportData.filename}.ddb`);
            },
          },
        ],
        function: () => {},
      },
      "Export source": {
        children: [
          { MySQL: () => {} },
          { PostgreSQL: () => {} },
          { DBML: () => {} },
        ],
        function: () => {},
      },
      Properties: {
        children: [],
        function: () => {},
      },
      Close: {
        children: [],
        function: () => {},
      },
    },
    Edit: {
      Undo: {
        children: [],
        function: () => {},
      },
      Redo: {
        children: [],
        function: () => {},
      },
      Cut: {
        children: [],
        function: () => {},
      },
      Copy: {
        children: [],
        function: () => {},
      },
      "Copy as image": {
        children: [],
        function: () => {},
      },
      Paste: {
        children: [],
        function: () => {},
      },
      Delete: {
        children: [],
        function: () => {},
      },
      "Edit table": {
        children: [],
        function: () => {},
      },
    },
    View: {
      Toolbar: {
        children: [],
        function: () => {},
      },
      Grid: {
        children: [],
        function: () => {},
      },
      Sidebar: {
        children: [],
        function: () => {},
      },
      Editor: {
        children: [],
        function: () => {},
      },
      "Strict mode": {
        children: [],
        function: () => {
          setSettings((prev) => ({ ...prev, strictMode: !prev.strictMode }));
        },
      },
      "Field summary": {
        children: [],
        function: () => {
          setSettings((prev) => ({
            ...prev,
            showFieldSummary: !prev.showFieldSummary,
          }));
        },
      },
      "Reset view": {
        children: [],
        function: () => {},
      },
      "View schema": {
        children: [],
        function: () => {},
      },
      Theme: {
        children: [{ Light: () => {} }, { Dark: () => {} }],
        function: () => {},
      },
      "Zoom in": {
        children: [],
        function: () =>
          setSettings((prev) => ({ ...prev, zoom: prev.zoom * 1.2 })),
      },
      "Zoom out": {
        children: [],
        function: () =>
          setSettings((prev) => ({ ...prev, zoom: prev.zoom / 1.2 })),
      },
      Fullscreen: {
        children: [],
        function: enterFullscreen,
      },
    },
    Logs: {
      "Open logs": {
        children: [],
        function: () => {},
      },
      "Commit changes": {
        children: [],
        function: () => {},
      },
      "Revert changes": {
        children: [],
        function: () => {},
      },
      "View commits": {
        children: [],
        function: () => {},
      },
    },
    Help: {
      Shortcuts: {
        children: [],
        function: () => {},
      },
      "Ask us on discord": {
        children: [],
        function: () => {},
      },
      "Tweet us": {
        children: [],
        function: () => {},
      },
      "Found a bug": {
        children: [],
        function: () => {},
      },
    },
  };

  const diagramIsEmpty = () => {
    return (
      tables.length === 0 &&
      relationships.length === 0 &&
      notes.length === 0 &&
      areas.length === 0
    );
  };

  const overwriteDiagram = () => {
    setTables(data.tables);
    setRelationships(data.relationships);
    setAreas(data.subjectAreas);
    setNotes(data.notes);
  };

  return (
    <div>
      {layout.header && header()}
      <div className="py-1 px-5 flex justify-between items-center rounded-xl bg-slate-100 my-1 sm:mx-1 md:mx-6 text-slate-700 select-none overflow-x-hidden">
        <div className="flex justify-start items-center">
          {layoutDropdown()}
          <Divider layout="vertical" margin="8px" />
          <Dropdown
            style={{ width: "180px" }}
            position="bottomLeft"
            render={
              <Dropdown.Menu>
                <Dropdown.Item>Fit window</Dropdown.Item>
                <Dropdown.Divider />
                {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((e, i) => (
                  <Dropdown.Item
                    key={i}
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, zoom: e }));
                    }}
                  >
                    {Math.floor(e * 100)}%
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item>
                  <InputNumber
                    field="zoom"
                    label="Custom zoom"
                    placeholder="Zoom"
                    suffix={<div className="p-1">%</div>}
                    onChange={(v) =>
                      setSettings((prev) => ({
                        ...prev,
                        zoom: parseFloat(v) * 0.01,
                      }))
                    }
                  />
                </Dropdown.Item>
              </Dropdown.Menu>
            }
            trigger="click"
          >
            <div className="py-1 px-2 hover:bg-slate-200 rounded flex items-center justify-center">
              <div className="w-[40px]">{Math.floor(settings.zoom * 100)}%</div>
              <div>
                <IconCaretdown />
              </div>
            </div>
          </Dropdown>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded text-lg"
            title="Zoom in"
            onClick={() =>
              setSettings((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }))
            }
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded text-lg"
            title="Zoom out"
            onClick={() =>
              setSettings((prev) => ({ ...prev, zoom: prev.zoom / 1.2 }))
            }
          >
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <Divider layout="vertical" margin="8px" />
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Undo"
          >
            <IconUndo size="large" />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Redo"
          >
            <IconRedo size="large" />
          </button>
          <Divider layout="vertical" margin="8px" />
          <button
            className="flex items-center py-1 px-2 hover:bg-slate-200 rounded"
            title="Add new table"
            onClick={() =>
              setTables((prev) => [
                ...prev,
                {
                  id: prev.length,
                  name: `table_${prev.length}`,
                  x: 0,
                  y: 0,
                  fields: [
                    {
                      name: "id",
                      type: "UUID",
                      default: "",
                      check: "",
                      primary: true,
                      unique: true,
                      notNull: true,
                      increment: true,
                      comment: "",
                    },
                  ],
                  comment: "",
                  indices: [],
                  color: defaultTableTheme,
                },
              ])
            }
          >
            <AddTable />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Add subject area"
            onClick={() =>
              setAreas((prev) => [
                ...prev,
                {
                  id: prev.length,
                  name: `area_${prev.length}`,
                  x: 0,
                  y: 0,
                  width: 200,
                  height: 200,
                  color: defaultTableTheme,
                },
              ])
            }
          >
            <AddArea />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Add new note"
            onClick={() =>
              setNotes((prev) => [
                ...prev,
                {
                  id: prev.length,
                  x: 0,
                  y: 0,
                  title: `note_${prev.length}`,
                  content: "",
                  color: defaultNoteTheme,
                  height: 88,
                },
              ])
            }
          >
            <AddNote />
          </button>
          <Divider layout="vertical" margin="8px" />
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded flex items-center"
            title="Save"
          >
            <IconSaveStroked size="extra-large" />
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded text-xl"
            title="Commit"
          >
            <i className="fa-solid fa-code-branch"></i>
          </button>
        </div>
        <button
          onClick={(e) =>
            setLayout((prev) => ({ ...prev, header: !prev.header }))
          }
          className="flex items-center"
        >
          {layout.header ? <IconChevronUp /> : <IconChevronDown />}
        </button>
      </div>
      <Modal
        title={`${visible === MODAL.IMPORT ? "Import" : "Export"} diagram`}
        visible={visible !== MODAL.NONE}
        onOk={() => {
          if (visible === MODAL.IMG) {
            saveAs(
              exportData.data,
              `${exportData.filename}.${exportData.extension}`
            );
          } else if (visible === MODAL.CODE) {
            const blob = new Blob([exportData.data], {
              type: "application/json",
            });
            saveAs(blob, `${exportData.filename}.${exportData.extension}`);
          } else if (visible === MODAL.IMPORT) {
            if (error.type !== ERROR.ERROR) {
              overwriteDiagram();
              setData(null);
              setVisible(MODAL.NONE);
            }
          }
        }}
        afterClose={() => {
          setExportData((prev) => ({
            data: "",
            extension: "",
            filename: `diagram_${new Date().toISOString()}`,
          }));
          setError({
            type: ERROR.NONE,
            message: "",
          });
          setData(null);
        }}
        onCancel={() => setVisible(MODAL.NONE)}
        centered
        closeOnEsc={true}
        okText={`${visible === MODAL.IMPORT ? "Import" : "Export"}`}
        okButtonProps={{ disabled: error.type === ERROR.ERROR }}
        cancelText="Cancel"
        width={520}
      >
        {visible === MODAL.IMPORT ? (
          <div>
            <Upload
              action="#"
              beforeUpload={({ file, fileList }) => {
                const f = fileList[0].fileInstance;
                if (!f) {
                  return;
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                  let jsonObject = null;
                  try {
                    jsonObject = JSON.parse(event.target.result);
                  } catch (error) {
                    setError({
                      type: ERROR.ERROR,
                      message: "The file contains an error.",
                    });
                    return;
                  }
                  if (f.type === "application/json") {
                    if (!jsonDiagramIsValid(jsonObject)) {
                      setError({
                        type: ERROR.ERROR,
                        message:
                          "The file is missing necessary properties for a diagram.",
                      });
                      return;
                    }
                  } else if (f.name.split(".").pop() === "ddb") {
                    if (!ddbDiagramIsValid(jsonObject)) {
                      setError({
                        type: ERROR.ERROR,
                        message:
                          "The file is missing necessary properties for a diagram.",
                      });
                      return;
                    }
                  }
                  setData(jsonObject);
                  if (diagramIsEmpty()) {
                    setError({
                      type: ERROR.OK,
                      message: "Everything looks good. You can now import.",
                    });
                  } else {
                    setError({
                      type: ERROR.WARNING,
                      message:
                        "The current diagram is not empty. Importing a new diagram will overwrite the current changes.",
                    });
                  }
                };
                reader.readAsText(f);

                return {
                  autoRemove: false,
                  fileInstance: file.fileInstance,
                  status: "success",
                  shouldUpload: false,
                };
              }}
              draggable={true}
              dragMainText="Click to upload the file or drag and drop the file here"
              dragSubText="Support json"
              accept="application/json,.ddb"
              onRemove={() =>
                setError({
                  type: ERROR.NONE,
                  message: "",
                })
              }
              onFileChange={() =>
                setError({
                  type: ERROR.NONE,
                  message: "",
                })
              }
              limit={1}
            ></Upload>
            {error.type === ERROR.ERROR ? (
              <Banner
                type="danger"
                fullMode={false}
                description={
                  <div className="text-red-800">{error.message}</div>
                }
              />
            ) : error.type === ERROR.OK ? (
              <Banner
                type="info"
                fullMode={false}
                description={<div>{error.message}</div>}
              />
            ) : (
              error.type === ERROR.WARNING && (
                <Banner
                  type="warning"
                  fullMode={false}
                  description={<div>{error.message}</div>}
                />
              )
            )}
          </div>
        ) : exportData.data !== "" || exportData.data ? (
          <>
            {visible === MODAL.IMG ? (
              <Image src={exportData.data} alt="Diagram" height={220} />
            ) : (
              <div className="max-h-[400px] overflow-auto border border-gray-200">
                <CodeMirror
                  value={exportData.data}
                  extensions={[json()]}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}
            <div className="text-sm font-semibold mt-2">Filename:</div>
            <Input
              value={exportData.filename}
              placeholder="Filename"
              suffix={<div className="p-2">{`.${exportData.extension}`}</div>}
              onChange={(value) =>
                setExportData((prev) => ({ ...prev, filename: value }))
              }
              field="filename"
            />
          </>
        ) : (
          <div className="text-center my-3">
            <Spin tip="Loading..." size="large" />
          </div>
        )}
      </Modal>
    </div>
  );

  function header() {
    return (
      <nav className="flex justify-between pt-1 items-center whitespace-nowrap">
        <div className="flex justify-start items-center text-slate-800">
          <Link to="/">
            <img
              width={54}
              src={icon}
              alt="logo"
              className="ms-8 min-w-[54px]"
            />
          </Link>
          <div className="ms-1 mt-1">
            <div className="text-xl ms-3">Project1 / Untitled</div>
            <div className="flex justify-between items-center">
              <div className="flex justify-start text-md select-none me-2">
                {Object.keys(menu).map((category) => (
                  <Dropdown
                    key={category}
                    position="bottomLeft"
                    style={{ width: "200px" }}
                    render={
                      <Dropdown.Menu>
                        {Object.keys(menu[category]).map((item, index) => {
                          if (menu[category][item].children.length > 0) {
                            return (
                              <Dropdown
                                style={{ width: "120px" }}
                                key={item}
                                position={"rightTop"}
                                render={
                                  <Dropdown.Menu>
                                    {menu[category][item].children.map(
                                      (e, i) => (
                                        <Dropdown.Item
                                          key={i}
                                          onClick={Object.values(e)[0]}
                                        >
                                          {Object.keys(e)[0]}
                                        </Dropdown.Item>
                                      )
                                    )}
                                  </Dropdown.Menu>
                                }
                              >
                                <Dropdown.Item
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                  onClick={menu[category][item].function}
                                >
                                  {item}
                                  <IconChevronRight />
                                </Dropdown.Item>
                              </Dropdown>
                            );
                          }
                          return (
                            <Dropdown.Item
                              key={index}
                              onClick={menu[category][item].function}
                            >
                              {item}
                            </Dropdown.Item>
                          );
                        })}
                      </Dropdown.Menu>
                    }
                  >
                    <div className="px-3 py-1 hover:bg-gray-100 rounded">
                      {category}
                    </div>
                  </Dropdown>
                ))}
              </div>
              <Button size="small" type="tertiary">
                Last saved {new Date().toISOString()}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-around items-center text-md me-8">
          <AvatarGroup maxCount={3} size="default">
            <Avatar color="red" alt="Lisa LeBlanc">
              LL
            </Avatar>
            <Avatar color="green" alt="Caroline Xiao">
              CX
            </Avatar>
            <Avatar color="amber" alt="Rafal Matin">
              RM
            </Avatar>
            <Avatar alt="Zank Lance">ZL</Avatar>
            <Avatar alt="Youself Zhang">YZ</Avatar>
          </AvatarGroup>
          <Button
            type="primary"
            style={{
              fontSize: "16px",
              marginLeft: "12px",
              marginRight: "12px",
            }}
            size="large"
            icon={<IconShareStroked />}
          >
            Share
          </Button>
          <Avatar size="default" alt="Buni Zhang">
            BZ
          </Avatar>
        </div>
      </nav>
    );
  }

  function layoutDropdown() {
    return (
      <Dropdown
        position="bottomLeft"
        style={{ width: "180px" }}
        render={
          <Dropdown.Menu>
            <Dropdown.Item
              icon={
                layout.header ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() =>
                setLayout((prev) => ({
                  ...prev,
                  header: !prev.header,
                }))
              }
            >
              Header
            </Dropdown.Item>
            <Dropdown
              position={"rightTop"}
              render={
                <Dropdown.Menu>
                  <Dropdown.Item
                    icon={
                      layout.tables ? (
                        <IconCheckboxTick />
                      ) : (
                        <div className="px-2"></div>
                      )
                    }
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        tables: !prev.tables,
                      }))
                    }
                  >
                    Tables
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={
                      layout.relationships ? (
                        <IconCheckboxTick />
                      ) : (
                        <div className="px-2"></div>
                      )
                    }
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        relationships: !prev.relationships,
                      }))
                    }
                  >
                    Relationships
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={
                      layout.issues ? (
                        <IconCheckboxTick />
                      ) : (
                        <div className="px-2"></div>
                      )
                    }
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        issues: !prev.issues,
                      }))
                    }
                  >
                    Issues
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={
                      layout.areas ? (
                        <IconCheckboxTick />
                      ) : (
                        <div className="px-2"></div>
                      )
                    }
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        areas: !prev.areas,
                      }))
                    }
                  >
                    Subject areas
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={
                      layout.editor ? (
                        <IconCheckboxTick />
                      ) : (
                        <div className="px-2"></div>
                      )
                    }
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        editor: !prev.editor,
                      }))
                    }
                  >
                    Editor
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={
                      layout.notes ? (
                        <IconCheckboxTick />
                      ) : (
                        <div className="px-2"></div>
                      )
                    }
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        notes: !prev.notes,
                      }))
                    }
                  >
                    Notes
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Dropdown.Item
                icon={
                  layout.sidebar ? (
                    <IconCheckboxTick />
                  ) : (
                    <div className="px-2"></div>
                  )
                }
                onClick={() =>
                  setLayout((prev) => ({
                    ...prev,
                    sidebar: !prev.sidebar,
                  }))
                }
              >
                Sidebar
              </Dropdown.Item>
            </Dropdown>
            <Dropdown.Item
              icon={
                layout.services ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() =>
                setLayout((prev) => ({
                  ...prev,
                  services: !prev.services,
                }))
              }
            >
              Services
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              icon={
                layout.fullscreen ? (
                  <IconCheckboxTick />
                ) : (
                  <div className="px-2"></div>
                )
              }
              onClick={() => {
                if (layout.fullscreen) {
                  exitFullscreen();
                } else {
                  enterFullscreen();
                }
                setLayout((prev) => ({
                  ...prev,
                  fullscreen: !prev.fullscreen,
                }));
              }}
            >
              Fullscreen
            </Dropdown.Item>
          </Dropdown.Menu>
        }
        trigger="click"
      >
        <div className="py-1 px-2 hover:bg-slate-200 rounded flex items-center justify-center">
          <div>
            <i className="fa-solid fa-table-list text-xl me-1"></i>
          </div>
          <div>
            <IconCaretdown />
          </div>
        </div>
      </Dropdown>
    );
  }
}
