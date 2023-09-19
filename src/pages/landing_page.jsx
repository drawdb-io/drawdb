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
        <div className="md:py-5 px-6 flex justify-between">
          <div className="md:flex md:items-center md:justify-start">
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
          <button className="px-6 py-2 bg-[#386b8f] text-white font-semibold rounded">
            Log in
          </button>
        </div>
        <hr />
      </div>
    </div>
  );
}
