import React from "react";
import menu from "./menu";
import { IconCaretUp, IconRight } from "@arco-design/web-react/icon";
import "@arco-design/web-react/dist/css/arco.css";

export default function ControlPanel() {
  return (
    <nav className="bg-gray-200 relative">
      <div className="flex justify-between items-center">
        <ul className="flex justify-start text-md ms-3 select-none relative">
          {Object.keys(menu).map((category) => (
            <div key={category}>
              <div className="peer px-3 py-1 bg-gray-200 hover:bg-gray-300 relative z-10">
                {category}
              </div>
              <ul className="hidden peer-hover:flex hover:flex w-[200px] flex-col bg-white drop-shadow-lg absolute z-20">
                {Object.keys(menu[category]).map((item, index) => {
                  if (menu[category][item].length > 0) {
                    return (
                      <div
                        key={index}
                        className="group relative px-5 py-3 hover:bg-gray-200 z-10"
                      >
                        <div className="flex justify-between items-center">
                          <li>{item}</li>
                          <IconRight />
                        </div>
                        <ul className="hidden group-hover:flex hover:flex w-[200px] flex-col bg-white drop-shadow-lg absolute z-30 top-0 left-full">
                          {menu[category][item].map((e) => (
                            <li
                              key={e}
                              className="px-5 py-3 hover:bg-gray-200 z-10"
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
                      className="px-5 py-3 hover:bg-gray-200 relative z-10"
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
        <button>
          <IconCaretUp />
        </button>
      </div>
      <div className="p-1">tools</div>
    </nav>
  );
}
