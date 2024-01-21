import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconCrossStroked } from "@douyinfe/semi-icons";
import SimpleCanvas from "../components/SimpleCanvas"
import Navbar from "../components/Navbar";
import { diagram } from "../data/heroDiagram"
import Reveal from "../animations/Reveal";

export default function LandingPage() {
  const [showSurvey, setShowSurvey] = useState(true);

  useEffect(() => {
    document.body.setAttribute("theme-mode", "light");
    document.title =
      "drawDB | Online database diagram editor and SQL generator";
  });

  return (
    <div>
      <div className="flex flex-col h-screen">
        {showSurvey && (
          <div className="text-white font-semibold py-1.5 px-4 text-sm text-center bg-gradient-to-r from-slate-700 from-10% via-slate-500 to-slate-700">
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
        <div className="flex-1 flex-col relative">
          <div className="h-full">
            <SimpleCanvas diagram={diagram} zoom={0.85} />
          </div>
          <div className="absolute left-0 top-[50%] translate-y-[-50%] p-8 text-zinc-800 text-center">
            <Reveal>
              <div className="text-4xl font-bold tracking-wide">
                <h1 className="py-1 bg-gradient-to-r from-slate-700 from-10% via-slate-500 to-slate-700 inline-block text-transparent bg-clip-text">
                  Draw, Copy, and Paste
                </h1>
              </div>
              <div className="text-lg font-semibold mt-3">
                Free, simple, and intuitive database design tool and SQL generator.
              </div>
            </Reveal>
            <div className="mt-4 flex gap-4 justify-center font-semibold">
              <button className="bg-white shadow-lg px-9 py-2 rounded border border-zinc-200 hover:bg-zinc-100 transition-all duration-200" onClick={() => document
                .getElementById("learn-more")
                .scrollIntoView({ behavior: "smooth" })}>
                Learn more
              </button>
              <Link to="/editor" className="bg-slate-700 text-white px-4 py-2 rounded shadow-lg hover:bg-slate-600 transition-all duration-200">
                Try it for yourself
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div id="learn-more">
        more stuff
      </div>
    </div>
  );
}
