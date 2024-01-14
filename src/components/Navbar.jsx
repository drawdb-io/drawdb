import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_light_46.png";
import { SideSheet } from "@douyinfe/semi-ui";
import { IconMenu } from "@douyinfe/semi-icons";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <>
      <div className="py-5 px-8 sm:px-4 flex justify-between items-center">
        <div className="flex items-center justify-start">
          <Link to="/">
            <img src={logo} alt="logo" className="me-2 sm:h-[32px]" />
          </Link>
          <div className="md:hidden">
            <Link className="ms-6 text-lg font-semibold hover:text-indigo-700">
              Features
            </Link>
            <Link
              to="/editor"
              className="ms-6 text-lg font-semibold hover:text-indigo-700"
            >
              Editor
            </Link>
            <Link
              to="/templates"
              className="ms-6 text-lg font-semibold hover:text-indigo-700"
            >
              Templates
            </Link>
          </div>
        </div>
        <button
          onClick={() => setOpenMenu((prev) => !prev)}
          className="hidden md:inline-block h-[24px]"
        >
          <IconMenu size="extra-large" />
        </button>
      </div>
      <hr />
      <SideSheet
        title={<img src={logo} alt="logo" className="sm:h-[32px]" />}
        visible={openMenu}
        onCancel={() => setOpenMenu(false)}
        width={window.innerWidth}
      >
        <Link className="hover:bg-zinc-100 block p-3 text-base font-semibold">
          Features
        </Link>
        <hr />
        <Link
          to="/editor"
          className="hover:bg-zinc-100 block p-3 text-base font-semibold"
        >
          Editor
        </Link>
        <hr />
        <Link
          to="/templates"
          className="hover:bg-zinc-100 block p-3 text-base font-semibold"
        >
          Templates
        </Link>
        <hr />
      </SideSheet>
    </>
  );
}
