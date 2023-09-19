import { React, useState } from "react";
import menu from "./menu";
import {
  IconCaretUp,
  IconCaretDown,
  IconRight,
} from "@arco-design/web-react/icon";
import "@arco-design/web-react/dist/css/arco.css";

export default function ControlPanel() {
  let cursor = 0;
  const iota = (restart = false) => {
    const temp = cursor;
    cursor++;
    return temp;
  };

  const Tool = {
    TOOLBAR: iota(),
    ZOOM: iota(),
    UNDO: iota(),
    REDO: iota(),
    ADD: iota(),
    COUNT: iota(),
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
        break;
      case Tool.ADD:
        setOpenAdd((prev) => !prev);
        break;
      default:
        break;
    }
  };

  return (
    <nav className="bg-gray-200 relative">
      <div className="flex justify-between items-center">
        <ul className="flex justify-start text-md ms-3 select-none relative">
          {Object.keys(menu).map((category) => (
            <div key={category}>
              <div className="peer px-3 py-1 bg-gray-200 hover:bg-gray-300 relative z-50">
                {category}
              </div>
              <ul className="hidden peer-hover:flex hover:flex w-[200px] flex-col bg-white drop-shadow-lg absolute z-50">
                {Object.keys(menu[category]).map((item, index) => {
                  if (menu[category][item].length > 0) {
                    return (
                      <div
                        key={index}
                        className="group relative px-5 py-3 hover:bg-gray-200 z-50"
                      >
                        <div className="flex justify-between items-center">
                          <li>{item}</li>
                          <IconRight />
                        </div>
                        <ul className="hidden group-hover:flex hover:flex w-[200px] flex-col bg-white drop-shadow-lg absolute z-50 top-0 left-full">
                          {menu[category][item].map((e) => (
                            <li
                              key={e}
                              className="px-5 py-3 hover:bg-gray-200 z-50"
                            >
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return (
                    <li
                      className="px-5 py-3 hover:bg-gray-200 relative z-50"
                      key={index}
                    >
                      {item}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </ul>
        <button onClick={(e) => invert(e, Tool.TOOLBAR)} className="me-3">
          {showToolBar ? <IconCaretUp /> : <IconCaretDown />}
        </button>
      </div>
      {showToolBar && (
        <div className="p-1 flex justify-start items-center">
          <div className="relative">
            <button
              className="ms-2 py-2 px-3 hover:bg-gray-300 relative"
              onClick={(e) => invert(e, Tool.ZOOM)}
            >
              zoom <IconCaretDown />
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
          <button className="py-1 px-2 hover:bg-gray-300" title="Undi">
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
              <i class="fa-solid fa-plus"></i> <IconCaretDown />
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
      )}
    </nav>
  );
}
