import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconCrossStroked } from "@douyinfe/semi-icons";
import Navbar from "../components/Navbar";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";

export default function LandingPage() {
  const [showSurvey, setShowSurvey] = useState(true);

  const clearDatabase = () => {
    db.delete()
      .then(() => {
        console.log("Database cleared.");
      })
      .catch((error) => {
        console.error("Failed to clear the database:", error);
      });
  };

  const diagrams = useLiveQuery(() => db.diagrams.toArray());
  useEffect(() => {
    console.log(diagrams);
  }, [diagrams]);

  useEffect(() => {
    document.body.setAttribute("theme-mode", "light");
    document.title =
      "drawDB | Online database diagram editor and SQL generator";
  });

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
      <Navbar />
      <button onClick={clearDatabase}>delete db</button>
    </div>
  );
}
