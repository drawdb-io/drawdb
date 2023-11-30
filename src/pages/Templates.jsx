import React from "react";
import logo_light from "../assets/logo_light_46.png";
import { Link } from "react-router-dom";

export default function Templates() {
  return (
    <div>
      <div className="sm:py-3 py-5 px-6 flex justify-between items-center select-none">
        <div className="flex items-center justify-start">
          <Link to="/">
            <img
              src={logo_light}
              alt="logo"
              className="me-2 sm:h-[28px] md:h-[46px]"
            />
          </Link>
          <div className="ms-4 sm:text-sm xl:text-xl font-semibold">
            Templates
          </div>
        </div>
      </div>
      <hr className="border-zinc-300" />
    </div>
  );
}
