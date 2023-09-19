import { React, useContext, useState } from "react";
import {
  IconCaretdown,
  IconChevronRight,
  IconShareStroked,
  IconChevronUp,
  IconChevronDown,
  IconCheckboxTick,
} from "@douyinfe/semi-icons";
import { Link } from "react-router-dom";
import icon from "../assets/icon_dark_64.png";
import {
  Avatar,
  AvatarGroup,
  Button,
  Divider,
  Dropdown,
  Form,
  Image,
  Modal,
  Spin,
} from "@douyinfe/semi-ui";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { saveAs } from "file-saver";
import { enterFullscreen, exitFullscreen } from "../utils";
import { LayoutContext } from "../pages/editor";

export default function ControlPanel(props) {
  const [visible, setVisible] = useState(false);
  const [dataUrl, setDataUrl] = useState("");
  const [filename, setFilename] = useState(
    `diagram_${new Date().toISOString()}`
  );
  const [extension, setExtension] = useState("");
  const { layout, setLayout } = useContext(LayoutContext);

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
        function: () => {},
      },
      "Export as": {
        children: [
          {
            PNG: () => {
              toPng(document.getElementById("canvas")).then(function (dataUrl) {
                setDataUrl(dataUrl);
              });
              setVisible(true);
              setExtension("png");
            },
          },
          {
            JPEG: () => {
              toJpeg(document.getElementById("canvas"), { quality: 0.95 }).then(
                function (dataUrl) {
                  setDataUrl(dataUrl);
                }
              );
              setVisible(true);
              setExtension("jpeg");
            },
          },
          { XML: () => {} },
          {
            SVG: () => {
              const filter = (node) => node.tagName !== "i";
              toSvg(document.getElementById("canvas"), { filter: filter }).then(
                function (dataUrl) {
                  setDataUrl(dataUrl);
                }
              );
              setVisible(true);
              setExtension("svg");
            },
          },
          { PDF: () => {} },
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
        function: () => {},
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
        function: () => {},
      },
      "Zoom out": {
        children: [],
        function: () => {},
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

  return (
    <div>
      {layout.header && header()}
      <div className="p-2 px-5 flex justify-between items-center rounded-xl bg-slate-100 my-1 sm:mx-1 md:mx-6 text-slate-700 select-none overflow-x-hidden">
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
                {[
                  "25%",
                  "50%",
                  "75%",
                  "100%",
                  "125%",
                  "150%",
                  "200%",
                  "300%",
                ].map((e, i) => (
                  <Dropdown.Item key={i}>{e}</Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item>
                  <Form>
                    <Form.InputNumber
                      field="zoom"
                      label="Custom zoom"
                      placeholder="Zoom"
                      suffix={<div className="p-1">%</div>}
                    />
                  </Form>
                </Dropdown.Item>
              </Dropdown.Menu>
            }
            trigger="click"
          >
            <div className="py-1 px-2 hover:bg-slate-200 rounded flex">
              <div>zoom</div>
              <IconCaretdown />
            </div>
          </Dropdown>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded"
            title="Zoom in"
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded"
            title="Zoom out"
          >
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <Divider layout="vertical" margin="8px" />
          <button className="py-1 px-2 hover:bg-slate-200 rounded" title="Undo">
            <i className="fa-solid fa-rotate-left "></i>
          </button>
          <button className="py-1 px-2 hover:bg-slate-200 rounded" title="Redo">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          <Divider layout="vertical" margin="8px" />
          <Dropdown
            position="bottomLeft"
            style={{ width: "180px" }}
            render={
              <Dropdown.Menu>
                <Dropdown.Item>Table</Dropdown.Item>
                <Dropdown.Item>Note</Dropdown.Item>
                <Dropdown.Item>Subject area</Dropdown.Item>
                <Dropdown.Item>Text</Dropdown.Item>
              </Dropdown.Menu>
            }
            trigger="click"
          >
            <div className="py-1 px-2 hover:bg-slate-200 flex">
              <i className="fa-solid fa-plus"></i>
              <IconCaretdown />
            </div>
          </Dropdown>
          <button className="py-1 px-2 hover:bg-slate-200 rounded" title="Edit">
            <i className="fa-solid fa-pen-to-square"></i>
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded"
            title="Delete"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
          <Divider layout="vertical" margin="8px" />
          <button className="py-1 px-2 hover:bg-slate-200 rounded" title="Save">
            <i className="fa-regular fa-floppy-disk"></i>
          </button>
          <button
            className="py-1 px-2 hover:bg-slate-200 rounded"
            title="Commit"
          >
            <i className="fa-solid fa-code-branch"></i>
          </button>
        </div>
        <button
          onClick={(e) =>
            setLayout((prev) => ({ ...prev, header: !prev.header }))
          }
        >
          {layout.header ? <IconChevronUp /> : <IconChevronDown />}
        </button>
      </div>
      <Modal
        title="Export diagram"
        visible={visible}
        onOk={() => saveAs(dataUrl, `${filename}.${extension}`)}
        afterClose={() => {
          setFilename(`diagram_${new Date().toISOString()}`);
          setDataUrl("");
        }}
        onCancel={() => setVisible(false)}
        centered
        closeOnEsc={true}
        okText="Export"
        cancelText="Cancel"
        width={470}
      >
        {dataUrl !== "" || dataUrl ? (
          <Image src={dataUrl} alt="Diagram" width={420}></Image>
        ) : (
          <div className="text-center my-3">
            <Spin tip="Loading..." size="large"></Spin>
          </div>
        )}
        <Form
          labelPosition="left"
          labelAlign="right"
          onChange={(value) => {
            setFilename((prev) =>
              value.values["filename"] !== undefined
                ? value.values["filename"]
                : prev
            );
          }}
        >
          <Form.Input
            field="filename"
            label="Filename"
            suffix={<div className="p-2">{`.${extension}`}</div>}
            initValue={filename}
          />
        </Form>
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
                      layout.shapes ? (
                        <IconCheckboxTick />
                      ) : (
                        <div className="px-2"></div>
                      )
                    }
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        shapes: !prev.shapes,
                      }))
                    }
                  >
                    Shapes
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
        <div className="py-1 px-2 hover:bg-slate-200 rounded flex items-center align-middle">
          <i className="fa-solid fa-table-list"></i> <IconCaretdown />
        </div>
      </Dropdown>
    );
  }
}
