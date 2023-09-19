import { React, useState } from "react";
import { menu } from "../data/data";
import {
  IconCaretdown,
  IconChevronRight,
  IconShareStroked,
  IconChevronUp,
  IconChevronDown,
  IconPlus,
} from "@douyinfe/semi-icons";
import { Link } from "react-router-dom";
import icon from "../assets/icon_dark_64.png";
import {
  Avatar,
  AvatarGroup,
  Button,
  Divider,
  Dropdown,
} from "@douyinfe/semi-ui";

export default function ControlPanel() {
  const Tool = {
    TOOLBAR: 0,
    ZOOM: 1,
    UNDO: 2,
    REDO: 3,
    ADD: 4,
    COUNT: 5,
  };

  const [showToolBar, setShowToolBar] = useState(true);
  const [openZoom, setOpenZoom] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const invert = (e, tool) => {
    switch (tool) {
      case Tool.TOOLBAR:
        setShowToolBar((prev) => !prev);
        break;
      case Tool.ZOOM:
        setOpenZoom((prev) => !prev);
        setOpenAdd(false);
        break;
      case Tool.ADD:
        setOpenAdd((prev) => !prev);
        setOpenZoom(false);
        break;
      default:
        break;
    }
  };

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
                      style={{ width: "200px" }}
                      render={
                        <Dropdown.Menu>
                          {Object.keys(menu[category]).map((item, index) => {
                            if (menu[category][item].length > 0) {
                              return (
                                <Dropdown
                                  style={{ width: "120px" }}
                                  key={item}
                                  position={"rightTop"}
                                  render={
                                    <Dropdown.Menu>
                                      {menu[category][item].map((e) => (
                                        <Dropdown.Item key={e}>
                                          <div>{e}</div>
                                        </Dropdown.Item>
                                      ))}
                                    </Dropdown.Menu>
                                  }
                                >
                                  <Dropdown.Item
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center"
                                    }}
                                  >
                                    <div>{item}</div>
                                    <IconChevronRight />
                                  </Dropdown.Item>
                                </Dropdown>
                              );
                            }
                            return (
                              <Dropdown.Item key={index}>
                                {item}
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
                border: "1px solid white",
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
      <div className="p-1 flex justify-between items-center rounded-xl bg-slate-100 my-1 mx-6 text-slate-700">
        <div className="flex justify-start items-center">
          <div className="relative">
            <button className="ms-2 py-2 px-3 hover:bg-gray-300 relative">
              <i className="fa-solid fa-table-list"></i>
            </button>
            <Divider layout="vertical" margin="8px" />
            <button
              className="py-2 px-3 hover:bg-gray-300 relative"
              onClick={(e) => invert(e, Tool.ZOOM)}
            >
              zoom <IconCaretdown />
            </button>
            <ul
              className={`${
                openZoom ? "" : "hidden"
              } w-[200px] flex-col drop-shadow-lg bg-white py-1 ms-2 absolute z-20 top-full`}
            >
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                Fit window
              </li>
              <hr />
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">25%</li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">50%</li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">75%</li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                100%
              </li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                125%
              </li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                150%
              </li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                175%
              </li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                200%
              </li>
              <hr />
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                Custom
              </li>
            </ul>
          </div>
          <button className="py-1 px-2 hover:bg-gray-300" title="Zoom in">
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Zoom out">
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Undo">
            <i className="fa-solid fa-rotate-left "></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Redo">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Edit">
            <i className="fa-solid fa-pen-to-square"></i>
          </button>
          <div className="relative">
            <button
              className="py-1 px-2 hover:bg-gray-300 relative"
              title="Add"
              onClick={(e) => invert(e, Tool.ADD)}
            >
              <IconPlus />
              <IconCaretdown />
            </button>
            <ul
              className={`${
                openAdd ? "" : "hidden"
              } w-[200px] flex-col drop-shadow-lg bg-white py-1 absolute z-20 top-full`}
            >
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                Table
              </li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                Relationship
              </li>
              <li className="px-5 py-3 hover:bg-gray-200 relative z-20">
                Note
              </li>
            </ul>
          </div>
          <button className="py-1 px-2 hover:bg-gray-300" title="Delete">
            <i className="fa-solid fa-trash"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Move">
            <i className="fa-regular fa-hand"></i>
          </button>
          <button className="py-1 px-2 hover:bg-gray-300" title="Commit">
            <i className="fa-solid fa-code-commit"></i>
          </button>
        </div>
        <button onClick={(e) => invert(e, Tool.TOOLBAR)} className="me-3">
          {showToolBar ? <IconChevronUp /> : <IconChevronDown />}
        </button>
      </div>
    </>
  );
}
