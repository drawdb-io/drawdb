import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_light_46.png";
import ReCAPTCHA from "react-google-recaptcha";

export default function SignUp() {
  useEffect(() => {
    document.title = "Create account | drawDB";
  });
  return (
    <div className="flex h-screen">
      <div className="bg-indigo-300 w-[50%]"></div>
      <div className="m-auto">
        <div>
          <Link to="/" className="text-center">
            <img src={logo} alt="logo" className="me-2" />
          </Link>
          <div className="text-xl my-2">Create your account</div>
          <div className="flex items-center justify-center my-2">
            <hr className="border-slate-400 flex-grow" />
            <div className="text-sm font-semibold m-2 text-slate-400">or</div>
            <hr className="border-slate-400 flex-grow" />
          </div>
          <input className="py-2 px-3 block w-full my-2 border rounded border-slate-400" />
          <input className="py-2 px-3 block w-full my-2 border rounded border-slate-400" />
          <input className="py-2 px-3 block w-full my-2 border rounded border-slate-400" />
          <ReCAPTCHA
            sitekey={process.env.REACT_APP_CAPTCHA_SITE_KEY}
            onChange={() => {}}
          />
          <button className="px-3 py-2.5 my-2 bg-[#386b8f] hover:bg-[#4e8bb6] rounded text-white text-sm font-semibold">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
