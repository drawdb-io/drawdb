import React from "react";
import { Link } from "react-router-dom";
import blank_pfp from "../assets/blank_pfp.webp";
import logo from "../assets/logo_80.png";

export default function Header(props) {
  return (
    <nav className="flex justify-between py-2 bg-blue text-white items-center">
      <Link to="/">
        <img width={136} src={logo} alt="logo" className="ms-8" />
      </Link>
      <div className="text-xl">{props.name}</div>
      <div className="flex justify-around items-center text-md me-8">
        <button className="me-6 border px-4 py-1 rounded-xl">
          <i className="fa-solid fa-lock me-2"></i>Share
        </button>
        <img src={blank_pfp} alt="profile" className="rounded-full h-8 w-8" />
      </div>
      
    </nav>
  );
}
