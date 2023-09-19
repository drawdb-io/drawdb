import { React, useState } from "react";
import { menu } from "../data/data";
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
} from "@douyinfe/semi-ui";

export default function ControlPanel() {
  const [showToolBar, setShowToolBar] = useState(true);

  return (
    <>
      {showToolBar && (
        <nav className="flex justify-between pt-1 items-center">
          <div className="flex justify-start items-center text-slate-800">
            <Link to="/">
              <img width={54} src={icon} alt="logo" className="ms-8" />
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
                                          <Dropdown.Item key={i}>
                                            <button
                                              onClick={Object.values(e)[0]}
                                            >
                                              {Object.keys(e)[0]}
                                            </button>
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
                                  >
                                    <button
                                      onClick={menu[category][item].function}
                                    >
                                      {item}
                                    </button>
                                    <IconChevronRight />
                                  </Dropdown.Item>
                                </Dropdown>
                              );
                            }
                            return (
                              <Dropdown.Item key={index}>
                                <button onClick={menu[category][item].function}>
                                  {item}
                                </button>
                              </Dropdown.Item>
                            );
                          })}
                        </Dropdown.Menu>
                      }
                    >
                      <div className="px-3 py-1 hover:bg-gray-100">
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
      )}
      <div className="p-2 px-5 flex justify-between items-center rounded-xl bg-slate-100 my-1 mx-6 text-slate-700">
        <div className="flex justify-start items-center">
          <Dropdown
            position="bottomLeft"
            style={{ width: "180px" }}
            render={
              <Dropdown.Menu>
                <Dropdown.Item icon={<IconCheckboxTick />}>
                  Header
                </Dropdown.Item>
                <Dropdown.Item icon={<IconCheckboxTick />}>
                  Overview
                </Dropdown.Item>
                <Dropdown.Item icon={<IconCheckboxTick />}>
                  Services
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item icon={<IconCheckboxTick />}>
                  Fullscreen
                </Dropdown.Item>
              </Dropdown.Menu>
            }
            trigger="click"
          >
            <div className="py-1 px-2 hover:bg-gray-300">
              <i className="fa-solid fa-table-list"></i> <IconCaretdown />
            </div>
          </Dropdown>
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
            <div className="py-1 px-2 hover:bg-gray-300">
              zoom <IconCaretdown />
            </div>
          </Dropdown>
          <button className="py-1 px-2 hover:bg-gray-300" title="Zoom in">
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Zoom out">
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <Divider layout="vertical" margin="8px" />
          <button className="py-1 px-2 hover:bg-gray-300" title="Undo">
            <i className="fa-solid fa-rotate-left "></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Redo">
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
            <div className="py-1 px-2 hover:bg-gray-300">
              <i className="fa-solid fa-plus"></i> <IconCaretdown />
            </div>
          </Dropdown>
          <button className="py-1 px-2 hover:bg-gray-300" title="Edit">
            <i className="fa-solid fa-pen-to-square"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Delete">
            <i className="fa-solid fa-trash"></i>
          </button>
          <Divider layout="vertical" margin="8px" />
          <button className="py-1 px-2 hover:bg-gray-300" title="Save">
            <i className="fa-regular fa-floppy-disk"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Commit">
            <i className="fa-solid fa-code-branch"></i>
          </button>
        </div>
        <button onClick={(e) => setShowToolBar((prev) => !prev)}>
          {showToolBar ? <IconChevronUp /> : <IconChevronDown />}
        </button>
      </div>
    </>
  );
}
