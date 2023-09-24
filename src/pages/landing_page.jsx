import React, { useState } from "react";
import { Link } from "react-router-dom";
import { IconCrossStroked } from "@douyinfe/semi-icons";
import logo from "../assets/logo_light_46.png";

export default function LandingPage() {
  const [showSurvey, setShowSurvey] = useState(true);

  return (
    <div>
      {showSurvey && (
        <div className="text-white font-semibold py-1.5 px-4 text-sm text-center bg-gradient-to-r from-slate-700 from-10% via-slate-500 via-30% to-90% to-slate-700">
          <Link to="/survey" className="hover:underline">
            Help us improve! Share your feedback.
          </Link>
          <div className="float-right">
            <button onClick={() => setShowSurvey(false)}>
              <IconCrossStroked size="small" />
            </button>
          </div>
        </div>
      )}
      <div>
        <div className="py-5 px-6 flex justify-between items-center">
          <div className="flex items-center justify-start">
            <Link to="/">
              <img src={logo} alt="logo" className="me-2" />
            </Link>
            <Link className="ms-4 text-lg font-semibold hover:text-indigo-700">
              Features
            </Link>
            <Link
              to="/editor"
              className="ms-4 text-lg font-semibold hover:text-indigo-700"
            >
              Editor
            </Link>
            <Link className="ms-4 text-lg font-semibold hover:text-indigo-700">
              Templates
            </Link>
            <Link className="ms-4 text-lg font-semibold hover:text-indigo-700">
              Download
            </Link>
          </div>
          <div>
            <Link to="" className="me-5 font-semibold">
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 bg-[#386b8f] hover:bg-[#4e8bb6] text-white font-semibold rounded-md"
            >
              Sign up
            </Link>
          </div>
        </div>
        <hr />
      </div>
    </div>
  );
}
