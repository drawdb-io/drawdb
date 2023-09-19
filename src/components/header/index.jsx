import React from "react";
import blank_pfp from "../../assets/blank_pfp.webp";
import logo from "../../assets/logo_80.png";
import "./index.css";

export default function Header(props) {
  return (
    <nav className="flex justify-between py-4 bg-blue text-white items-center">
      <img width={142} src={logo} alt="logo" className="ms-5" />
      <div className="text-xl">{props.name}</div>
      <div className="flex justify-around items-center text-md me-5">
        <button className="me-4 border px-3 py-1 rounded-lg">
          <i class="fa-solid fa-lock me-2"></i>Share
        </button>
        <img src={blank_pfp} alt="profile" className="rounded-full h-10 w-10" />
      </div>
    </nav>
  );
}
